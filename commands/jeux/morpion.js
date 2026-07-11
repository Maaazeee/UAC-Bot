const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('morpion')
    .setDescription('Joue au Morpion (Tic-Tac-Toe)')
    .addSubcommand(sub =>
      sub.setName('defier')
        .setDescription('Défie un membre au morpion')
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
        .setDescription('Joue une case')
        .addIntegerOption(opt =>
          opt.setName('position')
            .setDescription('Position (1-9, de gauche à droite, haut en bas)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(9),
        ),
    ),
  async execute(interaction, client) {
    const { start, play, drawBoard } = require('../../games/morpion');
    const { getBalance } = require('../../data/economy');

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

      const partie = start(interaction.channelId, interaction.user.id, adversaire.id, mise);
      const board = drawBoard(partie.etat);

      const descMise = mise > 0 ? `\n💰 Mise : **${mise}** coins` : '';
      const embed = new EmbedBuilder()
        .setTitle('⭕❌ Morpion')
        .setDescription(`**${interaction.user.username}** ❌ vs ⭕ **${adversaire.username}**\n\nTour de **${interaction.user.username}** ❌\n\n${board}${descMise}`)
        .setColor(0x00AE86);

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const position = interaction.options.getInteger('position') - 1;
    const result = play(interaction.channelId, interaction.user.id, position);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    if (result.fin) {
      const partie = require('../../games/morpion').parties;
      const p = partie.get(interaction.channelId);
      const joueur1 = await interaction.guild.members.fetch(p.joueur1);
      const joueur2 = await interaction.guild.members.fetch(p.joueur2);
      partie.delete(interaction.channelId);

      const { addWin, addLoss, addTie } = require('../../data/scores');
      const { addBalance } = require('../../data/economy');
      if (result.egalite) {
        addTie(p.joueur1, 'morpion');
        addTie(p.joueur2, 'morpion');
        if (p.bet > 0) {
          addBalance(interaction.guildId, p.joueur1, p.bet);
          addBalance(interaction.guildId, p.joueur2, p.bet);
        }
      } else {
        addWin(result.vainqueur, 'morpion');
        addLoss(result.vainqueur === p.joueur1 ? p.joueur2 : p.joueur1, 'morpion');
        if (p.bet > 0) {
          const gagnantId = result.vainqueur;
          addBalance(interaction.guildId, gagnantId, p.bet * 2);
        }
      }

      const board = drawBoard(result.etat);
      const descMise = p.bet > 0 ? `\n💰 Mise : **${p.bet}** coins` : '';
      let description;
      if (result.egalite) {
        description = `**Égalité !** Personne ne gagne.\n\n${board}${descMise}`;
      } else {
        const gagnant = result.vainqueur === p.joueur1 ? joueur1 : joueur2;
        description = `🎉 **${gagnant.displayName}** a gagné !\n\n${board}${descMise}`;
      }

      const embed = new EmbedBuilder()
        .setTitle('⭕❌ Morpion - Terminé')
        .setDescription(description)
        .setColor(result.egalite ? 0xFFFF00 : 0x00FF00);

      return interaction.reply({ embeds: [embed] });
    }

    const partie = require('../../games/morpion').parties;
    const p = partie.get(interaction.channelId);
    const joueur1 = await interaction.guild.members.fetch(p.joueur1);
    const joueur2 = await interaction.guild.members.fetch(p.joueur2);
    const current = result.tour === p.joueur1 ? joueur1 : joueur2;
    const board = drawBoard(result.etat);

    const embed = new EmbedBuilder()
      .setTitle('⭕❌ Morpion')
      .setDescription(`**${joueur1.displayName}** ❌ vs ⭕ **${joueur2.displayName}**\n\nTour de **${current.displayName}** ${result.tour === p.joueur1 ? '❌' : '⭕'}\n\n${board}`)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
