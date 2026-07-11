const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devine')
    .setDescription('Joue à "Devine le nombre"')
    .addSubcommand(sub =>
      sub.setName('lancer')
        .setDescription('Lance une nouvelle partie')
        .addIntegerOption(opt =>
          opt.setName('max')
            .setDescription('Nombre maximum (défaut: 100)')
            .setMinValue(2)
            .setMaxValue(10000),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('jouer')
        .setDescription('Propose un nombre')
        .addIntegerOption(opt =>
          opt.setName('nombre')
            .setDescription('Ton nombre')
            .setRequired(true)
            .setMinValue(1),
        ),
    ),
  async execute(interaction) {
    const { start, guess } = require('../../games/devineNombre');

    if (interaction.options.getSubcommand() === 'lancer') {
      const max = interaction.options.getInteger('max') || 100;
      start(interaction.user.id, max);
      const embed = new EmbedBuilder()
        .setTitle('🔢 Devine le nombre')
        .setDescription(`J'ai choisi un nombre entre **1** et **${max}**.\nUtilise \`/devine jouer <nombre>\` pour proposer.`)
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }

    const nombre = interaction.options.getInteger('nombre');
    const { addWin, addLoss } = require('../../data/scores');
    const result = guess(interaction.user.id, nombre);

    if (result.error) {
      return interaction.reply({ content: result.error, ephemeral: true });
    }

    if (result.reponse === 'gagne') addWin(interaction.user.id, 'devine');
    else if (result.reponse === 'trop_petit' || result.reponse === 'trop_grand') addLoss(interaction.user.id, 'devine');

    const messages = {
      trop_petit: `📈 Trop **petit** ! (tentative n°${result.tentatives})`,
      trop_grand: `📉 Trop **grand** ! (tentative n°${result.tentatives})`,
      gagne: `🎉 **Bravo !** Tu as trouvé **${result.nombre}** en **${result.tentatives}** tentative(s) !`,
    };

    const embed = new EmbedBuilder()
      .setTitle('🔢 Devine le nombre')
      .setDescription(messages[result.reponse])
      .setColor(result.reponse === 'gagne' ? 0x00FF00 : 0xFFA500);

    await interaction.reply({ embeds: [embed] });
  },
};
