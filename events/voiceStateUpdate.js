const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { get } = require('../data/config');
const { addXp } = require('../data/levels');
const { voiceTracker } = require('../data/state');
const db = require('../data/database');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    if (oldState.channelId && !newState.channelId) {
      const entry = voiceTracker.get(oldState.member.id);
      if (entry && entry.channel === oldState.channelId) {
        if (get(oldState.guild.id, 'xpVoiceEnabled')) {
          const elapsed = (Date.now() - entry.joinedAt) / 1000;
          if (elapsed >= 60) {
            const mins = Math.floor(elapsed / 60);
            const xpGain = mins * 10;
            const dailyCap = get(oldState.guild.id, 'xpDailyCap') || 0;
            addXp(oldState.guild.id, oldState.member.id, xpGain, dailyCap);
            try { require('../data/clans').contributeXp(oldState.guild.id, oldState.member.id, xpGain); } catch {}

          }
        }
        voiceTracker.delete(oldState.member.id);
      }

      const tempRow = db.prepare('SELECT * FROM temp_voice WHERE channelId = ?').get(oldState.channelId);
      if (tempRow && oldState.channel.members.size === 0) {
        db.prepare('DELETE FROM temp_voice WHERE channelId = ?').run(oldState.channelId);
        oldState.channel.delete().catch(() => {});
      }
    }
    if (!oldState.channelId && newState.channelId) {
      if (get(newState.guild.id, 'xpVoiceEnabled')) {
        voiceTracker.set(newState.member.id, { channel: newState.channelId, joinedAt: Date.now() });
      }

      const sourceId = get(newState.guild.id, 'tempVoiceSource');
      if (sourceId && newState.channelId === sourceId) {
        const categoryId = get(newState.guild.id, 'tempVoiceCategory');
        const channel = await newState.guild.channels.create({
          name: `🔊 ${newState.member.displayName}`,
          type: ChannelType.GuildVoice,
          parent: categoryId || undefined,
          permissionOverwrites: [
            { id: newState.guild.roles.everyone, allow: [PermissionFlagsBits.Connect] },
            { id: newState.member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] },
          ],
        });
        db.prepare('INSERT INTO temp_voice (guildId, channelId, ownerId) VALUES (?, ?, ?)').run(newState.guild.id, channel.id, newState.member.id);
        await newState.setChannel(channel).catch(() => {});
      }
    }
  },
};
