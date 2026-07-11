const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rich')
    .setDescription('Classement des plus riches'),
  async execute(interaction) {
    const top = getLeaderboard(interaction.guildId, 15);
    if (!top.length) return interaction.reply({ content: '📭 Aucun solde enregistré.', ephemeral: true });
    const lines = [];
    for (let i = 0; i < top.length; i++) {
      const u = await interaction.client.users.fetch(top[i].userId).catch(() => null);
      if (!u) continue;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      lines.push(`${medal} **${u.displayName}** — **${top[i].balance}** 🪙`);
    }
    const embed = new EmbedBuilder()
      .setTitle('💰 Classement des plus riches')
      .setDescription(lines.join('\n'))
      .setColor(0xF1C40F);
    await interaction.reply({ embeds: [embed] });
  },
};
