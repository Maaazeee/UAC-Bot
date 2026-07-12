const db = require('./database');

const defaults = {
  pfc: { wins: 0, losses: 0, ties: 0 },
  devine: { wins: 0, total: 0 },
  quiz: { correct: 0, total: 0 },
  morpion: { wins: 0, losses: 0, ties: 0 },
};

function getData(guildId) {
  const rows = db.prepare('SELECT userId, value FROM scores WHERE guildId = ?').all(guildId);
  const data = {};
  for (const r of rows) {
    try { data[r.userId] = JSON.parse(r.value); } catch { data[r.userId] = {}; }
  }
  return data;
}

function saveData(guildId, userId, games) {
  db.prepare('INSERT OR REPLACE INTO scores (guildId, userId, value) VALUES (?, ?, ?)').run(guildId, userId, JSON.stringify(games));
}

function ensureUser(userId, game) {
  const row = db.prepare('SELECT value FROM scores WHERE guildId = ? AND userId = ?').get('global', userId);
  let games;
  if (!row) {
    games = {};
    const d = defaults[game] || { wins: 0, losses: 0 };
    games[game] = { ...d };
    db.prepare('INSERT OR REPLACE INTO scores (guildId, userId, value) VALUES (?, ?, ?)').run('global', userId, JSON.stringify(games));
  } else {
    try { games = JSON.parse(row.value); } catch { games = {}; }
    if (!games[game]) {
      games[game] = { ...(defaults[game] || { wins: 0, losses: 0 }) };
      db.prepare('INSERT OR REPLACE INTO scores (guildId, userId, value) VALUES (?, ?, ?)').run('global', userId, JSON.stringify(games));
    }
  }
  return games;
}

function addWin(userId, game) {
  const games = ensureUser(userId, game);
  if (game === 'pfc') games[game].wins++;
  else if (game === 'devine') { games[game].wins++; games[game].total++; }
  else if (game === 'quiz') { games[game].correct++; games[game].total++; }
  else if (game === 'morpion') games[game].wins++;
  else games[game].wins++;
  saveData('global', userId, games);
  try { require('./levels').addXp('global', userId, 10); } catch {}
  try { require('./economy').addBalance('global', userId, 5); } catch {}
}

function addLoss(userId, game) {
  const games = ensureUser(userId, game);
  if (game === 'pfc') games[game].losses++;
  else if (game === 'devine') games[game].total++;
  else if (game === 'quiz') games[game].total++;
  else if (game === 'morpion') games[game].losses++;
  else games[game].losses++;
  saveData('global', userId, games);
}

function addTie(userId, game) {
  const games = ensureUser(userId, game);
  if (game === 'pfc' || game === 'morpion') games[game].ties++;
  saveData('global', userId, games);
}

const GAMES = [
  { key: 'pfc',       label: '🪨', field: 'wins' },
  { key: 'devine',    label: '🔢', field: 'wins' },
  { key: 'quiz',      label: '❓', field: 'correct' },
  { key: 'morpion',   label: '⭕', field: 'wins' },
  { key: 'pendu',     label: '🪢', field: 'wins' },
  { key: 'allumettes',label: '🪄', field: 'wins' },
  { key: 'des',       label: '🎲', field: 'wins' },
  { key: 'puissance4',label: '🔴', field: 'wins' },
  { key: 'justePrix', label: '🎯', field: 'wins' },
];

function getClassement() {
  const rows = db.prepare('SELECT userId, value FROM scores WHERE guildId = ?').all('global');
  const entries = [];
  for (const r of rows) {
    let games;
    try { games = JSON.parse(r.value); } catch { continue; }
    let total = 0;
    const details = {};
    for (const g of GAMES) {
      const game = games[g.key];
      const pts = game ? (game[g.field] || 0) : 0;
      total += pts;
      details[g.key] = pts;
    }
    entries.push({ userId: r.userId, total, ...details });
  }
  return entries.sort((a, b) => b.total - a.total);
}

module.exports = { addWin, addLoss, addTie, getClassement, GAMES };
