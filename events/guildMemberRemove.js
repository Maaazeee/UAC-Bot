const { Events } = require('discord.js');
const { get } = require('../data/config');

module.exports = {
  name: Events.GuildMemberRemove,
  execute(member) {
    const channelId = get(member.guild.id, 'goodbyeChannel');
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const msg = get(member.guild.id, 'goodbyeMessage') || '{user} a quitté **{server}**. 👋';
    const formatted = msg.replace(/{user}/g, member.user.tag).replace(/{server}/g, member.guild.name);
    channel.send(formatted).catch(() => {});
  },
};
