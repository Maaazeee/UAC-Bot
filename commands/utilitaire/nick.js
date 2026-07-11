const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Changer le pseudo d\'un membre')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre concerné')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('pseudo')
        .setDescription('Le nouveau pseudo (laisser vide pour réinitialiser)'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const pseudo = interaction.options.getString('pseudo');

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.manageable) return interaction.reply({ content: '❌ Je ne peux pas modifier le pseudo de ce membre.', ephemeral: true });

    await membre.setNickname(pseudo || null);

    const embed = new EmbedBuilder()
      .setTitle('✏️ Pseudo modifié')
      .setDescription(pseudo
        ? `Le pseudo de **${membre.user.tag}** est maintenant **${pseudo}**.`
        : `Le pseudo de **${membre.user.tag}** a été réinitialisé.`)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
