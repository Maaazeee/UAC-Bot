const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configure le message/image de bienvenue')
    .addChannelOption(o => o.setName('salon').setDescription('Salon de bienvenue').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addStringOption(o => o.setName('message').setDescription('Message (utilise {user} et {server})'))
    .addBooleanOption(o => o.setName('image').setDescription('Activer l\'image de bienvenue (Canvas)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    set(interaction.guildId, 'welcomeChannel', interaction.options.getChannel('salon').id);
    if (interaction.options.getString('message')) set(interaction.guildId, 'welcomeMessage', interaction.options.getString('message'));
    set(interaction.guildId, 'welcomeImage', interaction.options.getBoolean('image') || false);
    await interaction.reply({ content: '✅ Salon de bienvenue configuré.', ephemeral: true });
  },
};
