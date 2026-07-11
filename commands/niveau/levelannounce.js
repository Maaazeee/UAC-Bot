const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelannounce')
    .setDescription('Configurer le salon des annonces de niveau')
    .addChannelOption(opt =>
      opt.setName('salon').setDescription('Salon pour les annonces (laisser vide pour désactiver)'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');
    const salon = interaction.options.getChannel('salon');
    set(interaction.guildId, 'levelAnnounce', salon?.id || null);

    const embed = new EmbedBuilder()
      .setTitle('📢 Annonces de niveau')
      .setDescription(salon
        ? `Les annonces de niveau seront envoyées dans ${salon}.`
        : 'Annonces de niveau désactivées.')
      .setColor(salon ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
