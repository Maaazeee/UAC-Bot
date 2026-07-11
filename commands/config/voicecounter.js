const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicecounter')
    .setDescription('Configure le compteur de membres vocaux')
    .addChannelOption(o => o.setName('salon').setDescription('Salon vocal pour le compteur').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    set(interaction.guildId, 'voiceCounterChannel', interaction.options.getChannel('salon').id);
    await interaction.reply({ content: '✅ Compteur vocal configuré.', ephemeral: true });
  },
};
