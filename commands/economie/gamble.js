const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, removeBalance } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Tente ta chance')
    .addIntegerOption(o => o.setName('montant').setDescription('Montant à miser').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const amount = interaction.options.getInteger('montant');
    const bal = getBalance(interaction.guildId, interaction.user.id);
    if (bal < amount) return interaction.reply({ content: `❌ Tu n'as que **${bal}** 🪙.`, ephemeral: true });
    const win = Math.random() < 0.45;
    const gain = win ? amount : -amount;
    if (win) addBalance(interaction.guildId, interaction.user.id, amount);
    else removeBalance(interaction.guildId, interaction.user.id, amount);
    const embed = new EmbedBuilder()
      .setColor(win ? 0x2ECC71 : 0xE74C3C).setTitle(win ? '🎉 Gagné !' : '😢 Perdu !')
      .setDescription(win ? `**+${amount}** 🪙` : `**-${amount}** 🪙`);
    await interaction.reply({ embeds: [embed] });
  },
};
