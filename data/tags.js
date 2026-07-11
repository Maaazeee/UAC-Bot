const db = require('./database');

function addTag(guildId, name, content, authorId) {
  db.prepare('INSERT OR REPLACE INTO tags (guildId, name, content, authorId, date) VALUES (?, ?, ?, ?, ?)').run(guildId, name, content, authorId, new Date().toISOString());
}

function getTag(guildId, name) {
  return db.prepare('SELECT * FROM tags WHERE guildId = ? AND name = ?').get(guildId, name);
}

function listTags(guildId) {
  return db.prepare('SELECT name, authorId FROM tags WHERE guildId = ? ORDER BY name').all(guildId);
}

function deleteTag(guildId, name) {
  const r = db.prepare('DELETE FROM tags WHERE guildId = ? AND name = ?').run(guildId, name);
  return r.changes > 0;
}

module.exports = { addTag, getTag, listTags, deleteTag };
