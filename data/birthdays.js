const db = require('./database');

function setBirthday(guildId, userId, date) {
  db.prepare('INSERT OR REPLACE INTO birthdays (guildId, userId, date) VALUES (?, ?, ?)').run(guildId, userId, date);
}

function getBirthday(guildId, userId) {
  return db.prepare('SELECT date FROM birthdays WHERE guildId = ? AND userId = ?').get(guildId, userId);
}

function getTodaysBirthdays(guildId) {
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return db.prepare('SELECT userId FROM birthdays WHERE guildId = ? AND substr(date, 6) = ?').all(guildId, mmdd);
}

function removeBirthday(guildId, userId) {
  return db.prepare('DELETE FROM birthdays WHERE guildId = ? AND userId = ?').run(guildId, userId).changes > 0;
}

module.exports = { setBirthday, getBirthday, getTodaysBirthdays, removeBirthday };
