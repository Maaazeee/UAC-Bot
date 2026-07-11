const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const reponses = [
  'Oui', 'Non', 'Peut-être', 'Absolument', 'Jamais',
  'C\'est certain', 'Je ne pense pas', 'Demande plus tard',
  'Tu peux compter dessus', 'N\'y compte pas', 'Bien sûr',
  'Les signes disent oui', 'Les signes disent non', 'Je dirais oui',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pose une question à la boule magique')
    .addStringOption(o => o.setName('question').setDescription('Ta question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const r = reponses[Math.floor(Math.random() * reponses.length)];
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6).setTitle('🎱 8Ball')
      .addFields({ name: 'Question', value: q }, { name: 'Réponse', value: r });
    await interaction.reply({ embeds: [embed] });
  },
};
