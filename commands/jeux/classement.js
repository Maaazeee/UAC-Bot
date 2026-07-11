const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Affiche le classement des joueurs'),
  async execute(interaction) {
    const { getClassement, GAMES } = require('../../data/scores');
    const classement = getClassement();

    if (classement.length === 0) {
      return interaction.reply({ content: '📭 Aucun score enregistré pour le moment.', ephemeral: true });
    }

    const top = classement.slice(0, 15);
    const lines = [];

    for (let i = 0; i < top.length; i++) {
      const entry = top[i];
      let user;
      try {
        user = await interaction.client.users.fetch(entry.userId);
      } catch {
        continue;
      }
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const details = GAMES.map(g => `${g.label}${entry[g.key] || 0}`).join('  ');
      lines.push(`${medal} **${user.displayName}** — **${entry.total}** pts 🏆\n┗ ${details}`);
    }

    const gameLabels = GAMES.map(g => `${g.label}=${g.key}`).join(', ');

    const embed = new EmbedBuilder()
      .setTitle('🏆 Classement des joueurs')
      .setDescription(lines.join('\n\n'))
      .setColor(0xFFD700)
      .setFooter({ text: `Points: ${gameLabels}` });

    await interaction.reply({ embeds: [embed] });
  },
};
