const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactrole')
    .setDescription('Créer un message à réaction pour les rôles')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Salon où envoyer le message')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Texte du message')
        .setRequired(true),
    )
    .addRoleOption(opt =>
      opt.setName('role1')
        .setDescription('Rôle à attribuer')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('emoji1')
        .setDescription('Émoji pour le rôle 1')
        .setRequired(true),
    )
    .addRoleOption(opt =>
      opt.setName('role2')
        .setDescription('2e rôle (optionnel)'),
    )
    .addStringOption(opt =>
      opt.setName('emoji2')
        .setDescription('Émoji pour le rôle 2'),
    )
    .addRoleOption(opt =>
      opt.setName('role3')
        .setDescription('3e rôle (optionnel)'),
    )
    .addStringOption(opt =>
      opt.setName('emoji3')
        .setDescription('Émoji pour le rôle 3'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const salon = interaction.options.getChannel('salon');
    const texte = interaction.options.getString('message');

    const roles = [];
    for (let i = 1; i <= 3; i++) {
      const role = interaction.options.getRole(`role${i}`);
      const emoji = interaction.options.getString(`emoji${i}`);
      if (role && emoji) roles.push({ role, emoji });
    }

    if (roles.length === 0) return interaction.reply({ content: '❌ Ajoute au moins un rôle avec son émoji.', ephemeral: true });

    const desc = roles.map(r => `${r.emoji} → ${r.role}`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('🎭 Réagis pour obtenir un rôle')
      .setDescription(`${texte}\n\n${desc}`)
      .setColor(0x00AE86);

    const msg = await salon.send({ embeds: [embed] });

    for (const r of roles) {
      await msg.react(r.emoji);
    }

    const { get, set } = require('../../data/config');
    const config = get(interaction.guildId, 'reactionRoles') || {};
    config[msg.id] = roles.map(r => ({ emoji: r.emoji, roleId: r.role.id }));
    set(interaction.guildId, 'reactionRoles', config);

    await interaction.reply({ content: `✅ Message de réaction-rôle créé dans ${salon}`, ephemeral: true });
  },
};
