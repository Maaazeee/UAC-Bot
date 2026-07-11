const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addReminder } = require('../../data/reminders');

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2];
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (ms[unit] || 0);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Planifie un rappel')
    .addStringOption(o => o.setName('temps').setDescription('Ex: 10m, 1h, 2d').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Message du rappel').setRequired(true)),
  async execute(interaction) {
    const timeStr = interaction.options.getString('temps');
    const ms = parseDuration(timeStr);
    if (!ms || ms < 10000) return interaction.reply({ content: '❌ Temps invalide. Utilise 10s, 5m, 1h, 2d... (min 10s)', ephemeral: true });
    const date = new Date(Date.now() + ms);
    const id = addReminder(interaction.user.id, interaction.channelId, date, interaction.options.getString('message'));
    const embed = new EmbedBuilder()
      .setColor(0x00AE86).setTitle('⏰ Rappel planifié')
      .setDescription(`Dans **${timeStr}** : ${interaction.options.getString('message')}`)
      .setFooter({ text: `ID: ${id}` });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
