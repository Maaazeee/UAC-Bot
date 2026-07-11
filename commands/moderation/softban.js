const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Bannir puis débannir immédiatement (purge les messages)')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à softban')
        .setRequired(true),
    )
    .addIntegerOption(opt =>
      opt.setName('messages')
        .setDescription('Nombre de jours de messages à supprimer (max 7)')
        .setMinValue(0)
        .setMaxValue(7),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du softban'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const jours = interaction.options.getInteger('messages') || 1;
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.bannable) return interaction.reply({ content: '❌ Je ne peux pas bannir ce membre.', ephemeral: true });
    if (membre.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas te softban toi-même.', ephemeral: true });

    await membre.ban({ deleteMessageSeconds: jours * 86400, reason: raison });
    await interaction.guild.members.unban(membre.id, `Softban: ${raison}`);

    const embed = new EmbedBuilder()
      .setTitle('🧹 Softban')
      .setDescription(`**${membre.user.tag}** a été softban (${jours} jour(s) de messages supprimés).`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFFA500)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
