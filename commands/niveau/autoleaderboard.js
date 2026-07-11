const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoleaderboard')
    .setDescription('Configurer le classement automatique des niveaux')
    .addChannelOption(opt =>
      opt.setName('salon').setDescription('Salon pour le classement (laisser vide pour désactiver)'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');
    const salon = interaction.options.getChannel('salon');

    if (!salon) {
      set(interaction.guildId, 'autoLeaderboard', null);
      return interaction.reply({ content: '✅ Classement automatique désactivé.' });
    }

    set(interaction.guildId, 'autoLeaderboard', { channelId: salon.id, messageId: null });

    const embed = new EmbedBuilder()
      .setTitle('📊 Classement automatique')
      .setDescription(`Le top niveaux sera mis à jour toutes les 10 min dans ${salon}.`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
