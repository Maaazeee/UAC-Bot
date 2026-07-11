const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, removeBalance } = require('../../data/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Donne des pièces à un membre')
    .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
    .addIntegerOption(o => o.setName('montant').setDescription('Montant à donner').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const amount = interaction.options.getInteger('montant');
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te donner à toi-même.', ephemeral: true });
    const senderBal = getBalance(interaction.guildId, interaction.user.id);
    if (senderBal < amount) return interaction.reply({ content: `❌ Tu n'as que **${senderBal}** 🪙.`, ephemeral: true });
    removeBalance(interaction.guildId, interaction.user.id, amount);
    addBalance(interaction.guildId, target.id, amount);
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71).setTitle('💸 Transfert')
      .setDescription(`${interaction.user} a donné **${amount}** 🪙 à ${target}`);
    await interaction.reply({ embeds: [embed] });
  },
};
