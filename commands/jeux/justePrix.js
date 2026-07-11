const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('justeprix')
    .setDescription('Joue au Juste Prix')
    .addSubcommand(sub =>
      sub.setName('lancer')
        .setDescription('Lance une nouvelle partie'),
    )
    .addSubcommand(sub =>
      sub.setName('jouer')
        .setDescription('Propose un prix')
        .addIntegerOption(opt =>
          opt.setName('prix')
            .setDescription('Ton estimation (en €)')
            .setRequired(true)
            .setMinValue(1),
        ),
    ),
  async execute(interaction) {
    const { start, guess } = require('../../games/justePrix');
    const { addWin, addLoss } = require('../../data/scores');

    if (interaction.options.getSubcommand() === 'lancer') {
      const result = start(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle('🎯 Juste Prix')
        .setDescription(
          `Objet: **${result.nom}**\n\nEstime le prix entre **1€ et 1000€**\nTu as **${result.maxTentatives}** tentatives.\n\nUtilise \`/justeprix jouer <prix>\``
        )
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }

    const prix = interaction.options.getInteger('prix');
    const result = guess(interaction.user.id, prix);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    if (result.gagne) {
      addWin(interaction.user.id, 'justePrix');
      const embed = new EmbedBuilder()
        .setTitle('🎉 Gagné !')
        .setDescription(`Le juste prix était **${result.prix}€** !\nTrouvé en ${result.tentatives} tentative(s) !`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    if (result.perdu) {
      addLoss(interaction.user.id, 'justePrix');
      const embed = new EmbedBuilder()
        .setTitle('💸 Perdu !')
        .setDescription(`Le juste prix était **${result.prix}€**\nTu as épuisé toutes tes tentatives.`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [embed] });
    }

    const indication = result.indication === 'haut' ? '📈 C\'est plus !' : '📉 C\'est moins !';
    const embed = new EmbedBuilder()
      .setTitle('🎯 Juste Prix')
      .setDescription(`${indication}\n\nTentative ${result.tentatives}/${result.maxTentatives}`)
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
