const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Mettre un membre en timeout')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à timeout')
        .setRequired(true),
    )
    .addIntegerOption(opt =>
      opt.setName('durée')
        .setDescription('Durée du timeout')
        .setRequired(true)
        .setMinValue(1),
    )
    .addStringOption(opt =>
      opt.setName('unité')
        .setDescription('Unité de temps')
        .setRequired(true)
        .addChoices(
          { name: 'Minutes', value: 'minutes' },
          { name: 'Heures', value: 'hours' },
          { name: 'Jours', value: 'days' },
        ),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du timeout'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const durée = interaction.options.getInteger('durée');
    const unité = interaction.options.getString('unité');
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.moderatable) return interaction.reply({ content: '❌ Je ne peux pas timeout ce membre.', ephemeral: true });
    if (membre.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te timeout toi-même.', ephemeral: true });

    const ms = { minutes: 60000, hours: 3600000, days: 86400000 };
    const duréeMs = durée * ms[unité];

    if (duréeMs > 2419200000) return interaction.reply({ content: '❌ Le timeout ne peut pas dépasser 28 jours.', ephemeral: true });

    await membre.timeout(duréeMs, raison);

    const label = { minutes: 'min', hours: 'h', days: 'j' };
    const embed = new EmbedBuilder()
      .setTitle('⏳ Membre timeout')
      .setDescription(`**${membre.user.tag}** a été timeout **${durée}${label[unité]}**`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFFA500)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
