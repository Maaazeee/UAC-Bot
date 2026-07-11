const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclamer votre bonus XP quotidien'),
  async execute(interaction) {
    const { getDailyBonus } = require('../../data/levels');
    const result = getDailyBonus(interaction.guildId, interaction.user.id);

    if (result.claimed) {
      return interaction.reply({ content: '⏳ Tu as déjà réclamé ton bonus quotidien aujourd\'hui. Reviens demain !', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎁 Bonus quotidien')
      .setDescription(`Tu as reçu **${result.bonus}** XP bonus !`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
