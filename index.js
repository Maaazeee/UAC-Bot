const { join, dirname } = require('path');
const { readdirSync, statSync } = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpeg = require('ffmpeg-static');
const logger = require('./data/logger');

process.env.FFMPEG_PATH = ffmpeg;
process.env.PATH = `${dirname(ffmpeg)};${process.env.PATH || ''}`;
require('dotenv/config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.games = new Collection();

client.distube = new DisTube(client, {
  plugins: [new SpotifyPlugin(), new SoundCloudPlugin(), new YtDlpPlugin({ update: false })],
  emitNewSongOnly: true,
  savePreviousSongs: true,
  nsfw: true,
  joinNewVoiceChannel: true,
  ffmpeg: { path: ffmpeg },
});

const { EmbedBuilder } = require('discord.js');
client.distube.on('initQueue', (queue) => {
  queue.volume = 50;
  queue.autoplay = false;
});
client.distube.on('playSong', async (queue, song) => {
  const embed = new EmbedBuilder()
    .setTitle('🎵 En cours').setDescription(`**${song.name}** — \`${song.formattedDuration}\``)
    .setURL(song.url);
  try { embed.setThumbnail(typeof song.thumbnail === 'function' ? await song.thumbnail() : song.thumbnail); } catch {}
  embed.setFooter({ text: `Demandé par ${song.user.tag}` }).setColor(0x00FF00);
  queue.textChannel?.send({ embeds: [embed] });
  logger.info(`Lecture: ${song.name} (${song.url})`);
});
client.distube.on('addSong', (queue, song) => {
  const embed = new EmbedBuilder()
    .setTitle('✅ Ajouté à la file').setDescription(`**${song.name}** — \`${song.formattedDuration}\``).setColor(0x00AE86);
  queue.textChannel?.send({ embeds: [embed] });
});
client.distube.on('addList', (queue, playlist) => {
  const embed = new EmbedBuilder()
    .setTitle('📋 Playlist ajoutée').setDescription(`**${playlist.name}** (${playlist.songs.length} titres)`).setColor(0x00AE86);
  queue.textChannel?.send({ embeds: [embed] });
});
client.distube.on('error', (channel, error) => {
  logger.error(error);
  channel?.send({ content: `❌ Erreur: ${error.message.slice(0, 200)}` }).catch(() => {});
});
client.distube.on('empty', (queue) => queue.textChannel?.send({ content: '👋 Salon vide, je quitte le vocal...' }));
client.distube.on('disconnect', (queue) => queue.textChannel?.send({ content: '👋 Déconnecté du salon vocal.' }));
client.distube.on('finish', (queue) => queue.textChannel?.send({ content: '🎵 File terminée.' }));
client.distube.on('searchNoResult', (channel, query) => {
  channel?.send({ content: `❌ Aucun résultat pour **${query}**.` }).catch(() => {});
});
client.distube.on('searchCancel', (channel) => {
  channel?.send({ content: '❌ Recherche annulée.' }).catch(() => {});
});

function loadCommands(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      loadCommands(full);
    } else if (entry.endsWith('.js')) {
      const command = require(full);
      client.commands.set(command.data.name, command);
    }
  }
}
loadCommands(join(__dirname, 'commands'));

const gameFiles = readdirSync(join(__dirname, 'games')).filter(f => f.endsWith('.js'));
for (const file of gameFiles) {
  const game = require(join(__dirname, 'games', file));
  client.games.set(game.name, game);
}

const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.DISCORD_TOKEN).then(() => logger.info('Bot démarré')).catch(e => logger.error('Échec login:', e));
