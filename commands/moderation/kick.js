const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre du serveur')
    .addUserOption(opt =>
      opt.setName('membre')
        .setDescription('Le membre à expulser')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison de l\'expulsion'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const membre = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    if (!membre) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!membre.kickable) return interaction.reply({ content: '❌ Je ne peux pas expulser ce membre.', ephemeral: true });
    if (membre.id === interaction.user.id) return interaction.reply({ content: '❌ Tu ne peux pas t\'expulser toi-même.', ephemeral: true });

    await membre.kick(raison);

    const embed = new EmbedBuilder()
      .setTitle('👢 Membre expulsé')
      .setDescription(`**${membre.user.tag}** a été expulsé.`)
      .addFields({ name: 'Raison', value: raison })
      .setColor(0xFFA500)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
