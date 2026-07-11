const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { get, set } = require('../../data/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('starboard')
    .setDescription('Configure le starboard')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('set').setDescription('Définit le salon starboard').addChannelOption(o => o.setName('salon').setDescription('Salon').setRequired(true)))
    .addSubcommand(s => s.setName('disable').setDescription('Désactive le starboard'))
    .addSubcommand(s => s.setName('config').setDescription('Voir la config du starboard')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'set') {
      set(interaction.guildId, 'starboardChannel', interaction.options.getChannel('salon').id);
      set(interaction.guildId, 'starboardMin', 3);
      return interaction.reply({ content: '✅ Starboard configuré.', ephemeral: true });
    }
    if (sub === 'disable') {
      set(interaction.guildId, 'starboardChannel', null);
      return interaction.reply({ content: '✅ Starboard désactivé.', ephemeral: true });
    }
    if (sub === 'config') {
      const ch = get(interaction.guildId, 'starboardChannel');
      const min = get(interaction.guildId, 'starboardMin') || 3;
      return interaction.reply({ content: ch ? `⭐ Starboard : <#${ch}> (min ${min} ⭐)` : '❌ Starboard désactivé.', ephemeral: true });
    }
  },
};
