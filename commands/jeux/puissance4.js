const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('puissance4')
    .setDescription('Joue au Puissance 4')
    .addSubcommand(sub =>
      sub.setName('defier')
        .setDescription('Défie un membre')
        .addUserOption(opt =>
          opt.setName('adversaire')
            .setDescription('Le membre à défier')
            .setRequired(true),
        )
        .addIntegerOption(opt =>
          opt.setName('mise')
            .setDescription('Mise en coins (optionnel)')
            .setMinValue(1),
        ),
    )
    .addSubcommand(sub =>
      sub.setName('jouer')
        .setDescription('Joue dans une colonne')
        .addIntegerOption(opt =>
          opt.setName('colonne')
            .setDescription('Numéro de colonne (1-7)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(7),
        ),
    ),
  async execute(interaction) {
    const { start, play, drawBoard } = require('../../games/puissance4');
    const { addWin, addLoss } = require('../../data/scores');
    const { getBalance, addBalance } = require('../../data/economy');

    if (interaction.options.getSubcommand() === 'defier') {
      const adversaire = interaction.options.getUser('adversaire');
      if (adversaire.id === interaction.user.id) {
        return interaction.reply({ content: '❌ Tu ne peux pas te défier toi-même.', ephemeral: true });
      }
      if (adversaire.bot) {
        return interaction.reply({ content: '❌ Tu ne peux pas défier un bot.', ephemeral: true });
      }

      const mise = interaction.options.getInteger('mise') || 0;
      if (mise > 0) {
        const bal1 = getBalance(interaction.guildId, interaction.user.id);
        const bal2 = getBalance(interaction.guildId, adversaire.id);
        if (bal1 < mise) return interaction.reply({ content: `❌ Tu n'as que ${bal1} coins, il te faut ${mise}.`, ephemeral: true });
        if (bal2 < mise) return interaction.reply({ content: `❌ ${adversaire.username} n'a que ${bal2} coins, mise impossible.`, ephemeral: true });
        addBalance(interaction.guildId, interaction.user.id, -mise);
        addBalance(interaction.guildId, adversaire.id, -mise);
      }

      start(interaction.channelId, interaction.user.id, adversaire.id, mise);
      const grille = Array.from({ length: 6 }, () => Array(7).fill(null));
      const descMise = mise > 0 ? `\n💰 Mise : **${mise}** coins` : '';
      const embed = new EmbedBuilder()
        .setTitle('🔴🟡 Puissance 4')
        .setDescription(
          `**${interaction.user.username}** 🔴 vs 🟡 **${adversaire.username}**\n\n${drawBoard(grille)}\n\nTour de **${interaction.user.username}** 🔴\nUtilise \`/puissance4 jouer <1-7>\`${descMise}`
        )
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }

    const colonne = interaction.options.getInteger('colonne') - 1;
    const result = play(interaction.channelId, interaction.user.id, colonne);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    if (result.fin) {
      const { parties } = require('../../games/puissance4');
      const p = parties.get(interaction.channelId);
      parties.delete(interaction.channelId);

      let gagnantNom;
      if (result.egalite) {
        gagnantNom = 'Personne — **Égalité !**';
        if (p.bet > 0) {
          addBalance(interaction.guildId, p.joueur1, p.bet);
          addBalance(interaction.guildId, p.joueur2, p.bet);
        }
      } else {
        const membre = await interaction.guild.members.fetch(result.gagnant);
        gagnantNom = `🎉 **${membre.displayName}** a gagné !`;
        addWin(result.gagnant, 'puissance4');
        addLoss(result.gagnant === p.joueur1 ? p.joueur2 : p.joueur1, 'puissance4');
        if (p.bet > 0) addBalance(interaction.guildId, result.gagnant, p.bet * 2);
      }

      const descMise = p.bet > 0 ? `\n💰 Mise : **${p.bet}** coins` : '';
      const board = result.grille || Array.from({ length: 6 }, () => Array(7).fill(null));
      const embed = new EmbedBuilder()
        .setTitle(result.egalite ? "🏁 Match nul" : '🏁 Puissance 4 - Terminé')
        .setDescription(`${drawBoard(board)}\n\n${gagnantNom}${descMise}`)
        .setColor(result.egalite ? 0xFFFF00 : 0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    const { parties } = require('../../games/puissance4');
    const p = parties.get(interaction.channelId);
    const current = result.tour === p.joueur1
      ? (await interaction.guild.members.fetch(p.joueur1)).displayName
      : (await interaction.guild.members.fetch(p.joueur2)).displayName;
    const emoji = result.tour === p.joueur1 ? '🔴' : '🟡';

    const embed = new EmbedBuilder()
      .setTitle('🔴🟡 Puissance 4')
      .setDescription(`${drawBoard(result.grille)}\n\nTour de **${current}** ${emoji}`)
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
