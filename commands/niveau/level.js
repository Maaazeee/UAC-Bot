const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { join } = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Voir votre niveau ou celui d\'un membre')
    .addUserOption(opt =>
      opt.setName('membre').setDescription('Le membre à consulter'),
    ),
  async execute(interaction) {
    const target = interaction.options.getMember('membre') || interaction.member;
    const { getLevelData, xpForLevel, getLeaderboard } = require('../../data/levels');
    const { xp, level } = getLevelData(interaction.guildId, target.id);
    const nextLevelXp = xpForLevel(level + 1);
    const currentLevelXp = xpForLevel(level);
    const progress = nextLevelXp - currentLevelXp > 0 ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100 : 100;

    const top = getLeaderboard(interaction.guildId);
    const rank = top.findIndex(e => e.userId === target.id) + 1;

    try {
      const canvas = createCanvas(800, 250);
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 800, 250);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, 800, 250, 20);
      ctx.fill();

      const borderGrad = ctx.createLinearGradient(0, 0, 800, 0);
      borderGrad.addColorStop(0, '#5865F2');
      borderGrad.addColorStop(1, '#9b59b6');
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(2, 2, 796, 246, 20);
      ctx.stroke();

      try {
        const avatar = await loadImage(target.user.displayAvatarURL({ extension: 'png', size: 128 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 45, 45, 160, 160);
        ctx.restore();
      } catch {}

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(target.user.displayName, 240, 85);

      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Niveau ${level}`, 240, 125);

      ctx.fillStyle = '#5865F2';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`#${rank}`, 700, 85);

      const barX = 240, barY = 150, barW = 500, barH = 30;
      ctx.fillStyle = '#2a2a4a';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 15);
      ctx.fill();

      const fillW = Math.round((progress / 100) * barW);
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#5865F2');
      barGrad.addColorStop(1, '#9b59b6');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 15);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${xp} / ${nextLevelXp} XP (${progress.toFixed(1)}%)`, barX + barW / 2, barY + 22);
      ctx.textAlign = 'left';

      const buffer = canvas.toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${target.user.displayName} — Niveau ${level}`)
        .setDescription(`**XP:** ${xp} / ${nextLevelXp}  •  **Rang:** #${rank}`)
        .setColor(0x5865F2)
        .setImage('attachment://rank.png');

      await interaction.reply({ embeds: [embed], files: [attachment] }).catch(() => {
        throw new Error('canvas_fallback');
      });
    } catch {
      const barLen = 15;
      const filled = Math.round((progress / 100) * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${target.user.displayName} — Niveau ${level}`)
        .setDescription(`**XP:** ${xp} / ${nextLevelXp}\n**Rang:** #${rank}\n${bar} ${progress.toFixed(1)}%`)
        .setColor(0x5865F2)
        .setThumbnail(target.user.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    }
  },
};
