const db = require('./database');

const prefix = '!';

function addCmd(guildId, name, response, authorId) {
  db.prepare('INSERT OR REPLACE INTO custom_commands (guildId, name, response, authorId, date) VALUES (?, ?, ?, ?, ?)').run(
    guildId, name.toLowerCase(), response, authorId, new Date().toISOString()
  );
}

function getCmd(guildId, name) {
  return db.prepare('SELECT * FROM custom_commands WHERE guildId = ? AND name = ?').get(guildId, name.toLowerCase());
}

function listCmds(guildId) {
  return db.prepare('SELECT name FROM custom_commands WHERE guildId = ? ORDER BY name').all(guildId);
}

function deleteCmd(guildId, name) {
  return db.prepare('DELETE FROM custom_commands WHERE guildId = ? AND name = ?').run(guildId, name.toLowerCase()).changes > 0;
}

module.exports = { prefix, addCmd, getCmd, listCmds, deleteCmd };
