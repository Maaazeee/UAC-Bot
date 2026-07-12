const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const categoryNames = {
  jeux: '🎮 Jeux',
  moderation: '🛡️ Modération',
  vocal: '🔊 Vocal',
  config: '⚙️ Configuration',
  niveau: '📊 Niveaux',
  musique: '🎵 Musique',
  utilitaire: '🔧 Utilitaire',
  economie: '💰 Économie',
  fun: '🎲 Fun',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Affiche la liste des commandes'),
  async execute(interaction) {
    const cmdDir = join(__dirname, '..');
    const categories = readdirSync(cmdDir).filter(e => statSync(join(cmdDir, e)).isDirectory());
    const embeds = [];
    let embed = new EmbedBuilder().setTitle('📋 Commandes').setColor(0x00AE86).setFooter({ text: 'Amuse-toi bien !' });
    let fieldCount = 0;

    for (const cat of categories) {
      const files = readdirSync(join(cmdDir, cat)).filter(f => f.endsWith('.js'));
      if (files.length === 0) continue;
      const name = categoryNames[cat] || `📁 ${cat}`;
      const value = files.map(f => {
        const cmd = f.replace('.js', '');
        const desc = interaction.client.commands.get(cmd)?.data?.description || '';
        return `\`/${cmd}\` — ${desc}`;
      }).join('\n');

      if (value.length > 1024) {
        const chunks = [];
        let current = '';
        for (const line of value.split('\n')) {
          if ((current + '\n' + line).length > 1024) { chunks.push(current); current = line; }
          else current = current ? current + '\n' + line : line;
        }
        if (current) chunks.push(current);
        for (const chunk of chunks) {
          if (fieldCount >= 25) { embeds.push(embed); embed = new EmbedBuilder().setColor(0x00AE86); fieldCount = 0; }
          embed.addFields({ name: fieldCount === 0 ? name : `${name} (suite)`, value: chunk });
          fieldCount++;
        }
      } else {
        if (fieldCount >= 25) { embeds.push(embed); embed = new EmbedBuilder().setColor(0x00AE86); fieldCount = 0; }
        embed.addFields({ name, value });
        fieldCount++;
      }
    }

    embeds.push(embed);
    await interaction.reply({ embeds });
  },
};
