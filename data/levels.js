const db = require('./database');

function calcLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

function xpForLevel(level) {
  return level * level * 100;
}

function addXp(guildId, userId, amount, dailyCap = 0) {
  let row = db.prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!row) {
    db.prepare('INSERT INTO levels (guildId, userId, xp, dailyXp, voiceTime) VALUES (?, ?, 0, 0, 0)').run(guildId, userId);
    row = db.prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  }

  const today = new Date().toDateString();
  if (row.lastDaily !== today) {
    db.prepare('UPDATE levels SET dailyXp = 0, lastDaily = ? WHERE guildId = ? AND userId = ?').run(today, guildId, userId);
    row.dailyXp = 0;
  }

  if (dailyCap > 0 && row.dailyXp >= dailyCap) {
    return { xp: row.xp, level: calcLevel(row.xp), dailyXp: row.dailyXp, dailyCapped: true };
  }

  const actual = dailyCap > 0 ? Math.min(amount, dailyCap - row.dailyXp) : amount;
  const oldLevel = calcLevel(row.xp);
  const newXp = row.xp + actual;
  const newDailyXp = row.dailyXp + actual;
  db.prepare('UPDATE levels SET xp = ?, dailyXp = ? WHERE guildId = ? AND userId = ?').run(newXp, newDailyXp, guildId, userId);
  const newLevel = calcLevel(newXp);
  return { xp: newXp, level: newLevel, oldLevel, newLevel, leveledUp: newLevel > oldLevel, dailyXp: newDailyXp, dailyCapped: false };
}

function getLevelData(guildId, userId) {
  const row = db.prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!row) return { xp: 0, level: 0, dailyXp: 0, voiceTime: 0 };
  const today = new Date().toDateString();
  if (row.lastDaily !== today) {
    db.prepare('UPDATE levels SET dailyXp = 0, lastDaily = ? WHERE guildId = ? AND userId = ?').run(today, guildId, userId);
    row.dailyXp = 0;
  }
  return { xp: row.xp, level: calcLevel(row.xp), dailyXp: row.dailyXp, voiceTime: row.voiceTime || 0 };
}

function getLeaderboard(guildId, limit = 15) {
  const rows = db.prepare('SELECT userId, xp FROM levels WHERE guildId = ? ORDER BY xp DESC LIMIT ?').all(guildId, limit);
  return rows.map(r => ({ userId: r.userId, xp: r.xp, level: calcLevel(r.xp) }));
}

function setXp(guildId, userId, xp) {
  db.prepare('INSERT OR REPLACE INTO levels (guildId, userId, xp, dailyXp, voiceTime, lastDaily) VALUES (?, ?, ?, 0, 0, ?)').run(guildId, userId, xp, new Date().toDateString());
  return { xp, level: calcLevel(xp) };
}

function resetUser(guildId, userId) {
  db.prepare('DELETE FROM levels WHERE guildId = ? AND userId = ?').run(guildId, userId);
}

function addVoiceTime(guildId, userId, seconds) {
  db.prepare(`
    INSERT INTO levels (guildId, userId, xp, dailyXp, voiceTime, lastDaily)
    VALUES (?, ?, 0, 0, ?, '')
    ON CONFLICT(guildId, userId) DO UPDATE SET voiceTime = voiceTime + ?
  `).run(guildId, userId, seconds, seconds);
  const row = db.prepare('SELECT voiceTime FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  return row?.voiceTime || 0;
}

function getDailyBonus(guildId, userId) {
  const today = new Date().toDateString();
  let row = db.prepare('SELECT * FROM levels WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!row) {
    db.prepare('INSERT INTO levels (guildId, userId, xp, dailyXp, voiceTime, lastDaily) VALUES (?, ?, 0, 0, 0, ?)').run(guildId, userId, '');
    row = { xp: 0, lastDaily: '' };
  }
  if (row.lastDaily === today) return { claimed: true };
  const bonus = 50;
  db.prepare('UPDATE levels SET xp = xp + ?, lastDaily = ? WHERE guildId = ? AND userId = ?').run(bonus, today, guildId, userId);
  return { claimed: false, bonus };
}

module.exports = { addXp, getLevelData, getLeaderboard, calcLevel, xpForLevel, setXp, resetUser, addVoiceTime, getDailyBonus };
