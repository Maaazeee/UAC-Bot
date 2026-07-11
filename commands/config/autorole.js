const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Gérer le rôle automatique à l\'arrivée')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Définir le rôle attribué automatiquement')
        .addRoleOption(opt =>
          opt.setName('role')
            .setDescription('Le rôle à attribuer')
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver le rôle automatique'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');

    if (interaction.options.getSubcommand() === 'set') {
      const role = interaction.options.getRole('role');
      set(interaction.guildId, 'autoRole', role.id);
      const embed = new EmbedBuilder()
        .setTitle('✅ Rôle automatique')
        .setDescription(`Le rôle **${role.name}** sera attribué aux nouveaux membres.`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    set(interaction.guildId, 'autoRole', null);
    const embed = new EmbedBuilder()
      .setTitle('✅ Rôle automatique désactivé')
      .setDescription('Aucun rôle ne sera plus attribué automatiquement.')
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
