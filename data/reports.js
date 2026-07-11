const db = require('./database');

function addReport(guildId, targetId, authorId, raison) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.prepare('INSERT INTO reports (guildId, reportId, userId, authorId, reason, date) VALUES (?, ?, ?, ?, ?, ?)').run(
    guildId, id, targetId, authorId, raison || 'Aucune raison', new Date().toISOString()
  );
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM reports WHERE guildId = ?').get(guildId);
  return count.cnt;
}

function getReports(guildId) {
  return db.prepare('SELECT reportId AS id, userId AS target, authorId AS auteur, reason AS raison, date, FALSE AS trait FROM reports WHERE guildId = ? ORDER BY date DESC').all(guildId);
}

function markTreated(guildId, reportId) {
  const result = db.prepare('DELETE FROM reports WHERE guildId = ? AND reportId = ?').run(guildId, reportId);
  return result.changes > 0;
}

module.exports = { addReport, getReports, markTreated };
