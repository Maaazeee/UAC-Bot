const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Supprimer les messages d\'un membre dans le salon')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre dont supprimer les messages')
        .setRequired(true),
    )
    .addIntegerOption(opt =>
      opt.setName('limite')
        .setDescription('Nombre de messages à vérifier (défaut: 100)')
        .setMinValue(1)
        .setMaxValue(500),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const limite = interaction.options.getInteger('limite') || 100;

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: Math.min(limite, 100) });
    const targetMessages = messages.filter(m => m.author.id === membre.id);
    const deleted = await interaction.channel.bulkDelete(targetMessages, true);

    await interaction.reply({
      content: `🗑️ **${deleted.size}** message(s) de **${membre.user.tag}** supprimés.`,
      ephemeral: true,
    });
  },
};
