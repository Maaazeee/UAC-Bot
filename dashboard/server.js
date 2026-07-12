const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const { readFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');
require('dotenv/config');

const app = express();
const PORT = 8080;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'change-me', resave: false, saveUninitialized: false }));

function checkAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

function getDb() {
  return require('../data/database');
}

function getConfig() {
  return require('../data/config');
}

// ─── Auth ────────────────────────────────────────────

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/');
  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: 'authorization_code', redirect_uri: REDIRECT_URI }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const { access_token } = tokenRes.data;
    const [userRes, guildsRes] = await Promise.all([
      axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${access_token}` } }),
      axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${access_token}` } }),
    ]);
    req.session.user = userRes.data;
    req.session.guilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8);
    req.session.access_token = access_token;
    res.redirect('/dashboard');
  } catch (err) {
    const detail = err.response?.data || err.message;
    res.send(`Erreur d'authentification: ${JSON.stringify(detail)}`);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ─── Server list ─────────────────────────────────────

app.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user, guilds: req.session.guilds });
});

// ─── Guild routes ────────────────────────────────────

function guildAccess(req, res, next) {
  const { guildId } = req.params;
  const guild = req.session.guilds?.find(g => g.id === guildId);
  if (!guild) return res.status(403).send('Accès refusé à ce serveur.');
  req.guild = guild;
  next();
}

app.get('/dashboard/:guildId', checkAuth, guildAccess, (req, res) => {
  res.redirect(`/dashboard/${req.guild.id}/stats`);
});

app.get('/dashboard/:guildId/stats', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const { get } = getConfig();
  const db = getDb();

  let topLevels = [];
  try { topLevels = db.prepare('SELECT userId, xp, level FROM scores WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT 10').all(guildId); } catch {}

  let topEconomy = [];
  try { topEconomy = db.prepare('SELECT userId, balance FROM economy WHERE guildId = ? ORDER BY balance DESC LIMIT 10').all(guildId); } catch {}

  const config = {
    logChannel: get(guildId, 'logChannel'),
    welcomeChannel: get(guildId, 'welcomeChannel'),
    bannedWords: get(guildId, 'bannedWords') || [],
  };

  const stats = { memberCount: '?', channelCount: '?', roleCount: '?', commandCount: 81 };

  res.render('guild_stats', { user: req.session.user, guild: req.guild, topLevels, topEconomy, config, stats });
});

app.get('/dashboard/:guildId/levels', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const { get } = getConfig();
  const db = getDb();

  let levels = [];
  try { levels = db.prepare('SELECT userId, xp, level FROM scores WHERE guildId = ? ORDER BY level DESC, xp DESC').all(guildId); } catch {}

  const config = {
    levelRewards: get(guildId, 'levelRewards') || {},
    levelChannelRewards: get(guildId, 'levelChannelRewards') || {},
  };

  res.render('guild_levels', { user: req.session.user, guild: req.guild, levels, config, message: req.query.msg || null });
});

app.post('/dashboard/:guildId/levels', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const { set } = getConfig();
  const { action, level, roleId, channelId } = req.body;

  if (action === 'addReward' && level && roleId) {
    const rewards = JSON.parse(getConfig().get(guildId, 'levelRewards') || '{}');
    rewards[parseInt(level)] = roleId;
    set(guildId, 'levelRewards', JSON.stringify(rewards));
  }
  if (action === 'addChannelReward' && level && channelId) {
    const rewards = JSON.parse(getConfig().get(guildId, 'levelChannelRewards') || '{}');
    rewards[parseInt(level)] = channelId;
    set(guildId, 'levelChannelRewards', JSON.stringify(rewards));
  }

  res.redirect(`/dashboard/${guildId}/levels?msg=✅+Mis+à+jour`);
});

app.get('/dashboard/:guildId/economy', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const db = getDb();

  let economy = [];
  try { economy = db.prepare('SELECT userId, balance FROM economy WHERE guildId = ? ORDER BY balance DESC').all(guildId); } catch {}

  let shopItems = [];
  try { shopItems = db.prepare('SELECT * FROM shop WHERE guildId = ?').all(guildId); } catch {}

  res.render('guild_economy', { user: req.session.user, guild: req.guild, economy, shopItems, message: req.query.msg || null });
});

app.post('/dashboard/:guildId/economy', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const { action, itemName, itemPrice, itemType, itemId } = req.body;

  if (action === 'addShopItem' && itemName && itemPrice) {
    try {
      getDb().prepare('INSERT INTO shop (guildId, name, price, type) VALUES (?, ?, ?, ?)').run(guildId, itemName, parseInt(itemPrice), itemType || 'consumable');
    } catch (err) { return res.redirect(`/dashboard/${guildId}/economy?msg=❌+Erreur`); }
  }
  if (action === 'removeShopItem' && itemId) {
    try { getDb().prepare('DELETE FROM shop WHERE id = ? AND guildId = ?').run(itemId, guildId); } catch {}
  }

  res.redirect(`/dashboard/${guildId}/economy?msg=✅+OK`);
});

