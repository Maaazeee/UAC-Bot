const { Events, EmbedBuilder } = require('discord.js');
const { get } = require('../data/config');

module.exports = {
  name: Events.MessageDelete,
  execute(message) {
    if (!message.guild) return;
    const logChannelId = get(message.guildId, 'logChannel');
    if (!logChannelId) return;
    const channel = message.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message supprimé')
      .setDescription(`**Auteur:** ${message.author?.tag || 'Inconnu'} (${message.author?.id})\n**Salon:** ${message.channel}\n**Contenu:** ${message.content || 'Aucun'}`)
      .setColor(0xFF0000)
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  },
};
