const { Events, EmbedBuilder } = require('discord.js');
const { get, set } = require('../data/config');
const { getLeaderboard } = require('../data/levels');
const { getExpired, deleteGiveaway } = require('../data/giveaways');
const { getPending, markExecuted } = require('../data/reminders');
const { getTodaysBirthdays } = require('../data/birthdays');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    setInterval(async () => {
      const db = require('../data/database');
      const unannounced = db.prepare("SELECT * FROM clans WHERE level > notifiedLevel").all();
      for (const clan of unannounced) {
        db.prepare("UPDATE clans SET notifiedLevel = level WHERE guildId = ? AND clanId = ?").run(clan.guildId, clan.clanId);
        const guild = client.guilds.cache.get(clan.guildId);
        if (guild && clan.channelId) {
          const ch = guild.channels.cache.get(clan.channelId);
          if (ch) ch.send({ content: `🎉 **${clan.name}** a atteint le niveau **${clan.level}** !` }).catch(() => {});
        }
      }
    }, 15000);

    setInterval(async () => {
      const db = require('../data/database');
      const { getUpgradeBonus, addClanBalance, getClan, addClanLog } = require('../data/clans');
      const clanRows = db.prepare('SELECT DISTINCT guildId, clanId FROM clans').all();
      for (const row of clanRows) {
        const interestLevel = getUpgradeBonus(row.guildId, row.clanId, 'bank_interest');
        if (interestLevel < 1) continue;
        const clan = getClan(row.guildId, row.clanId);
        if (!clan || (clan.balance || 0) < 100) continue;
        const interest = Math.floor(clan.balance * (0.005 * interestLevel));
        addClanBalance(row.guildId, row.clanId, interest);
        addClanLog(row.guildId, row.clanId, null, 'interest', `+${interest}🪙 (${interestLevel}%)`);
        const guild = client.guilds.cache.get(row.guildId);
        if (guild && clan.channelId) {
          const ch = guild.channels.cache.get(clan.channelId);
          if (ch) ch.send(`💰 **Intérêt banquaire:** +${interest}🪙 (taux ${interestLevel}%)`).catch(() => {});
        }
      }
    }, 86400000);

    setInterval(async () => {
      const db = require('../data/database');
      const expiredWars = db.prepare("SELECT * FROM clan_wars WHERE status = 'active' AND endTime <= ?").all(new Date().toISOString());
      for (const war of expiredWars) {
        const { finishWar, getClan } = require('../data/clans');
        const result = finishWar(war.guildId, war.warId);
        const guild = client.guilds.cache.get(war.guildId);
        if (guild) {
          const chanA = getClan(war.guildId, war.attackerClanId);
          const chanD = getClan(war.guildId, war.defenderClanId);
          const sendMsg = async (clan, text) => {
            if (clan?.channelId) { const ch = guild.channels.cache.get(clan.channelId); if (ch) ch.send(text).catch(() => {}); }
          };
          if (result.draw) {
            const text = '🤝 Guerre terminée — **Égalité** ! Chaque clan reçoit 100XP.';
            sendMsg(chanA, text); sendMsg(chanD, text);
          } else {
            const winner = getClan(war.guildId, result.winner);
            const loser = getClan(war.guildId, result.winner === war.attackerClanId ? war.defenderClanId : war.attackerClanId);
            sendMsg(chanA, `⚔️ **${winner?.name}** a gagné la guerre contre **${loser?.name}** ! ${war.bet > 0 ? `💰 Gain: **${war.bet * 2}** 🪙.` : ''}`);
            sendMsg(chanD, `⚔️ **${winner?.name}** a gagné la guerre contre **${loser?.name}** ! ${war.bet > 0 ? `💰 Perte: **${war.bet}** 🪙.` : ''}`);
          }
        }
      }
    }, 30000);

    setInterval(async () => {
      for (const [, guild] of client.guilds.cache) {
        const cfg = get(guild.id, 'autoLeaderboard');
        if (!cfg?.channelId) continue;
        const channel = guild.channels.cache.get(cfg.channelId);
        if (!channel) continue;
        const top = getLeaderboard(guild.id);
        if (top.length === 0) continue;
        const lines = [];
        for (let i = 0; i < top.length; i++) {
          const u = await client.users.fetch(top[i].userId).catch(() => null);
          if (!u) continue;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          lines.push(`${medal} **${u.displayName}** — Niveau **${top[i].level}** (${top[i].xp} XP)`);
        }
        const embed = new EmbedBuilder()
          .setTitle('📊 Top niveaux')
          .setDescription(lines.join('\n'))
          .setColor(0x5865F2)
          .setTimestamp();
        try {
          if (cfg.messageId) {
            const msg = await channel.messages.fetch(cfg.messageId).catch(() => null);
            if (msg) { await msg.edit({ embeds: [embed] }); continue; }
          }
          const msg = await channel.send({ embeds: [embed] });
          set(guild.id, 'autoLeaderboard', { channelId: cfg.channelId, messageId: msg.id });
        } catch {}
      }
    }, 600000);

    setInterval(async () => {
      const reminders = getPending();
      for (const r of reminders) {
        const user = await client.users.fetch(r.userId).catch(() => null);
        if (user) {
          user.send(`⏰ **Rappel** : ${r.message}`).catch(() => {});
          if (r.channelId) {
            const ch = client.channels.cache.get(r.channelId);
            if (ch) ch.send(`<@${r.userId}> ⏰ **Rappel** : ${r.message}`).catch(() => {});
          }
        }
        markExecuted(r.id);
      }
    }, 10000);

    setInterval(async () => {
      const giveaways = getExpired();
      for (const g of giveaways) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const channel = client.channels.cache.get(g.channelId);
        if (!channel) { deleteGiveaway(g.messageId); continue; }
        const msg = await channel.messages.fetch(g.messageId).catch(() => null);
        if (!msg) { deleteGiveaway(g.messageId); continue; }
        const entrants = g.entrants;
        if (entrants.length === 0) {
          await channel.send(`🎉 Giveaway **${g.prize}** — Aucun participant.`).catch(() => {});
        } else {
          const winners = [];
          const pool = [...entrants];
          for (let i = 0; i < Math.min(g.winners, pool.length); i++) {
            const idx = Math.floor(Math.random() * pool.length);
            winners.push(pool.splice(idx, 1)[0]);
          }
          const wText = winners.map(id => `<@${id}>`).join(', ');
          await channel.send(`🎉 Félicitations ${wText} ! Tu as gagné **${g.prize}** !`).catch(() => {});
          for (const wId of winners) {
            const user = await client.users.fetch(wId).catch(() => null);
            if (user) {
              const claimBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${g.messageId}`).setLabel('🎁 Réclamer').setStyle(ButtonStyle.Success)
              );
              await user.send({ content: `🎉 Tu as gagné **${g.prize}** ! Clique pour réclamer.`, components: [claimBtn] }).catch(() => {});
            }
          }
          msg.edit({ embeds: [EmbedBuilder.from(msg.embeds[0]).setColor(0x2ECC71).setFooter({ text: 'Terminé' })], components: [] }).catch(() => {});
        }
        deleteGiveaway(g.messageId);
      }
    }, 15000);

    function checkBirthdays() {
      const today = new Date();
      const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      for (const [, guild] of client.guilds.cache) {
        const chId = get(guild.id, 'birthdayChannel');
        if (!chId) continue;
        const channel = guild.channels.cache.get(chId);
        if (!channel) continue;
        const birthdays = getTodaysBirthdays(guild.id);
        if (birthdays.length === 0) continue;
        const bDay = get(guild.id, '_lastBirthdayNotif');
        if (bDay === mmdd) continue;
        set(guild.id, '_lastBirthdayNotif', mmdd);
        const lines = birthdays.map(b => `<@${b.userId}>`).join(', ');
        const bdayMsg = get(guild.id, 'birthdayMessage') || '🎂 Joyeux anniversaire {users} !';
        channel.send(bdayMsg.replace(/{users}/g, lines)).catch(() => {});
      }
    }
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
    setTimeout(() => {
      checkBirthdays();
      setInterval(checkBirthdays, 86400000);
    }, msToMidnight);

    setInterval(async () => {
      for (const [, guild] of client.guilds.cache) {
        const counterId = get(guild.id, 'voiceCounterChannel');
        if (!counterId) continue;
        const channel = guild.channels.cache.get(counterId);
        if (!channel) continue;
        const count = guild.channels.cache.filter(c => c.type === 2).reduce((sum, vc) => sum + vc.members.size, 0);
        const newName = `🔊 Membres: ${count}`;
        if (channel.name !== newName) channel.setName(newName).catch(() => {});
      }
    }, 30000);
  },
};
