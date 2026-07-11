const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgoodbye')
    .setDescription('Configurer le message d\'au revoir')
    .addChannelOption(opt =>
      opt.setName('salon')
        .setDescription('Le salon pour les messages d\'au revoir')
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Message ({user}=membre, {server}=serveur)'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const salon = interaction.options.getChannel('salon');
    const message = interaction.options.getString('message');

    require('../../data/config').set(interaction.guildId, 'goodbyeChannel', salon.id);
    if (message) require('../../data/config').set(interaction.guildId, 'goodbyeMessage', message);

    const embed = new EmbedBuilder()
      .setTitle('✅ Au revoir configuré')
      .setDescription(`Les messages d'au revoir iront dans ${salon}${message ? `\nMessage: *${message}*` : ''}`)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
