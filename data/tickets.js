const db = require('./database');

function createTicket(guildId, channelId, userId) {
  db.prepare('INSERT OR REPLACE INTO tickets (guildId, channelId, userId, status, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    guildId, channelId, userId, 'open', new Date().toISOString()
  );
}

function getTicket(channelId) {
  return db.prepare('SELECT * FROM tickets WHERE channelId = ?').get(channelId);
}

function closeTicket(channelId) {
  db.prepare('UPDATE tickets SET status = ? WHERE channelId = ?').run('closed', channelId);
}

function getOpenTickets(guildId) {
  return db.prepare('SELECT * FROM tickets WHERE guildId = ? AND status = ?').all(guildId, 'open');
}

module.exports = { createTicket, getTicket, closeTicket, getOpenTickets };
