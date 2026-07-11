const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Classement des niveaux sur le serveur'),
  async execute(interaction) {
    const { getLeaderboard } = require('../../data/levels');
    const top = getLeaderboard(interaction.guildId);

    if (top.length === 0) return interaction.reply({ content: '📭 Aucun niveau enregistré pour le moment.', ephemeral: true });

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
      lines.push(`${medal} **${user.displayName}** — Niveau **${entry.level}** (${entry.xp} XP)`);
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Classement des niveaux')
      .setDescription(lines.join('\n'))
      .setColor(0x5865F2);

    await interaction.reply({ embeds: [embed] });
  },
};
