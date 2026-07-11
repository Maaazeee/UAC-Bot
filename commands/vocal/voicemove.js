const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicemove')
    .setDescription('Déplacer un membre dans un autre salon vocal')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à déplacer')
        .setRequired(true),
    )
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Le salon vocal de destination')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const salon = interaction.options.getChannel('salon');

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.voice.channel) return interaction.reply({ content: '❌ Ce membre n\'est pas en vocal.', ephemeral: true });
    if (salon.type !== 2) return interaction.reply({ content: '❌ Le salon doit être un salon vocal.', ephemeral: true });

    await membre.voice.setChannel(salon);

    const embed = new EmbedBuilder()
      .setTitle('🚚 Membre déplacé')
      .setDescription(`**${membre.user.tag}** déplacé vers ${salon}`)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
