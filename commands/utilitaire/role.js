const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Ajouter ou retirer un rôle à un membre')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Ajouter un rôle')
        .addUserOption(opt =>
          opt.setName('membre').setDescription('Le membre').setRequired(true),
        )
        .addRoleOption(opt =>
          opt.setName('rôle').setDescription('Le rôle à ajouter').setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Retirer un rôle')
        .addUserOption(opt =>
          opt.setName('membre').setDescription('Le membre').setRequired(true),
        )
        .addRoleOption(opt =>
          opt.setName('rôle').setDescription('Le rôle à retirer').setRequired(true),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const rôle = interaction.options.getRole('rôle');

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!rôle) return interaction.reply({ content: '❌ Rôle introuvable.', ephemeral: true });
    if (rôle.comparePositionTo(interaction.member.roles.highest) >= 0 && interaction.guild.ownerId !== interaction.user.id)
      return interaction.reply({ content: '❌ Ce rôle est trop haut pour que tu le gères.', ephemeral: true });
    if (!membre.manageable)
      return interaction.reply({ content: '❌ Je ne peux pas gérer les rôles de ce membre.', ephemeral: true });

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      if (membre.roles.cache.has(rôle.id))
        return interaction.reply({ content: '❌ Ce membre a déjà ce rôle.', ephemeral: true });
      await membre.roles.add(rôle);
    } else {
      if (!membre.roles.cache.has(rôle.id))
        return interaction.reply({ content: '❌ Ce membre n\'a pas ce rôle.', ephemeral: true });
      await membre.roles.remove(rôle);
    }

    const action = sub === 'add' ? 'ajouté' : 'retiré';
    const embed = new EmbedBuilder()
      .setTitle(sub === 'add' ? '➕ Rôle ajouté' : '➖ Rôle retiré')
      .setDescription(`Le rôle ${rôle} a été **${action}** à **${membre.user.tag}**.`)
      .setColor(sub === 'add' ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
