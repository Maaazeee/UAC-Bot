const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const votes = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage avancé')
    .addStringOption(o => o.setName('question').setDescription('La question').setRequired(true))
    .addStringOption(o => o.setName('choix1').setDescription('Choix 1').setRequired(true))
    .addStringOption(o => o.setName('choix2').setDescription('Choix 2').setRequired(true))
    .addStringOption(o => o.setName('choix3').setDescription('Choix 3'))
    .addStringOption(o => o.setName('choix4').setDescription('Choix 4'))
    .addStringOption(o => o.setName('choix5').setDescription('Choix 5'))
    .addStringOption(o => o.setName('choix6').setDescription('Choix 6'))
    .addBooleanOption(o => o.setName('anonyme').setDescription('Cacher qui a voté'))
    .addStringOption(o => o.setName('duree').setDescription('Durée (ex: 10m, 1h, 24h)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const anonyme = interaction.options.getBoolean('anonyme') || false;
    const duree = interaction.options.getString('duree');
    const choix = [];
    for (let i = 1; i <= 6; i++) {
      const c = interaction.options.getString(`choix${i}`);
      if (c) choix.push(c);
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    const desc = choix.map((c, i) => `${emojis[i]} ${c}`).join('\n');
    const footerText = anonyme ? 'Vote anonyme · ' : '';
    const embed = new EmbedBuilder()
      .setTitle('📊 ' + question)
      .setDescription(desc)
      .setColor(0x00AE86)
      .setFooter({ text: `${footerText}Clique sur un bouton pour voter` });

    const row = new ActionRowBuilder().addComponents(
      choix.map((_, i) => new ButtonBuilder().setCustomId(`sondage_${i}`).setLabel(emojis[i]).setStyle(ButtonStyle.Primary)),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    votes.set(msg.id, { question, choix, anonyme, votants: new Map(), endTime: null });

    if (duree) {
      const match = duree.match(/^(\d+)(m|h)$/);
      if (match) {
        const ms = parseInt(match[1]) * (match[2] === 'h' ? 3600000 : 60000);
        const endTime = new Date(Date.now() + ms);
        votes.get(msg.id).endTime = endTime;
        setTimeout(async () => {
          const s = votes.get(msg.id);
          if (!s) return;
          const total = s.votants.size;
          const counts = s.choix.map((_, i) => [...s.votants.values()].filter(v => v === i).length);
          const lines = s.choix.map((c, i) => `**${c}**: ${counts[i]} voix`).join('\n');
          const embed = new EmbedBuilder()
            .setTitle('📊 ' + s.question + ' (Terminé)')
            .setDescription(lines)
            .setColor(0xE74C3C)
            .setFooter({ text: `Total: ${total} vote(s)` });
          try {
            await msg.edit({ embeds: [embed], components: [] });
          } catch {}
          votes.delete(msg.id);
        }, ms);
      }
    }
  },
  async handleVote(interaction, choixIndex) {
    const sondage = votes.get(interaction.message.id);
    if (!sondage) return interaction.reply({ content: '❌ Sondage expiré.', ephemeral: true });
    if (sondage.endTime && Date.now() > sondage.endTime.getTime()) {
      votes.delete(interaction.message.id);
      return interaction.reply({ content: '❌ Sondage terminé.', ephemeral: true });
    }

    sondage.votants.set(interaction.user.id, choixIndex);
    const total = sondage.votants.size;
    const counts = sondage.choix.map((_, i) => [...sondage.votants.values()].filter(v => v === i).length);
    const barres = counts.map(c => {
      const pct = total > 0 ? Math.round((c / total) * 10) : 0;
      return '█'.repeat(pct) + '░'.repeat(10 - pct) + ` ${c} voix`;
    });
    const desc = sondage.choix.map((c, i) => `**${c}**\n${barres[i]}`).join('\n\n');

    const footerText = sondage.anonyme ? '' : `${total} vote(s)`;
    const embed = new EmbedBuilder()
      .setTitle('📊 ' + sondage.question)
      .setDescription(desc)
      .setColor(0x00AE86)
      .setFooter({ text: footerText || undefined });

    if (sondage.anonyme) {
      await interaction.update({ embeds: [embed] });
    } else {
      await interaction.update({ embeds: [embed] });
    }
  },
};
