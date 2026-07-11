const Database = require('better-sqlite3');
const { join } = require('path');
const { existsSync, mkdirSync } = require('fs');

if (!existsSync(join(__dirname))) mkdirSync(join(__dirname), { recursive: true });

const db = new Database(join(__dirname, 'bot.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    guildId TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (guildId, key)
  );
  CREATE TABLE IF NOT EXISTS scores (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS levels (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    lastDaily TEXT,
    dailyXp INTEGER DEFAULT 0,
    voiceTime INTEGER DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS warns (
    guildId TEXT NOT NULL,
    warnId TEXT NOT NULL,
    userId TEXT NOT NULL,
    modId TEXT,
    reason TEXT,
    date TEXT,
    PRIMARY KEY (guildId, warnId)
  );
  CREATE TABLE IF NOT EXISTS reports (
    guildId TEXT NOT NULL,
    reportId TEXT NOT NULL,
    userId TEXT NOT NULL,
    authorId TEXT NOT NULL,
    reason TEXT,
    date TEXT,
    PRIMARY KEY (guildId, reportId)
  );
  CREATE TABLE IF NOT EXISTS economy (
    guildId TEXT NOT NULL, userId TEXT NOT NULL, balance INTEGER DEFAULT 0,
    lastDaily TEXT, PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS shop (
    guildId TEXT NOT NULL, itemId TEXT NOT NULL, name TEXT, price INTEGER,
    roleId TEXT, description TEXT, type TEXT DEFAULT 'role',
    maxQuantity INTEGER DEFAULT 0, PRIMARY KEY (guildId, itemId)
  );
  CREATE TABLE IF NOT EXISTS inventory (
    guildId TEXT NOT NULL, userId TEXT NOT NULL, itemId TEXT NOT NULL,
    quantity INTEGER DEFAULT 1, PRIMARY KEY (guildId, userId, itemId)
  );
  CREATE TABLE IF NOT EXISTS tags (
    guildId TEXT NOT NULL, name TEXT NOT NULL, content TEXT,
    authorId TEXT, date TEXT, PRIMARY KEY (guildId, name)
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, channelId TEXT,
    time TEXT, message TEXT, executed INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS birthdays (
    guildId TEXT NOT NULL, userId TEXT NOT NULL, date TEXT,
    PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS custom_commands (
    guildId TEXT NOT NULL, name TEXT NOT NULL, response TEXT,
    authorId TEXT, date TEXT, PRIMARY KEY (guildId, name)
  );
  CREATE TABLE IF NOT EXISTS tickets (
    guildId TEXT NOT NULL, channelId TEXT NOT NULL, userId TEXT,
    status TEXT DEFAULT 'open', createdAt TEXT, PRIMARY KEY (channelId)
  );
  CREATE TABLE IF NOT EXISTS afk (
    guildId TEXT NOT NULL, userId TEXT NOT NULL, reason TEXT,
    since TEXT, PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS giveaways (
    messageId TEXT NOT NULL, guildId TEXT, channelId TEXT, prize TEXT,
    winners INTEGER, endTime TEXT, entrants TEXT, PRIMARY KEY (messageId)
  );
  CREATE TABLE IF NOT EXISTS starboard (
    guildId TEXT NOT NULL, messageId TEXT NOT NULL, channelId TEXT,
    authorId TEXT, stars INTEGER DEFAULT 1, PRIMARY KEY (guildId, messageId)
  );
  CREATE TABLE IF NOT EXISTS temp_voice (
    guildId TEXT NOT NULL, channelId TEXT NOT NULL, ownerId TEXT,
    PRIMARY KEY (channelId)
  );
  CREATE TABLE IF NOT EXISTS clans (
    guildId TEXT NOT NULL, clanId TEXT NOT NULL, name TEXT NOT NULL,
    description TEXT DEFAULT '', ownerId TEXT NOT NULL,
    level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0, balance INTEGER DEFAULT 0,
    created TEXT, color TEXT DEFAULT '#3498DB', emoji TEXT DEFAULT '🏰',
    banner TEXT DEFAULT '', channelId TEXT DEFAULT '',
    notifiedLevel INTEGER DEFAULT 1,
    PRIMARY KEY (guildId, clanId)
  );
  CREATE TABLE IF NOT EXISTS clan_members (
    guildId TEXT NOT NULL, clanId TEXT NOT NULL, userId TEXT NOT NULL,
    role TEXT DEFAULT 'member', joined TEXT,
    xpContributed INTEGER DEFAULT 0,
    coinsContributed INTEGER DEFAULT 0,
    PRIMARY KEY (guildId, userId)
  );
  CREATE TABLE IF NOT EXISTS clan_wars (
    guildId TEXT NOT NULL, warId TEXT NOT NULL,
    attackerClanId TEXT NOT NULL, defenderClanId TEXT NOT NULL,
    status TEXT DEFAULT 'pending', attackerScore INTEGER DEFAULT 0,
    defenderScore INTEGER DEFAULT 0, endTime TEXT,
    PRIMARY KEY (warId)
  );
  CREATE TABLE IF NOT EXISTS clan_upgrades (
    guildId TEXT NOT NULL, clanId TEXT NOT NULL, upgradeId TEXT NOT NULL,
    level INTEGER DEFAULT 1, PRIMARY KEY (guildId, clanId, upgradeId)
  );
  CREATE TABLE IF NOT EXISTS clan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, guildId TEXT NOT NULL,
    clanId TEXT NOT NULL, userId TEXT, action TEXT, details TEXT,
    time TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS clan_invites (
    guildId TEXT NOT NULL, clanId TEXT NOT NULL, userId TEXT NOT NULL,
    inviterId TEXT NOT NULL, PRIMARY KEY (guildId, userId)
  );
  CREATE INDEX IF NOT EXISTS idx_levels_xp ON levels(guildId, xp DESC);
  CREATE INDEX IF NOT EXISTS idx_scores_guild ON scores(guildId);
  CREATE INDEX IF NOT EXISTS idx_warns_user ON warns(guildId, userId);
`);

module.exports = db;
