const db = require('./database');

function ensureUser(guildId, userId) {
  db.prepare('INSERT OR IGNORE INTO economy (guildId, userId, balance) VALUES (?, ?, 0)').run(guildId, userId);
}

function getBalance(guildId, userId) {
  ensureUser(guildId, userId);
  const row = db.prepare('SELECT balance FROM economy WHERE guildId = ? AND userId = ?').get(guildId, userId);
  return row?.balance || 0;
}

function addBalance(guildId, userId, amount) {
  ensureUser(guildId, userId);
  db.prepare('UPDATE economy SET balance = balance + ? WHERE guildId = ? AND userId = ?').run(amount, guildId, userId);
}

function removeBalance(guildId, userId, amount) {
  ensureUser(guildId, userId);
  db.prepare('UPDATE economy SET balance = MAX(0, balance - ?) WHERE guildId = ? AND userId = ?').run(amount, guildId, userId);
}

function setBalance(guildId, userId, amount) {
  ensureUser(guildId, userId);
  db.prepare('UPDATE economy SET balance = ? WHERE guildId = ? AND userId = ?').run(amount, guildId, userId);
}

function getDailyBonus(guildId, userId) {
  ensureUser(guildId, userId);
  const row = db.prepare('SELECT lastDaily FROM economy WHERE guildId = ? AND userId = ?').get(guildId, userId);
  const today = new Date().toDateString();
  if (row?.lastDaily === today) return { claimed: true };
  db.prepare('UPDATE economy SET balance = balance + 100, lastDaily = ? WHERE guildId = ? AND userId = ?').run(today, guildId, userId);
  return { claimed: false, bonus: 100 };
}

function getLeaderboard(guildId, limit = 15) {
  return db.prepare('SELECT userId, balance FROM economy WHERE guildId = ? ORDER BY balance DESC LIMIT ?').all(guildId, limit);
}

module.exports = { getBalance, addBalance, removeBalance, setBalance, getDailyBonus, getLeaderboard };
