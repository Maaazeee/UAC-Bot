const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('des')
    .setDescription('Lance un dé et mise sur le résultat')
    .addStringOption(opt =>
      opt.setName('pari')
        .setDescription('Sur quoi tu mises ?')
        .setRequired(true)
        .addChoices(
          { name: 'Pair', value: 'pair' },
          { name: 'Impair', value: 'impair' },
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
          { name: '4', value: '4' },
          { name: '5', value: '5' },
          { name: '6', value: '6' },
        ),
    ),
  async execute(interaction) {
    const { play, emojis } = require('../../games/des');
    const { addWin, addLoss } = require('../../data/scores');

    const pariRaw = interaction.options.getString('pari');
    const estNombre = ['1', '2', '3', '4', '5', '6'].includes(pariRaw);
    const pari = estNombre ? 'nombre' : pariRaw;
    const valeur = estNombre ? parseInt(pariRaw) : null;
    const miseLabel = estNombre ? `le **${pariRaw}**` : `**${pariRaw}**`;

    const result = play(pari, valeur);

    if (result.gagne) addWin(interaction.user.id, 'des');
    else addLoss(interaction.user.id, 'des');

    const embed = new EmbedBuilder()
      .setTitle('🎲 Jeu de dés')
      .setDescription(
        `Tu as misé sur ${miseLabel}\n\nRésultat: ${emojis[result.resultat]} **${result.resultat}**\n\n${result.gagne ? '✅ **Gagné !**' : '❌ **Perdu !**'}`
      )
      .setColor(result.gagne ? 0x00FF00 : 0xFF0000);

    await interaction.reply({ embeds: [embed] });
  },
};
