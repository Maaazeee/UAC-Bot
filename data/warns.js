const db = require('./database');

function addWarn(userId, authorId, raison, guildId) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare('INSERT INTO warns (guildId, warnId, userId, modId, reason, date) VALUES (?, ?, ?, ?, ?, ?)').run(
    guildId, id, userId, authorId, raison || 'Aucune raison', new Date().toISOString()
  );
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM warns WHERE guildId = ? AND userId = ?').get(guildId, userId);
  return count.cnt;
}

function getWarns(userId, guildId) {
  return db.prepare('SELECT warnId AS id, modId AS auteur, reason AS raison, date FROM warns WHERE guildId = ? AND userId = ? ORDER BY date ASC').all(guildId, userId);
}

function removeWarn(userId, guildId, warnId) {
  const result = db.prepare('DELETE FROM warns WHERE guildId = ? AND userId = ? AND warnId = ?').run(guildId, userId, warnId);
  return result.changes > 0;
}

function clearWarns(userId, guildId) {
  db.prepare('DELETE FROM warns WHERE guildId = ? AND userId = ?').run(guildId, userId);
}

module.exports = { addWarn, getWarns, removeWarn, clearWarns };
