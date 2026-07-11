const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Traduit un texte')
    .addStringOption(o => o.setName('texte').setDescription('Texte à traduire').setRequired(true))
    .addStringOption(o => o.setName('langue').setDescription('Langue cible (ex: en, es, de)').setRequired(true)),
  async execute(interaction) {
    const texte = interaction.options.getString('texte');
    const langue = interaction.options.getString('langue');
    await interaction.deferReply();
    try {
      const { default: translate } = require('@vitalets/google-translate-api');
      const result = await translate(texte, { to: langue });
      const embed = new EmbedBuilder()
        .setColor(0x00AE86).setTitle('🌍 Traduction')
        .addFields({ name: 'Original', value: texte.slice(0, 1024) }, { name: `Traduit (${langue})`, value: result.text.slice(0, 1024) });
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: '❌ Erreur de traduction. Vérifie le code langue (ex: en, es, de).' });
    }
  },
};
