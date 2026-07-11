const { Events } = require('discord.js');
const { get } = require('../data/config');
const { addXp } = require('../data/levels');
const { spamMap, xpCooldown } = require('../data/state');

module.exports = {
  name: Events.MessageCreate,
  execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guildId;
    const db = require('../data/database');

    const afkRow = db.prepare('SELECT * FROM afk WHERE guildId = ? AND userId = ?').get(guildId, message.author.id);
    if (afkRow) {
      db.prepare('DELETE FROM afk WHERE guildId = ? AND userId = ?').run(guildId, message.author.id);
      message.channel.send(`👋 ${message.author}, bienvenue ! J'ai enlevé ton AFK.`).catch(() => {});
    }

    if (message.mentions.users.size > 0) {
      for (const [, user] of message.mentions.users) {
        if (user.bot) continue;
        const targetAfk = db.prepare('SELECT * FROM afk WHERE guildId = ? AND userId = ?').get(guildId, user.id);
        if (targetAfk) {
          const since = Math.floor((Date.now() - new Date(targetAfk.since).getTime()) / 60000);
          message.channel.send(`💤 **${user.displayName}** est AFK : **${targetAfk.reason}** (depuis ${since} min)`).catch(() => {});
        }
      }
    }

    const xpNow = Date.now();
    if (!xpCooldown.has(message.author.id) || xpNow - xpCooldown.get(message.author.id) > 60000) {
      xpCooldown.set(message.author.id, xpNow);

      let multiplier = 1;
      const roleMult = get(guildId, 'xpMultiplierRoles') || {};
      for (const [, role] of message.member.roles.cache) {
        if (roleMult[role.id]) multiplier = Math.max(multiplier, roleMult[role.id]);
      }
      const channelMult = get(guildId, 'xpMultiplierChannels') || {};
      if (channelMult[message.channel.id]) multiplier = Math.max(multiplier, channelMult[message.channel.id]);

      const baseXp = Math.floor(Math.random() * 11) + 15;
      let xpGain = Math.floor(baseXp * multiplier);
      try { xpGain = Math.floor(xpGain * require('../data/clans').getXpBoostMultiplier(guildId, message.author.id)); } catch {}
      const dailyCap = get(guildId, 'xpDailyCap') || 0;
      const result = addXp(guildId, message.author.id, xpGain, dailyCap);

      try { require('../data/clans').contributeXp(guildId, message.author.id, xpGain); } catch {}

      if (!result.dailyCapped && result.leveledUp) {
        (async () => {
          try { require('../data/economy').addBalance(guildId, message.author.id, result.newLevel * 10); } catch {}
          const member = await message.guild.members.fetch(message.author.id);

          const levelRewards = get(guildId, 'levelRewards') || {};
          for (let lvl = result.oldLevel + 1; lvl <= result.newLevel; lvl++) {
            const roleId = levelRewards[lvl];
            if (roleId) {
              try {
                const role = message.guild.roles.cache.get(roleId);
                if (role && member.manageable) await member.roles.add(role);
              } catch {}
            }
          }

          const multiRewards = get(guildId, 'levelRewardsMulti') || {};
          for (let lvl = result.oldLevel + 1; lvl <= result.newLevel; lvl++) {
            const roleIds = multiRewards[lvl];
            if (roleIds && Array.isArray(roleIds)) {
              for (const rid of roleIds) {
                try {
                  const role = message.guild.roles.cache.get(rid);
                  if (role && member.manageable) await member.roles.add(role);
                } catch {}
              }
            }
          }

          const channelRewards = get(guildId, 'levelChannelRewards') || {};
          for (let lvl = result.oldLevel + 1; lvl <= result.newLevel; lvl++) {
            const chId = channelRewards[lvl];
            if (chId) {
              try {
                const ch = message.guild.channels.cache.get(chId);
                if (ch) {
                  await ch.permissionOverwrites.create(member, { ViewChannel: true, ReadMessageHistory: true });
                }
              } catch {}
            }
          }

          const announce = get(guildId, 'levelAnnounce');
          if (announce) {
            const channel = message.guild.channels.cache.get(announce);
            if (channel) channel.send(`🎉 ${message.author} a atteint le niveau **${result.newLevel}** !`).catch(() => {});
          }
        })();
      }
    }

    const content = message.content;

    const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9_-]+/i;
    if (get(guildId, 'antiInvite') && inviteRegex.test(content)) {
      message.delete();
      message.channel.send(`🚫 ${message.author}, les invitations Discord sont interdites.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      return;
    }

    const linkRegex = /https?:\/\/[^\s]+/i;
    if (get(guildId, 'antiLink') && linkRegex.test(content)) {
      const isDiscordLink = /https?:\/\/(www\.)?(discord\.(gg|com|app)|discord\.(gg|com|app)\/invite)\//i.test(content);
      if (!isDiscordLink) {
        message.delete();
        message.channel.send(`🔗 ${message.author}, les liens ne sont pas autorisés.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        return;
      }
    }

    if (get(guildId, 'antiMassMention') && (message.mentions.users.size + message.mentions.roles.size) > 4) {
      message.delete();
      message.channel.send(`📢 ${message.author}, les mentions en masse ne sont pas autorisées.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      return;
    }

    if (get(guildId, 'antiCaps') && content.length > 10) {
      const capsCount = (content.match(/[A-ZÀ-Ü]/g) || []).length;
      if (capsCount / content.length > 0.7) {
        message.delete();
        message.channel.send(`🔠 ${message.author}, évite les majuscules excessives.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        return;
      }
    }

    const bannedWords = get(guildId, 'bannedWords');
    if (bannedWords && bannedWords.length > 0) {
      const found = bannedWords.find(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message.content));
      if (found) {
        message.delete();
        message.channel.send(`❌ ${message.author}, ce message contient un mot interdit.`).then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        return;
      }
    }

    if (!spamMap.has(guildId)) spamMap.set(guildId, new Map());
    const users = spamMap.get(guildId);
    const now = Date.now();
    const userData = users.get(message.author.id) || { count: 0, firstMsg: now };
    userData.count++;
    if (userData.count === 1) userData.firstMsg = now;

    if (userData.count > 5 && now - userData.firstMsg < 4000) {
      if (message.member.moderatable) {
        message.member.timeout(600000, 'Spam détecté');
        message.channel.send(`⛔ ${message.author}, spam détecté. Timeout 10 min.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }
      userData.count = 0;
    }

    setTimeout(() => {
      if (userData) userData.count = Math.max(0, userData.count - 1);
    }, 3000);

    users.set(message.author.id, userData);

    if (message.content.startsWith('!')) {
      const name = message.content.slice(1).split(/\s+/)[0].toLowerCase();
      const cmd = db.prepare('SELECT * FROM custom_commands WHERE guildId = ? AND name = ?').get(guildId, name);
      if (cmd) {
        message.channel.send(cmd.response).catch(() => {});
      }
    }
  },
};
