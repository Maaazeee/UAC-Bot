const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDailyBonus } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailycoin')
    .setDescription('Réclame ta récompense quotidienne de pièces'),
  async execute(interaction) {
    const result = getDailyBonus(interaction.guildId, interaction.user.id);
    if (result.claimed) return interaction.reply({ content: '⏳ Tu as déjà réclamé ton daily aujourd\'hui.', ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71).setTitle('🎁 Daily')
      .setDescription(`Tu as reçu **${result.bonus}** 🪙 !`);
    await interaction.reply({ embeds: [embed] });
  },
};
