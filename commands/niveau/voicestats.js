const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicestats')
    .setDescription('Voir le temps passé en vocal')
    .addUserOption(o => o.setName('membre').setDescription('Le membre à consulter')),
  async execute(interaction) {
    const target = interaction.options.getMember('membre') || interaction.member;
    const db = require('../../data/database');
    const row = db.prepare('SELECT voiceTime FROM levels WHERE guildId = ? AND userId = ?').get(interaction.guildId, target.id);
    const seconds = row?.voiceTime || 0;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const embed = new EmbedBuilder()
      .setTitle(`🎤 ${target.user.displayName} — Temps vocal`)
      .setDescription(`**${hours}h ${mins}m** au total`)
      .setColor(0x9B59B6);
    if (target.id !== interaction.user.id) embed.setFooter({ text: 'Demandé par ' + interaction.user.tag });
    return interaction.reply({ embeds: [embed] });
  },
};
