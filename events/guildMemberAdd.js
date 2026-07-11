const { Events } = require('discord.js');
const { get, set } = require('../data/config');
const { raidMap } = require('../data/state');

module.exports = {
  name: Events.GuildMemberAdd,
  execute(member) {
    if (member.user?.bot) return;
    const guildId = member.guild.id;

    const now = Date.now();
    if (!raidMap.has(guildId)) raidMap.set(guildId, []);
    const joins = raidMap.get(guildId);
    joins.push(now);
    const recent = joins.filter(t => now - t < 10000);
    raidMap.set(guildId, recent);

    if (recent.length >= 100 && get(guildId, 'antiRaid')) {
      const logChannelId = get(guildId, 'logChannel');
      const locked = [];
      for (const [, channel] of member.guild.channels.cache) {
        if (channel.type === 0) {
          try {
            channel.permissionOverwrites.create(member.guild.roles.everyone, { SendMessages: false });
            locked.push(channel.id);
          } catch {}
        }
      }
      set(guildId, 'raidLocked', locked);
      if (logChannelId) {
        const log = member.guild.channels.cache.get(logChannelId);
        if (log) log.send(`🚨 **Raid détecté !** ${locked.length} salons vérouillés. Fais \`/antiraid unlock\` pour tout dévérouiller.`).catch(() => {});
      }
      return;
    }

    const autoRoleId = get(guildId, 'autoRole');
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) member.roles.add(role).catch(() => {});
    }

    const channelId = get(guildId, 'welcomeChannel');
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const useImage = get(guildId, 'welcomeImage');
    const msg = get(guildId, 'welcomeMessage') || 'Bienvenue {user} sur **{server}** ! 🎉';

    if (useImage) {
      (async () => {
        try {
          const { createCanvas, loadImage } = require('canvas');
          const canvas = createCanvas(800, 300);
          const ctx = canvas.getContext('2d');

          ctx.fillStyle = '#2C2F33';
          ctx.fillRect(0, 0, 800, 300);

          ctx.fillStyle = '#5865F2';
          ctx.fillRect(0, 0, 800, 5);

          ctx.font = 'bold 40px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText('Bienvenue !', 400, 80);

          ctx.font = '24px sans-serif';
          ctx.fillStyle = '#B9BBBE';
          ctx.fillText(member.user.tag, 400, 120);

          ctx.font = '18px sans-serif';
          ctx.fillStyle = '#72767D';
          ctx.fillText(`Membre n°${member.guild.memberCount}`, 400, 165);

          try {
            const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(400, 230, 45, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 355, 185, 90, 90);
            ctx.restore();
          } catch {}

          const { AttachmentBuilder } = require('discord.js');
          const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
          const formatted = msg.replace(/{user}/g, `${member}`).replace(/{server}/g, member.guild.name);
          await channel.send({ content: formatted, files: [attachment] });
        } catch {
          const formatted = msg.replace(/{user}/g, `${member}`).replace(/{server}/g, member.guild.name);
          await channel.send(formatted).catch(() => {});
        }
      })();
    } else {
      const formatted = msg.replace(/{user}/g, `${member}`).replace(/{server}/g, member.guild.name);
      channel.send(formatted).catch(() => {});
    }
  },
};
