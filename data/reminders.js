const db = require('./database');

function addReminder(userId, channelId, time, message) {
  const r = db.prepare('INSERT INTO reminders (userId, channelId, time, message) VALUES (?, ?, ?, ?)').run(userId, channelId, time.toISOString(), message);
  return r.lastInsertRowid;
}

function getPending() {
  return db.prepare('SELECT * FROM reminders WHERE executed = 0 AND time <= ?').all(new Date().toISOString());
}

function markExecuted(id) {
  db.prepare('UPDATE reminders SET executed = 1 WHERE id = ?').run(id);
}

function deleteReminder(id) {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

module.exports = { addReminder, getPending, markExecuted, deleteReminder };
