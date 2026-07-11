const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pfc')
    .setDescription('Joue à Pierre-Feuille-Ciseaux contre le bot')
    .addStringOption(option =>
      option.setName('choix')
        .setDescription('Ton choix')
        .setRequired(true)
        .addChoices(
          { name: '🪨 Pierre', value: 'pierre' },
          { name: '📄 Feuille', value: 'feuille' },
          { name: '✂️ Ciseaux', value: 'ciseaux' },
        ),
    ),
  async execute(interaction) {
    const choix = interaction.options.getString('choix');
    const { play } = require('../../games/pfc');
    const { addWin, addLoss, addTie } = require('../../data/scores');
    const result = play(choix);

    if (result.result === 'joueur') addWin(interaction.user.id, 'pfc');
    else if (result.result === 'bot') addLoss(interaction.user.id, 'pfc');
    else addTie(interaction.user.id, 'pfc');

    const emojis = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' };
    const messages = {
      joueur: `✅ **Gagné !** ${emojis[choix]} bat ${emojis[result.botChoice]}`,
      bot: `❌ **Perdu !** ${emojis[result.botChoice]} bat ${emojis[choix]}`,
      egalite: `🤝 **Égalité !** ${emojis[choix]} contre ${emojis[result.botChoice]}`,
    };

    const embed = new EmbedBuilder()
      .setTitle('🪨📄✂️ Pierre-Feuille-Ciseaux')
      .setDescription(messages[result.result])
      .setColor(result.result === 'joueur' ? 0x00FF00 : result.result === 'bot' ? 0xFF0000 : 0xFFFF00);

    await interaction.reply({ embeds: [embed] });
  },
};
