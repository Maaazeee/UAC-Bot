const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur')
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('L\'ID de l\'utilisateur à débannir')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('raison')
        .setDescription('Raison du débannissement'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const id = interaction.options.getString('id');
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    try {
      await interaction.guild.members.unban(id, raison);
      const embed = new EmbedBuilder()
        .setTitle('✅ Utilisateur débanni')
        .setDescription(`**${id}** a été débanni.`)
        .addFields({ name: 'Raison', value: raison })
        .setColor(0x00FF00)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: '❌ ID invalide ou utilisateur non banni.', ephemeral: true });
    }
  },
};
