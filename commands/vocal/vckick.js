const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vckick')
    .setDescription('Déconnecter un membre du salon vocal')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à déconnecter')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.voice.channel) return interaction.reply({ content: '❌ Ce membre n\'est pas en vocal.', ephemeral: true });

    await membre.voice.disconnect();

    const embed = new EmbedBuilder()
      .setTitle('👢 Déconnecté du vocal')
      .setDescription(`**${membre.user.tag}** a été déconnecté du salon vocal.`)
      .setColor(0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
