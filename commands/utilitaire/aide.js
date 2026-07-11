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
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Affiche la liste des commandes'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Commandes')
      .setColor(0x00AE86)
      .setFooter({ text: 'Amuse-toi bien !' });

    const cmdDir = join(__dirname, '..');
    const categories = readdirSync(cmdDir).filter(e => statSync(join(cmdDir, e)).isDirectory());

    for (const cat of categories) {
      const files = readdirSync(join(cmdDir, cat)).filter(f => f.endsWith('.js'));
      if (files.length === 0) continue;
      const name = categoryNames[cat] || `📁 ${cat}`;
      embed.addFields({
        name,
        value: files.map(f => {
          const cmd = f.replace('.js', '');
          const desc = interaction.client.commands.get(cmd)?.data?.description || '';
          return `\`/${cmd}\` — ${desc}`;
        }).join('\n'),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
