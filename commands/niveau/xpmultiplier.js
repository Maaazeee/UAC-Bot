const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xpmultiplier')
    .setDescription('Configurer les multiplicateurs XP')
    .addSubcommand(sub =>
      sub.setName('role')
        .setDescription('Ajouter/supprimer un multiplicateur pour un rôle')
        .addRoleOption(opt => opt.setName('rôle').setDescription('Le rôle').setRequired(true))
        .addNumberOption(opt => opt.setName('multiplicateur').setDescription('x1 à x5 (laisser vide pour supprimer)').setMinValue(1).setMaxValue(5)),
    )
    .addSubcommand(sub =>
      sub.setName('salon')
        .setDescription('Ajouter/supprimer un multiplicateur pour un salon')
        .addChannelOption(opt => opt.setName('salon').setDescription('Le salon').setRequired(true))
        .addNumberOption(opt => opt.setName('multiplicateur').setDescription('x1 à x5 (laisser vide pour supprimer)').setMinValue(1).setMaxValue(5)),
    )
    .addSubcommand(sub =>
      sub.setName('liste').setDescription('Voir les multiplicateurs actifs'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { get, set } = require('../../data/config');
    const sub = interaction.options.getSubcommand();

    if (sub === 'role') {
      const role = interaction.options.getRole('rôle');
      const mult = interaction.options.getNumber('multiplicateur');
      const roles = get(interaction.guildId, 'xpMultiplierRoles') || {};
      if (!mult) {
        delete roles[role.id];
        set(interaction.guildId, 'xpMultiplierRoles', roles);
        return interaction.reply({ content: `✅ Multiplicateur du rôle ${role} supprimé.` });
      }
      roles[role.id] = mult;
      set(interaction.guildId, 'xpMultiplierRoles', roles);
      return interaction.reply({ content: `✅ ${role} donne maintenant **x${mult}** XP.` });
    }

    if (sub === 'salon') {
      const salon = interaction.options.getChannel('salon');
      const mult = interaction.options.getNumber('multiplicateur');
      const channels = get(interaction.guildId, 'xpMultiplierChannels') || {};
      if (!mult) {
        delete channels[salon.id];
        set(interaction.guildId, 'xpMultiplierChannels', channels);
        return interaction.reply({ content: `✅ Multiplicateur du salon ${salon} supprimé.` });
      }
      channels[salon.id] = mult;
      set(interaction.guildId, 'xpMultiplierChannels', channels);
      return interaction.reply({ content: `✅ ${salon} donne maintenant **x${mult}** XP.` });
    }

    const roles = get(interaction.guildId, 'xpMultiplierRoles') || {};
    const channels = get(interaction.guildId, 'xpMultiplierChannels') || {};
    const lines = [];
    if (Object.keys(roles).length) lines.push('**Rôles:**', ...Object.entries(roles).map(([id, m]) => `• <@&${id}> → x${m}`));
    if (Object.keys(channels).length) lines.push('**Salons:**', ...Object.entries(channels).map(([id, m]) => `• <#${id}> → x${m}`));
    if (!lines.length) return interaction.reply({ content: '📭 Aucun multiplicateur configuré.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('⚡ Multiplicateurs XP')
      .setDescription(lines.join('\n'))
      .setColor(0x00AE86);
    await interaction.reply({ embeds: [embed] });
  },
};
