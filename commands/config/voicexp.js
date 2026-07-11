const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicexp')
    .setDescription('Activer/désactiver l\'XP vocal')
    .addStringOption(opt =>
      opt.setName('état').setDescription('ON ou OFF').setRequired(true)
        .addChoices({ name: 'ON', value: 'on' }, { name: 'OFF', value: 'off' }),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');
    const état = interaction.options.getString('état') === 'on';
    set(interaction.guildId, 'xpVoiceEnabled', état);

    const embed = new EmbedBuilder()
      .setTitle('🎤 XP Vocal')
      .setDescription(état ? 'Les membres gagneront de l\'XP en restant en vocal.' : 'XP vocal désactivé.')
      .setColor(état ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
