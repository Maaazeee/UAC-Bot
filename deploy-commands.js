const { REST, Routes } = require('discord.js');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const logger = require('./data/logger');
require('dotenv/config');

const commands = [];

function loadCommands(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      loadCommands(full);
    } else if (entry.endsWith('.js')) {
      const command = require(full);
      commands.push(command.data.toJSON());
    }
  }
}

loadCommands(join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (commands.length === 0) { logger.warn('Aucune commande à déployer.'); return; }
    logger.info(`Déploiement de ${commands.length} commandes...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    logger.info(`${data.length} commandes déployées avec succès.`);
  } catch (error) {
    logger.error(`Erreur déploiement: ${error.stack || error}`);
    process.exit(1);
  }
})();
