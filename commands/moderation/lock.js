const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Vérouiller le salon (empêcher les membres d\'écrire)')
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du vérouillage'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    await interaction.channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setTitle('🔒 Salon vérouillé')
      .setDescription(`Ce salon a été vérouillé.`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
