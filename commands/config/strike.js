const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('strike')
    .setDescription('Configurer les actions automatiques après X warns')
    .addSubcommand(sub =>
      sub.setName('timeout')
        .setDescription('Timeout auto après X warns')
        .addIntegerOption(opt =>
          opt.setName('warns')
            .setDescription('Nombre de warns avant timeout')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(20),
        )
        .addIntegerOption(opt =>
          opt.setName('durée')
            .setDescription('Durée du timeout en minutes')
            .setRequired(true)
            .setMinValue(1),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Ban auto après X warns')
        .addIntegerOption(opt =>
          opt.setName('warns')
            .setDescription('Nombre de warns avant ban')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(20),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Désactiver les actions automatiques'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const { set } = require('../../data/config');

    if (interaction.options.getSubcommand() === 'timeout') {
      const warns = interaction.options.getInteger('warns');
      const durée = interaction.options.getInteger('durée');
      set(interaction.guildId, 'strikeTimeout', { warns, durée });
      const embed = new EmbedBuilder()
        .setTitle('✅ Strike timeout')
        .setDescription(`Timeout de **${durée}** min après **${warns}** warns.`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'ban') {
      const warns = interaction.options.getInteger('warns');
      set(interaction.guildId, 'strikeBan', { warns });
      const embed = new EmbedBuilder()
        .setTitle('✅ Strike ban')
        .setDescription(`Ban automatique après **${warns}** warns.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [embed] });
    }

    set(interaction.guildId, 'strikeTimeout', null);
    set(interaction.guildId, 'strikeBan', null);
    const embed = new EmbedBuilder()
      .setTitle('✅ Strikes désactivés')
      .setDescription('Aucune action automatique sur warns.')
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
