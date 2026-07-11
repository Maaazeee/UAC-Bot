const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à bannir')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du bannissement'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.bannable) return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre.', ephemeral: true });
    if (membre.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te bannir toi-même.', ephemeral: true });

    await membre.ban({ reason: raison });

    const embed = new EmbedBuilder()
      .setTitle('🔨 Membre banni')
      .setDescription(`**${membre.user.tag}** a été banni.`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
