const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir ton solde ou celui d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à consulter')),
  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const bal = getBalance(interaction.guildId, target.id);
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F).setTitle(`💰 Solde de ${target.displayName}`)
      .setDescription(`**${bal}** 🪙`);
    await interaction.reply({ embeds: [embed] });
  },
};
