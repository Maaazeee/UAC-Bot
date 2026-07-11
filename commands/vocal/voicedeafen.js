const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicedeafen')
    .setDescription('Rendre sourd/Non sourd un membre en vocal')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à rendre sourd')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.voice.channel) return interaction.reply({ content: '❌ Ce membre n\'est pas en vocal.', ephemeral: true });

    const deaf = !membre.voice.serverDeaf;
    await membre.voice.setDeaf(deaf);

    const embed = new EmbedBuilder()
      .setTitle(deaf ? '🔇 Membre rendu sourd' : '🔊 Membre réentend')
      .setDescription(`**${membre.user.tag}** ${deaf ? 'rendu sourd' : 'réentend'} en vocal.`)
      .setColor(deaf ? 0xFF0000 : 0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
