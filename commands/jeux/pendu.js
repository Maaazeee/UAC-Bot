const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pendu')
    .setDescription('Joue au pendu')
    .addSubcommand(sub =>
      sub.setName('lancer')
        .setDescription('Lance une nouvelle partie'),
    )
    .addSubcommand(sub =>
      sub.setName('lettre')
        .setDescription('Propose une lettre')
        .addStringOption(opt =>
          opt.setName('lettre')
            .setDescription('Une lettre (a-z)')
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    const { start, guess, drawHangman } = require('../../games/pendu');
    const { addWin, addLoss } = require('../../data/scores');

    if (interaction.options.getSubcommand() === 'lancer') {
      const result = start(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle('🪢 Pendu')
        .setDescription(`${drawHangman(0)}\n\nMot: **${result.etat}** (${result.longueur} lettres)\n\nUtilise \`/pendu lettre <lettre>\` pour proposer.`)
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }

    const lettre = interaction.options.getString('lettre').toLowerCase();
    const result = guess(interaction.user.id, lettre);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    if (result.gagne) {
      addWin(interaction.user.id, 'pendu');
      const embed = new EmbedBuilder()
        .setTitle('🎉 Gagné !')
        .setDescription(`Tu as trouvé le mot **${result.mot}** !`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    if (result.perdu) {
      addLoss(interaction.user.id, 'pendu');
      const embed = new EmbedBuilder()
        .setTitle('💀 Perdu !')
        .setDescription(`${drawHangman(result.erreurs)}\n\nLe mot était **${result.mot}**`)
        .setColor(0xFF0000);
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('🪢 Pendu')
      .setDescription(`${drawHangman(result.erreurs)}\n\nMot: **${result.etat}**\nErreurs: ${result.erreurs}/6`)
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
