const db = require('./database');

const defaults = {
  logChannel: null,
  welcomeChannel: null,
  welcomeMessage: 'Bienvenue {user} sur **{server}** ! 🎉',
  goodbyeChannel: null,
  goodbyeMessage: '{user} a quitté **{server}**. 👋',
  bannedWords: [],
  reactionRoles: {},
  autoRole: null,
  strikeTimeout: null,
  strikeBan: null,
  antiRaid: false,
  antiInvite: false,
  antiCaps: false,
  antiMassMention: false,
  antiLink: false,
  levelRewards: {},
  levelRewardsMulti: {},
  levelChannelRewards: {},
  levelAnnounce: null,
  xpMultiplierRoles: {},
  xpMultiplierChannels: {},
  xpDailyCap: 500,
  xpVoiceEnabled: false,
  autoLeaderboard: null,
};

function ensureGuild(guildId) {
  const existing = db.prepare('SELECT key FROM config WHERE guildId = ?').all(guildId).map(r => r.key);
  for (const [key, val] of Object.entries(defaults)) {
    if (!existing.includes(key)) {
      db.prepare('INSERT OR IGNORE INTO config (guildId, key, value) VALUES (?, ?, ?)').run(guildId, key, JSON.stringify(val));
    }
  }
}

function get(guildId, key) {
  const row = db.prepare('SELECT value FROM config WHERE guildId = ? AND key = ?').get(guildId, key);
  if (!row) {
    if (key in defaults) return defaults[key];
    return undefined;
  }
  try { return JSON.parse(row.value); } catch { return row.value; }
}

function set(guildId, key, value) {
  db.prepare('INSERT OR REPLACE INTO config (guildId, key, value) VALUES (?, ?, ?)').run(guildId, key, JSON.stringify(value));
}

module.exports = { get, set, ensureGuild };
