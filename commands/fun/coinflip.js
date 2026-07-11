const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Pile ou face'),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F).setTitle('🪙 Pile ou Face')
      .setDescription(`**${result}**`);
    await interaction.reply({ embeds: [embed] });
  },
};
