const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempvoice')
    .setDescription('Configure les salons vocaux temporaires')
    .addChannelOption(o => o.setName('salon').setDescription('Salon vocal de création').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    .addChannelOption(o => o.setName('categorie').setDescription('Catégorie où créer les salons').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    set(interaction.guildId, 'tempVoiceSource', interaction.options.getChannel('salon').id);
    set(interaction.guildId, 'tempVoiceCategory', interaction.options.getChannel('categorie').id);
    await interaction.reply({ content: '✅ Salons vocaux temporaires configurés.', ephemeral: true });
  },
};
