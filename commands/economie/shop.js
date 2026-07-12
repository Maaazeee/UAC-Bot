const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../data/database');
const { getBalance, addBalance, removeBalance } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Gère la boutique du serveur')
    .addSubcommand(s => s.setName('list').setDescription('Affiche les articles'))
    .addSubcommand(s => s.setName('buy').setDescription('Acheter un article').addStringOption(o => o.setName('article').setDescription('ID de l\'article').setRequired(true)))
    .addSubcommand(s => s.setName('inventory').setDescription('Voir ton inventaire'))
    .addSubcommand(s => s.setName('use').setDescription('Utiliser un objet consommable').addStringOption(o => o.setName('article').setDescription('ID de l\'article').setRequired(true)))
    .addSubcommand(s => s.setName('add').setDescription('[Admin] Ajouter un article')
      .addStringOption(o => o.setName('nom').setDescription('Nom').setRequired(true))
      .addIntegerOption(o => o.setName('prix').setDescription('Prix').setRequired(true).setMinValue(1))
      .addRoleOption(o => o.setName('role').setDescription('Rôle à acheter'))
      .addStringOption(o => o.setName('description').setDescription('Description'))
      .addStringOption(o => o.setName('type').setDescription('Type d\'article').addChoices({ name: 'Rôle', value: 'role' }, { name: 'Consommable', value: 'consumable' }, { name: 'Permanent', value: 'permanent' }))
      .addIntegerOption(o => o.setName('max').setDescription('Quantité max par membre (0=illimité)')))
    .addSubcommand(s => s.setName('remove').setDescription('[Admin] Supprimer un article').addStringOption(o => o.setName('article').setDescription('ID de l\'article').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if ((sub === 'add' || sub === 'remove') && !isAdmin) {
      return interaction.reply({ content: '❌ Permission administrateur requise.', ephemeral: true });
    }
    if (sub === 'inventory') {
      const items = db.prepare('SELECT i.itemId, i.quantity, s.name, s.description, s.type FROM inventory i LEFT JOIN shop s ON i.guildId = s.guildId AND i.itemId = s.itemId WHERE i.guildId = ? AND i.userId = ?').all(interaction.guildId, interaction.user.id);
      if (!items.length) return interaction.reply({ content: '📦 Inventaire vide.', ephemeral: true });
      const embed = new EmbedBuilder().setTitle('📦 Ton inventaire').setColor(0x3498DB);
      for (const item of items) {
        embed.addFields({ name: `${item.name} x${item.quantity}`, value: `Type: ${item.type}\nID: \`${item.itemId}\`` });
      }
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'use') {
      const itemId = interaction.options.getString('article');
      const inv = db.prepare('SELECT * FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').get(interaction.guildId, interaction.user.id, itemId);
      if (!inv) return interaction.reply({ content: '❌ Tu ne possèdes pas cet article.', ephemeral: true });
      const item = db.prepare('SELECT * FROM shop WHERE guildId = ? AND itemId = ?').get(interaction.guildId, itemId);
      if (!item || item.type !== 'consumable') return interaction.reply({ content: '❌ Cet article n\'est pas consommable.', ephemeral: true });
      if (item.roleId) {
        await interaction.guild.members.fetch(interaction.user.id).then(m => m.roles.add(item.roleId));
      }
      if (inv.quantity <= 1) {
        db.prepare('DELETE FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').run(interaction.guildId, interaction.user.id, itemId);
      } else {
        db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE guildId = ? AND userId = ? AND itemId = ?').run(interaction.guildId, interaction.user.id, itemId);
      }
      return interaction.reply({ content: `✅ Tu as utilisé **${item.name}** !` });
    }
    if (sub === 'list') {
      const items = db.prepare('SELECT * FROM shop WHERE guildId = ?').all(interaction.guildId);
      if (!items.length) return interaction.reply({ content: '🛒 Boutique vide.', ephemeral: true });
      const embed = new EmbedBuilder().setTitle('🛒 Boutique').setColor(0xF1C40F);
      for (const item of items) {
        const stock = item.maxQuantity > 0 ? ` (max: ${item.maxQuantity})` : '';
        embed.addFields({ name: `${item.name} — ${item.price} 🪙${stock}`, value: `ID: \`${item.itemId}\`\nType: ${item.type}\n${item.description || ''}${item.roleId ? `\nRôle: <@&${item.roleId}>` : ''}` });
      }
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'buy') {
      const item = db.prepare('SELECT * FROM shop WHERE guildId = ? AND itemId = ?').get(interaction.guildId, interaction.options.getString('article'));
      if (!item) return interaction.reply({ content: '❌ Article introuvable.', ephemeral: true });
      if (item.maxQuantity > 0) {
        const owned = db.prepare('SELECT COALESCE(SUM(quantity), 0) as qty FROM inventory WHERE guildId = ? AND userId = ? AND itemId = ?').get(interaction.guildId, interaction.user.id, item.itemId);
        if (owned.qty >= item.maxQuantity) return interaction.reply({ content: `❌ Tu as déjà atteint la limite de **${item.maxQuantity}** pour cet article.`, ephemeral: true });
      }
      const bal = getBalance(interaction.guildId, interaction.user.id);
      if (bal < item.price) return interaction.reply({ content: `❌ Il te faut **${item.price}** 🪙, tu as **${bal}** 🪙.`, ephemeral: true });
      removeBalance(interaction.guildId, interaction.user.id, item.price);
      if (item.type === 'role' && item.roleId) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(item.roleId)) return interaction.reply({ content: '❌ Tu as déjà ce rôle.', ephemeral: true });
        await member.roles.add(item.roleId);
      } else {
        db.prepare('INSERT INTO inventory (guildId, userId, itemId, quantity) VALUES (?, ?, ?, 1) ON CONFLICT(guildId, userId, itemId) DO UPDATE SET quantity = quantity + 1').run(interaction.guildId, interaction.user.id, item.itemId);
      }
      return interaction.reply({ content: `✅ Tu as acheté **${item.name}** pour **${item.price}** 🪙 !` });
    }
    if (sub === 'add') {
      const id = require('crypto').randomUUID();
      const itemType = interaction.options.getString('type') || 'role';
      db.prepare('INSERT INTO shop (guildId, itemId, name, price, roleId, description, type, maxQuantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        interaction.guildId, id, interaction.options.getString('nom'), interaction.options.getInteger('prix'),
        interaction.options.getRole('role')?.id || null, interaction.options.getString('description') || '',
        itemType, interaction.options.getInteger('max') || 0
      );
      return interaction.reply({ content: `✅ Article ajouté (ID: \`${id}\`)`, ephemeral: true });
    }
    if (sub === 'remove') {
      const r = db.prepare('DELETE FROM shop WHERE guildId = ? AND itemId = ?').run(interaction.guildId, interaction.options.getString('article'));
      return interaction.reply({ content: r.changes ? '✅ Article supprimé.' : '❌ Article introuvable.', ephemeral: true });
    }
  },
};
