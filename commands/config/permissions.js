const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Gère les permissions par rôle pour les commandes')
    .addSubcommand(s => s.setName('set').setDescription('Restreindre une commande à un rôle')
      .addStringOption(o => o.setName('commande').setDescription('Nom de la commande').setRequired(true).setAutocomplete(true))
      .addRoleOption(o => o.setName('role').setDescription('Rôle autorisé').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Retirer la restriction d\'une commande')
      .addStringOption(o => o.setName('commande').setDescription('Nom de la commande').setRequired(true).setAutocomplete(true)))
    .addSubcommand(s => s.setName('list').setDescription('Liste les restrictions'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const cmd = interaction.options.getString('commande').toLowerCase();
      const role = interaction.options.getRole('role');
      const key = `perm:${cmd}`;
      let roles = [];
      try { roles = JSON.parse(get(interaction.guildId, key) || '[]'); } catch {}
      if (!roles.includes(role.id)) roles.push(role.id);
      set(interaction.guildId, key, JSON.stringify(roles));
      return interaction.reply({ content: `✅ \`/${cmd}\` restreint à <@&${role.id}>`, ephemeral: true });
    }
    if (sub === 'remove') {
      const cmd = interaction.options.getString('commande').toLowerCase();
      set(interaction.guildId, `perm:${cmd}`, '[]');
      return interaction.reply({ content: `✅ Restrictions de \`/${cmd}\` supprimées`, ephemeral: true });
    }
    if (sub === 'list') {
      const { get } = require('../../data/config');
      const configs = require('../../data/database').prepare('SELECT key, value FROM config WHERE guildId = ? AND key LIKE ?').all(interaction.guildId, 'perm:%');
      if (!configs.length) return interaction.reply({ content: 'Aucune restriction configurée.', ephemeral: true });
      const lines = configs.map(c => {
        const cmd = c.key.replace('perm:', '');
        const roles = JSON.parse(c.value || '[]').map(r => `<@&${r}>`).join(', ');
        return `\`/${cmd}\` → ${roles}`;
      });
      return interaction.reply({ content: `📋 **Restrictions :**\n${lines.join('\n')}`, ephemeral: true });
    }
  },
};
