const db = require('./database');

function createGiveaway(messageId, guildId, channelId, prize, winners, endTime, entrants) {
  db.prepare('INSERT OR REPLACE INTO giveaways (messageId, guildId, channelId, prize, winners, endTime, entrants) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    messageId, guildId, channelId, prize, winners, endTime.toISOString(), JSON.stringify(entrants || [])
  );
}

function getGiveaway(messageId) {
  const r = db.prepare('SELECT * FROM giveaways WHERE messageId = ?').get(messageId);
  if (!r) return null;
  r.entrants = JSON.parse(r.entrants || '[]');
  r.endTime = new Date(r.endTime);
  return r;
}

function getExpired() {
  const rows = db.prepare('SELECT * FROM giveaways WHERE endTime <= ?').all(new Date().toISOString());
  for (const r of rows) {
    r.entrants = JSON.parse(r.entrants || '[]');
    r.endTime = new Date(r.endTime);
  }
  return rows;
}

function addEntrant(messageId, userId) {
  const g = getGiveaway(messageId);
  if (!g) return;
  if (g.entrants.includes(userId)) return false;
  g.entrants.push(userId);
  db.prepare('UPDATE giveaways SET entrants = ? WHERE messageId = ?').run(JSON.stringify(g.entrants), messageId);
  return true;
}

function deleteGiveaway(messageId) {
  db.prepare('DELETE FROM giveaways WHERE messageId = ?').run(messageId);
}

module.exports = { createGiveaway, getGiveaway, getExpired, addEntrant, deleteGiveaway };