app.get('/dashboard/:guildId/moderation', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const db = getDb();

  let warns = [];
  try { warns = db.prepare('SELECT * FROM warns WHERE guildId = ? ORDER BY createdAt DESC').all(guildId); } catch {}

  let reports = [];
  try { reports = db.prepare('SELECT * FROM reports WHERE guildId = ? ORDER BY createdAt DESC').all(guildId); } catch {}

  res.render('guild_moderation', { user: req.session.user, guild: req.guild, warns, reports });
});

app.get('/dashboard/:guildId/clans', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const db = getDb();

  let clans = [];
  try { clans = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM clan_members cm WHERE cm.clanId = c.id) as memberCount 
    FROM clans c WHERE c.guildId = ? ORDER BY c.level DESC
  `).all(guildId); } catch {}

  let wars = [];
  try { wars = db.prepare("SELECT * FROM clan_wars WHERE guildId = ? AND status = 'active' ORDER BY endTime ASC").all(guildId); } catch {}

  res.render('guild_clans', { user: req.session.user, guild: req.guild, clans, wars });
});

app.get('/dashboard/:guildId/logs', checkAuth, guildAccess, (req, res) => {
  const level = req.query.level || '';
  const logPath = join(__dirname, '..', 'logs', 'bot.log');
  let rawLogs = [];

  if (existsSync(logPath)) {
    try {
      const content = readFileSync(logPath, 'utf-8');
      rawLogs = content.split('\n').filter(Boolean).reverse().slice(0, 100).map(line => {
        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.+)/);
        return match ? { timestamp: match[1], level: match[2], message: match[3] } : { timestamp: '', level: 'INFO', message: line };
      });
    } catch {}
  }

  const logs = level ? rawLogs.filter(l => l.level === level.toUpperCase()) : rawLogs;

  res.render('guild_logs', { user: req.session.user, guild: req.guild, logs, level });
});

// ─── Config (POST) ───────────────────────────────────

app.post('/dashboard/:guildId', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  const { set } = getConfig();
  const { logChannel, welcomeChannel, goodbyeChannel, welcomeMessage, goodbyeMessage, autorole, verifyRole, voicexp, antiInvite, antiLink, antiCaps, antiMassMention, bannedWords } = req.body;

  if (logChannel) set(guildId, 'logChannel', logChannel);
  if (welcomeChannel) set(guildId, 'welcomeChannel', welcomeChannel);
  if (goodbyeChannel) set(guildId, 'goodbyeChannel', goodbyeChannel);
  if (welcomeMessage) set(guildId, 'welcomeMessage', welcomeMessage);
  if (goodbyeMessage) set(guildId, 'goodbyeMessage', goodbyeMessage);
  if (autorole) set(guildId, 'autorole', autorole);
  if (verifyRole) set(guildId, 'verifyRole', verifyRole);
  set(guildId, 'voicexp', voicexp === 'on' ? 'true' : 'false');
  set(guildId, 'antiInvite', antiInvite === 'on' ? 'true' : 'false');
  set(guildId, 'antiLink', antiLink === 'on' ? 'true' : 'false');
  set(guildId, 'antiCaps', antiCaps === 'on' ? 'true' : 'false');
  set(guildId, 'antiMassMention', antiMassMention === 'on' ? 'true' : 'false');
  if (bannedWords) {
    set(guildId, 'bannedWords', JSON.stringify(bannedWords.split(',').map(w => w.trim()).filter(Boolean)));
  }

  res.render('guild_config', { user: req.session.user, guild: req.guild, config: buildConfig(guildId), message: '✅ Configuration enregistrée.' });
});

function buildConfig(guildId) {
  const { get } = getConfig();
  return {
    logChannel: get(guildId, 'logChannel'),
    welcomeChannel: get(guildId, 'welcomeChannel'),
    goodbyeChannel: get(guildId, 'goodbyeChannel'),
    welcomeMessage: get(guildId, 'welcomeMessage'),
    goodbyeMessage: get(guildId, 'goodbyeMessage'),
    autorole: get(guildId, 'autorole'),
    verifyRole: get(guildId, 'verifyRole'),
    voicexp: get(guildId, 'voicexp') === 'true',
    antiInvite: get(guildId, 'antiInvite') === 'true',
    antiLink: get(guildId, 'antiLink') === 'true',
    antiCaps: get(guildId, 'antiCaps') === 'true',
    antiMassMention: get(guildId, 'antiMassMention') === 'true',
    bannedWords: (() => { try { return JSON.parse(get(guildId, 'bannedWords') || '[]'); } catch { return []; } })(),
    levelRewards: (() => { try { return JSON.parse(get(guildId, 'levelRewards') || '{}'); } catch { return {}; } })(),
    levelChannelRewards: (() => { try { return JSON.parse(get(guildId, 'levelChannelRewards') || '{}'); } catch { return {}; } })(),
  };
}

app.get('/dashboard/:guildId/config', checkAuth, guildAccess, (req, res) => {
  const { guildId } = req.params;
  res.render('guild_config', { user: req.session.user, guild: req.guild, config: buildConfig(guildId), message: null, error: null });
});

// ─── Start ───────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});
