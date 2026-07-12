const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
require('dotenv/config');

const app = express();
const PORT = 8080;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

app.use(session({ secret: process.env.SESSION_SECRET || 'change-me', resave: false, saveUninitialized: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

function checkAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

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
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

    const { access_token } = tokenRes.data;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    req.session.user = userRes.data;
    req.session.guilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8);
    req.session.access_token = access_token;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err.response?.data || err);
    res.send('Erreur d\'authentification.');
  }
});

app.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user, guilds: req.session.guilds });
});

app.get('/dashboard/:guildId', checkAuth, async (req, res) => {
  const { guildId } = req.params;
  const guild = req.session.guilds?.find(g => g.id === guildId);
  if (!guild) return res.status(403).send('Accès refusé.');

  const { get } = require('../data/config');
  const config = {
    logChannel: get(guildId, 'logChannel'),
    welcomeChannel: get(guildId, 'welcomeChannel'),
    welcomeMessage: get(guildId, 'welcomeMessage'),
    goodbyeChannel: get(guildId, 'goodbyeChannel'),
    goodbyeMessage: get(guildId, 'goodbyeMessage'),
    bannedWords: get(guildId, 'bannedWords') || [],
  };

  res.render('guild', { user: req.session.user, guild, config });
});

app.post('/dashboard/:guildId', checkAuth, async (req, res) => {
  const { guildId } = req.params;
  const { set } = require('../data/config');
  const { logChannel, welcomeChannel, welcomeMessage, goodbyeChannel, goodbyeMessage } = req.body;

  if (logChannel) set(guildId, 'logChannel', logChannel);
  if (welcomeChannel) set(guildId, 'welcomeChannel', welcomeChannel);
  if (welcomeMessage) set(guildId, 'welcomeMessage', welcomeMessage);
  if (goodbyeChannel) set(guildId, 'goodbyeChannel', goodbyeChannel);
  if (goodbyeMessage) set(guildId, 'goodbyeMessage', goodbyeMessage);

  res.redirect(`/dashboard/${guildId}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});
