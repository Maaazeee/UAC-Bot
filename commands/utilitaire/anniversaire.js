const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setBirthday, getBirthday, removeBirthday } = require('../../data/birthdays');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anniversaire')
    .setDescription('Gère ton anniversaire')
    .addSubcommand(s => s.setName('set').setDescription('Enregistre ta date').addStringOption(o => o.setName('date').setDescription('JJ-MM').setRequired(true)))
    .addSubcommand(s => s.setName('get').setDescription('Voir ta date'))
    .addSubcommand(s => s.setName('remove').setDescription('Supprime ta date')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      const date = interaction.options.getString('date');
      if (!/^\d{2}-\d{2}$/.test(date)) return interaction.reply({ content: '❌ Format: JJ-MM (ex: 14-07)', ephemeral: true });
      setBirthday(interaction.guildId, interaction.user.id, date);
      return interaction.reply({ content: `✅ Anniversaire enregistré : **${date}**`, ephemeral: true });
    }
    if (sub === 'get') {
      const d = getBirthday(interaction.guildId, interaction.user.id);
      return interaction.reply({ content: d ? `🎂 Ta date : **${d.date}**` : '❌ Aucune date enregistrée.', ephemeral: true });
    }
    if (sub === 'remove') {
      if (!removeBirthday(interaction.guildId, interaction.user.id)) return interaction.reply({ content: '❌ Aucune date enregistrée.', ephemeral: true });
      return interaction.reply({ content: '✅ Date supprimée.', ephemeral: true });
    }
  },
};
