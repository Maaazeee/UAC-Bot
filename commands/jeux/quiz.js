const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Réponds à une question aléatoire'),
  async execute(interaction) {
    const { start, answer } = require('../../games/quiz');
    const question = start(interaction.user.id);

    const row = new ActionRowBuilder().addComponents(
      question.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`quiz_${i}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary),
      ),
    );

    const embed = new EmbedBuilder()
      .setTitle('❓ Quiz')
      .setDescription(question.question)
      .setColor(0x00AE86);

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = i => i.user.id === interaction.user.id;
    try {
      const btn = await msg.awaitMessageComponent({ filter, time: 30000 });
      const choix = parseInt(btn.customId.split('_')[1]);
      const result = answer(interaction.user.id, choix);

      if (result.error) {
        return btn.reply({ content: result.error, ephemeral: true });
      }

      const { addWin, addLoss } = require('../../data/scores');
      if (result.correct) addWin(interaction.user.id, 'quiz');
      else addLoss(interaction.user.id, 'quiz');

      const embedResult = new EmbedBuilder()
        .setTitle(result.correct ? '✅ Bonne réponse !' : '❌ Mauvaise réponse')
        .setDescription(`**${result.question}**\n\nRéponse correcte: **${result.reponseTexte}**`)
        .setColor(result.correct ? 0x00FF00 : 0xFF0000);

      await btn.update({ embeds: [embedResult], components: [] });
    } catch {
      const embedTimeout = new EmbedBuilder()
        .setTitle('⏰ Temps écoulé')
        .setDescription('Tu as mis trop de temps à répondre.')
        .setColor(0xFF0000);
      await interaction.editReply({ embeds: [embedTimeout], components: [] });
    }
  },
};
