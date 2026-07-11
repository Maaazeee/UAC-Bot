const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Bannir temporairement un membre')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à bannir')
        .setRequired(true),
    )
    .addIntegerOption(opt =>
      opt.setName('durée')
        .setDescription('Durée du ban')
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
        .setDescription('Raison du ban'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const durée = interaction.options.getInteger('durée');
    const unité = interaction.options.getString('unité');
    const raison = interaction.options.getString('raison') || 'Aucune';

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.bannable) return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre.', ephemeral: true });
    if (membre.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te bannir toi-même.', ephemeral: true });

    const ms = { minutes: 60000, hours: 3600000, days: 86400000 };
    const duréeMs = durée * ms[unité];
    const label = { minutes: 'min', hours: 'h', days: 'j' };

    await membre.ban({ reason: `${raison} (tempban ${durée}${label[unité]})`, deleteMessageSeconds: 86400 });

    setTimeout(async () => {
      try {
        await interaction.guild.members.unban(membre.id, 'Ban temporaire expiré');
      } catch {}
    }, duréeMs);

    const embed = new EmbedBuilder()
      .setTitle('🔨 Ban temporaire')
      .setDescription(`**${membre.user.tag}** banni **${durée}${label[unité]}**`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFF0000)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
