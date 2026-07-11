const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogs')
    .setDescription('Définir le salon des logs d\'audit')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Le salon pour les logs')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const salon = interaction.options.getChannel('salon');
    require('../../data/config').set(interaction.guildId, 'logChannel', salon.id);

    const embed = new EmbedBuilder()
      .setTitle('✅ Logs configurés')
      .setDescription(`Les logs seront envoyés dans ${salon}`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
