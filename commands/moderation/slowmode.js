const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Définir le slowmode du salon')
    .addIntegerOption(opt =>
      opt.setName('secondes')
        .setDescription('Temps en secondes entre chaque message (0 = désactiver)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du slowmode'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const secondes = interaction.options.getInteger('secondes');
    const raison = interaction.options.getString('raison') || 'Aucune';

    await interaction.channel.setRateLimitPerUser(secondes, raison);
    const msg = secondes === 0
      ? '✅ Slowmode désactivé.'
      : `✅ Slowmode défini à **${secondes}** seconde(s).`;
    await interaction.reply({ content: msg });
  },
};
