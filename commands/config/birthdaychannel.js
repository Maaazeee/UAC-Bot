const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthdaychannel')
    .setDescription('Configure le salon d\'annonce des anniversaires')
    .addChannelOption(o => o.setName('salon').setDescription('Salon').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addStringOption(o => o.setName('message').setDescription('Message ({users} pour les mentions)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    set(interaction.guildId, 'birthdayChannel', interaction.options.getChannel('salon').id);
    if (interaction.options.getString('message')) set(interaction.guildId, 'birthdayMessage', interaction.options.getString('message'));
    await interaction.reply({ content: '✅ Salon d\'anniversaires configuré.', ephemeral: true });
  },
};
