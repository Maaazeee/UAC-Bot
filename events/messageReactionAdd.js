const { Events, EmbedBuilder } = require('discord.js');
const { get } = require('../data/config');
const { addEntrant } = require('../data/giveaways');
const db = require('../data/database');

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});

    if (reaction.emoji.name === '🎉') {
      const giveaway = addEntrant(reaction.message.id, user.id);
    }

    const config = get(reaction.message.guildId, 'reactionRoles');
    if (config) {
      const msgRoles = config[reaction.message.id];
      if (msgRoles) {
        const entry = msgRoles.find(r => r.emoji === reaction.emoji.name);
        if (entry) {
          const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
          if (member) {
            if (member.roles.cache.has(entry.roleId)) {
              await member.roles.remove(entry.roleId);
            } else {
              await member.roles.add(entry.roleId);
            }
          }
        }
      }
    }

    const starChannelId = get(reaction.message.guildId, 'starboardChannel');
    if (!starChannelId) return;
    if (reaction.emoji.name !== '⭐') return;
    if (reaction.message.author?.id === user.id) return;

    const min = get(reaction.message.guildId, 'starboardMin') || 3;
    const count = reaction.count;
    if (count < min) return;

    const existing = db.prepare('SELECT * FROM starboard WHERE guildId = ? AND messageId = ?').get(reaction.message.guildId, reaction.message.id);
    const starChannel = reaction.message.guild.channels.cache.get(starChannelId);
    if (!starChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F).setAuthor({ name: reaction.message.author?.tag || 'Inconnu', iconURL: reaction.message.author?.displayAvatarURL() })
      .setDescription(reaction.message.content || '*Aucun contenu*')
      .setFooter({ text: `⭐ ${count}` })
      .setTimestamp();

    if (reaction.message.attachments.size > 0) {
      const att = reaction.message.attachments.first();
      if (att.contentType?.startsWith('image/')) embed.setImage(att.url);
    }

    if (existing) {
      const msg = await starChannel.messages.fetch(existing.id).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [EmbedBuilder.from(msg.embeds[0]).setFooter({ text: `⭐ ${count}` })] });
      }
    } else {
      const sent = await starChannel.send({ content: `📌 [Message](${reaction.message.url})`, embeds: [embed] }).catch(() => null);
      if (sent) {
        db.prepare('INSERT INTO starboard (guildId, messageId, channelId, authorId, stars) VALUES (?, ?, ?, ?, ?)').run(
          reaction.message.guildId, reaction.message.id, sent.id, reaction.message.author?.id || '', count
        );
      }
    }
  },
};
