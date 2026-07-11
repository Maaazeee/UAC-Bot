const { Events, EmbedBuilder } = require('discord.js');
const { get } = require('../data/config');

module.exports = {
  name: Events.GuildAuditLogEntryCreate,
  execute(auditLog, guild) {
    const logChannelId = get(guild.id, 'logChannel');
    if (!logChannelId) return;
    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const colors = { 22: 0xFF0000, 23: 0xFFA500, 24: 0xFFFF00 };
    const labels = { 22: '🔨 Ban', 23: '👢 Kick', 24: '⏳ Timeout' };
    if (!labels[auditLog.action]) return;

    const embed = new EmbedBuilder()
      .setTitle(labels[auditLog.action])
      .setDescription(`**Cible:** ${auditLog.target?.tag || auditLog.targetId}\n**Modérateur:** ${auditLog.executor?.tag}\n**Raison:** ${auditLog.reason || 'Aucune'}`)
      .setColor(colors[auditLog.action])
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  },
};
