const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelchannel')
    .setDescription('Configurer les récompenses salon par niveau')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Attribuer un salon privé à un niveau')
        .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau requis').setRequired(true).setMinValue(1))
        .addChannelOption(opt => opt.setName('salon').setDescription('Salon à débloquer').setRequired(true)),
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Supprimer une récompense salon')
        .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau concerné').setRequired(true).setMinValue(1)),
    )
    .addSubcommand(sub =>
      sub.setName('liste').setDescription('Voir les récompenses salon configurées'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { get, set } = require('../../data/config');
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const niveau = interaction.options.getInteger('niveau');
      const salon = interaction.options.getChannel('salon');
      const rewards = get(interaction.guildId, 'levelChannelRewards') || {};
      rewards[niveau] = salon.id;
      set(interaction.guildId, 'levelChannelRewards', rewards);
      return interaction.reply({ content: `✅ Niveau **${niveau}** → ${salon} (accès débloqué).` });
    }

    if (sub === 'remove') {
      const niveau = interaction.options.getInteger('niveau');
      const rewards = get(interaction.guildId, 'levelChannelRewards') || {};
      if (!rewards[niveau]) return interaction.reply({ content: '❌ Aucune récompense pour ce niveau.', ephemeral: true });
      delete rewards[niveau];
      set(interaction.guildId, 'levelChannelRewards', rewards);
      return interaction.reply({ content: `✅ Récompense salon du niveau **${niveau}** supprimée.` });
    }

    const rewards = get(interaction.guildId, 'levelChannelRewards') || {};
    const entries = Object.entries(rewards).sort((a, b) => a[0] - b[0]);
    if (entries.length === 0) return interaction.reply({ content: '📭 Aucune récompense salon configurée.', ephemeral: true });
    const lines = entries.map(([lvl, chId]) => `• Niveau **${lvl}** → <#${chId}>`);
    const embed = new EmbedBuilder()
      .setTitle('🔓 Récompenses salon')
      .setDescription(lines.join('\n'))
      .setColor(0x00AE86);
    await interaction.reply({ embeds: [embed] });
  },
};
