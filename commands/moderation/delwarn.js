const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delwarn')
    .setDescription('Supprimer un avertissement spécifique')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre concerné')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('ID de l\'avertissement à supprimer')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const { removeWarn, getWarns } = require('../../data/warns');
    const membre = interaction.options.getMember('membre');
    const warnId = interaction.options.getString('id');

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

    const warns = getWarns(membre.id, interaction.guildId);
    const warn = warns.find(w => w.id === warnId);
    if (!warn) return interaction.reply({ content: '❌ Avertissement introuvable. Utilise `/warn liste` pour voir les IDs.', ephemeral: true });

    const removed = removeWarn(membre.id, interaction.guildId, warnId);
    if (!removed) return interaction.reply({ content: '❌ Erreur lors de la suppression.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('✅ Avertissement supprimé')
      .setDescription(`Avertissement #${warnId} de **${membre.user.tag}** supprimé.`)
      .addFields({ name: 'Raison d\'origine', value: warn.raison })
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
