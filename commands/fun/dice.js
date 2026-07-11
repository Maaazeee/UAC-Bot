const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Lance un dé')
    .addIntegerOption(o => o.setName('faces').setDescription('Nombre de faces (défaut 6)').setMinValue(2).setMaxValue(100)),
  async execute(interaction) {
    const faces = interaction.options.getInteger('faces') || 6;
    const result = Math.floor(Math.random() * faces) + 1;
    const embed = new EmbedBuilder()
      .setColor(0xE67E22).setTitle('🎲 Dés')
      .setDescription(`**${result}** / ${faces}`);
    await interaction.reply({ embeds: [embed] });
  },
};
