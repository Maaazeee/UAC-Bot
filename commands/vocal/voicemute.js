const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicemute')
    .setDescription('Mute/Unmute un membre en vocal')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à mute/unmute')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.voice.channel) return interaction.reply({ content: '❌ Ce membre n\'est pas en vocal.', ephemeral: true });

    const mute = !membre.voice.serverMute;
    await membre.voice.setMute(mute);

    const embed = new EmbedBuilder()
      .setTitle(mute ? '🔇 Membre mute' : '🔊 Membre unmute')
      .setDescription(`**${membre.user.tag}** ${mute ? 'mute' : 'unmute'} en vocal.`)
      .setColor(mute ? 0xFF0000 : 0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
