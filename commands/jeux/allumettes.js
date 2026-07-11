const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allumettes')
    .setDescription('Jeu de Nim - retire des allumettes')
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
        .setDescription('Retire des allumettes (1-3)')
        .addIntegerOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre d\'allumettes à retirer')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(3),
        ),
    ),
  async execute(interaction) {
    const { start, play, drawAllumettes } = require('../../games/allumettes');
    const { addWin, addLoss } = require('../../data/scores');
    const { getBalance, addBalance } = require('../../data/economy');

    if (interaction.options.getSubcommand() === 'defier') {
      const adversaire = interaction.options.getUser('adversaire');
      if (adversaire.id === interaction.user.id) {
        return interaction.reply({ content: '❌ Tu ne peux pas te défier toi-même.', ephemeral: true });
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

      const result = start(interaction.channelId, interaction.user.id, adversaire.id, mise);
      const descMise = mise > 0 ? `\n💰 Mise : **${mise}** coins` : '';
      const embed = new EmbedBuilder()
        .setTitle('🪄 Allumettes (Nim)')
        .setDescription(
          `**${interaction.user.username}** vs **${adversaire.username}**\n\n${drawAllumettes(result.total)}\n\nTour de **${interaction.user.username}**\nUtilise \`/allumettes jouer <1-3>\`${descMise}`
        )
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [embed] });
    }

    const nb = interaction.options.getInteger('nombre');
    const result = play(interaction.channelId, interaction.user.id, nb);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    if (result.fin) {
      const { parties } = require('../../games/allumettes');
      const p = parties.get(interaction.channelId);
      parties.delete(interaction.channelId);

      const perdant = result.perdant;
      const gagnantId = perdant === p.joueur1 ? p.joueur2 : p.joueur1;
      const gagnant = await interaction.guild.members.fetch(gagnantId);
      addWin(gagnantId, 'allumettes');
      addLoss(perdant, 'allumettes');
      if (p.bet > 0) addBalance(interaction.guildId, gagnantId, p.bet * 2);

      const descMise = p.bet > 0 ? `\n💰 Mise : **${p.bet}** coins` : '';
      const embed = new EmbedBuilder()
        .setTitle('🏁 Partie terminée !')
        .setDescription(`**${gagnant.displayName}** a gagné !\n\n${drawAllumettes(0)}${descMise}`)
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed] });
    }

    const { parties } = require('../../games/allumettes');
    const p = parties.get(interaction.channelId);
    const joueurSuivant = result.tour === p.joueur1
      ? (await interaction.guild.members.fetch(p.joueur1)).displayName
      : (await interaction.guild.members.fetch(p.joueur2)).displayName;

    const embed = new EmbedBuilder()
      .setTitle('🪄 Allumettes (Nim)')
      .setDescription(`${drawAllumettes(result.total)}\n\nTour de **${joueurSuivant}**`)
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  },
};
