const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moveall')
    .setDescription('Déplacer tous les membres d\'un salon vocal vers un autre')
    .addChannelOption(opt =>
      opt.setName('source')
        .setDescription('Salon vocal source')
        .setRequired(true),
    )
    .addChannelOption(opt =>
      opt.setName('destination')
        .setDescription('Salon vocal de destination')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction) {
    const source = interaction.options.getChannel('source');
    const dest = interaction.options.getChannel('destination');

    if (source.type !== 2) return interaction.reply({ content: '❌ Le salon source doit être un salon vocal.', ephemeral: true });
    if (dest.type !== 2) return interaction.reply({ content: '❌ Le salon de destination doit être un salon vocal.', ephemeral: true });

    const members = source.members;
    if (members.size === 0) return interaction.reply({ content: '❌ Aucun membre dans ce salon vocal.', ephemeral: true });

    let count = 0;
    for (const [, member] of members) {
      try {
        await member.voice.setChannel(dest);
        count++;
      } catch {}
    }

    const embed = new EmbedBuilder()
      .setTitle('🚚 Déplacement massif')
      .setDescription(`**${count}** membre(s) déplacé(s) de ${source} vers ${dest}.`)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
