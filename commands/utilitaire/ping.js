const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vérifier que le bot répond'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
    await interaction.editReply(`🏓 Pong! Latence: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
  },
};
