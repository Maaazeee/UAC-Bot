const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages dans le salon')
    .addIntegerOption(opt =>
      opt.setName('nombre')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const nombre = interaction.options.getInteger('nombre');

    const messages = await interaction.channel.bulkDelete(nombre, true);
    const msg = await interaction.reply({
      content: `🗑️ **${messages.size}** message(s) supprimés.`,
      ephemeral: true,
    });
  },
};
