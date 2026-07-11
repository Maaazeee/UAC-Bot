const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiinvite')
    .setDescription('Bloquer les invitations Discord dans les messages')
    .addStringOption(opt =>
      opt.setName('état')
        .setDescription('Activer ou désactiver')
        .setRequired(true)
        .addChoices(
          { name: 'ON', value: 'on' },
          { name: 'OFF', value: 'off' },
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');
    const état = interaction.options.getString('état') === 'on';
    set(interaction.guildId, 'antiInvite', état);

    const embed = new EmbedBuilder()
      .setTitle(état ? '🚫 Anti-invite activé' : '🚫 Anti-invite désactivé')
      .setDescription(état
        ? 'Les invitations Discord (discord.gg/...) seront supprimées.'
        : 'Le filtre anti-invite est désactivé.')
      .setColor(état ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
