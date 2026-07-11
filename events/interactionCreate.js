const { Events, Collection, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const cooldowns = new Collection();
const cooldownTime = 3;

const permissionsRequired = {
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
  unban: PermissionFlagsBits.BanMembers,
  timeout: PermissionFlagsBits.ModerateMembers,
  softban: PermissionFlagsBits.BanMembers,
  tempban: PermissionFlagsBits.BanMembers,
  clear: PermissionFlagsBits.ManageMessages,
  purge: PermissionFlagsBits.ManageMessages,
  slowmode: PermissionFlagsBits.ManageChannels,
  lock: PermissionFlagsBits.ManageChannels,
  unlock: PermissionFlagsBits.ManageChannels,
  warn: PermissionFlagsBits.ModerateMembers,
  delwarn: PermissionFlagsBits.ModerateMembers,
  voicemute: PermissionFlagsBits.MuteMembers,
  voicedeafen: PermissionFlagsBits.DeafenMembers,
  voicemove: PermissionFlagsBits.MoveMembers,
  moveall: PermissionFlagsBits.MoveMembers,
  vckick: PermissionFlagsBits.MoveMembers,
  nick: PermissionFlagsBits.ManageNicknames,
  role: PermissionFlagsBits.ManageRoles,
  levelset: PermissionFlagsBits.Administrator,
  setlogs: PermissionFlagsBits.Administrator,
  setwelcome: PermissionFlagsBits.Administrator,
  setgoodbye: PermissionFlagsBits.Administrator,
  autorole: PermissionFlagsBits.Administrator,
  automod: PermissionFlagsBits.Administrator,
  antiinvite: PermissionFlagsBits.Administrator,
  antiraid: PermissionFlagsBits.Administrator,
  strike: PermissionFlagsBits.Administrator,
  reactrole: PermissionFlagsBits.Administrator,
  levelrole: PermissionFlagsBits.Administrator,
  levelchannel: PermissionFlagsBits.Administrator,
  levelannounce: PermissionFlagsBits.Administrator,
  xpmultiplier: PermissionFlagsBits.Administrator,
  voicexp: PermissionFlagsBits.Administrator,
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (!cooldowns.has(interaction.commandName)) {
        cooldowns.set(interaction.commandName, new Collection());
      }
      const now = Date.now();
      const timestamps = cooldowns.get(interaction.commandName);
      const cooldownAmount = (command.cooldown || cooldownTime) * 1000;
      if (timestamps.has(interaction.user.id)) {
        const expiration = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expiration) {
          const left = ((expiration - now) / 1000).toFixed(1);
          return interaction.reply({ content: `⏳ Attends ${left}s avant de réutiliser \`/${interaction.commandName}\`.`, ephemeral: true });
        }
      }
      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      const perm = permissionsRequired[interaction.commandName];
      if (perm && !interaction.memberPermissions?.has(perm)) {
        return interaction.reply({ content: '❌ Tu n\'as pas la permission nécessaire.', ephemeral: true });
      }

      const { get } = require('../data/config');
      const restrictedRoles = get(interaction.guildId, `perm:${interaction.commandName}`);
      if (restrictedRoles) {
        try {
          const allowedRoles = JSON.parse(restrictedRoles);
          const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
          if (!hasRole) {
            return interaction.reply({ content: `❌ Seuls les membres avec le(s) rôle(s) approprié(s) peuvent utiliser \`/${interaction.commandName}\`.`, ephemeral: true });
          }
        } catch {}
      }

      try {
        command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true }).catch(() => {});
      }
      return;
    }

    if (interaction.isAutocomplete()) {
      if (interaction.commandName === 'permissions') {
        const focused = interaction.options.getFocused().toLowerCase();
        const cmdList = [...client.commands.keys()].filter(c => c.includes(focused)).slice(0, 25);
        return interaction.respond(cmdList.map(c => ({ name: `/${c}`, value: c })));
      }
    }

    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith('sondage_')) {
        const [_, choix] = id.split('_');
        const { handleVote } = require('../commands/config/sondage');
        return handleVote(interaction, parseInt(choix));
      }

      if (id === 'ticket_open') {
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (existing) return interaction.reply({ content: '❌ Tu as déjà un ticket ouvert.', ephemeral: true });
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: interaction.channel.parent,
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: interaction.guild.members.me, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
          ],
        });
        const { createTicket } = require('../data/tickets');
        createTicket(interaction.guildId, channel.id, interaction.user.id);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Fermer').setStyle(ButtonStyle.Danger)
        );
        await channel.send({ content: `${interaction.user}`, embeds: [new EmbedBuilder().setTitle('🎫 Ticket').setDescription('Décris ton problème.').setColor(0x3498DB)], components: [row] });
        return interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
      }

      if (id === 'verify_me') {
        const { get } = require('../data/config');
        const roleId = get(interaction.guildId, 'verifyRole');
        if (!roleId) return interaction.reply({ content: '❌ Vérification non configurée.', ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(roleId)) return interaction.reply({ content: '✅ Tu es déjà vérifié.', ephemeral: true });
        await member.roles.add(roleId);
        const welcomeMsg = get(interaction.guildId, 'verifyWelcome') || 'Bienvenue {user} sur **{server}** ! 🎉';
        const formatted = welcomeMsg.replace(/{user}/g, `${member}`).replace(/{server}/g, interaction.guild.name);
        const chId = get(interaction.guildId, 'verifyWelcomeChannel');
        if (chId) {
          const ch = interaction.guild.channels.cache.get(chId);
          if (ch) ch.send(formatted).catch(() => {});
        }
        return interaction.reply({ content: '✅ Tu es maintenant vérifié !', ephemeral: true });
      }

      if (id === 'ticket_close') {
        const ticket = require('../data/tickets').getTicket(interaction.channelId);
        if (!ticket) return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
        require('../data/tickets').closeTicket(interaction.channelId);
        await interaction.reply({ content: '🔒 Ticket fermé. Suppression dans 5s...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      }

      if (id.startsWith('claim_')) {
        const gId = id.slice(6);
        await interaction.reply({ content: `✅ Réclamation enregistrée pour **${gId}**. Le créateur du giveaway va être notifié.`, ephemeral: true });
      }

      if (id === 'clan_accept') {
        const { acceptInvite } = require('../data/clans');
        const result = await acceptInvite(interaction.guildId, interaction.user.id);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        const clan = require('../data/clans').getUserClan(interaction.guildId, interaction.user.id);
        if (clan?.channelId) {
          const ch = interaction.guild.channels.cache.get(clan.channelId);
          if (ch) { try { await ch.permissionOverwrites.create(interaction.user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }); } catch {} }
        }
        return interaction.reply({ content: `✅ Tu as rejoint **${result.clanName}** !` });
      }

      if (id === 'clan_decline') {
        const { declineInvite } = require('../data/clans');
        const result = declineInvite(interaction.guildId, interaction.user.id);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        return interaction.reply({ content: '✅ Invitation refusée.' });
      }

      if (id.startsWith('war_accept_')) {
        const warId = id.slice('war_accept_'.length);
        const { warAccept, getWar, addClanLog } = require('../data/clans');
        const war = getWar(warId);
        if (!war) return interaction.reply({ content: '❌ Guerre introuvable.', ephemeral: true });
        const member = require('../data/clans').getMember(interaction.guildId, interaction.user.id);
        if (!member || member.clanId !== war.defenderClanId) return interaction.reply({ content: '❌ Tu n\'es pas dans le clan défenseur.', ephemeral: true });
        const result = await warAccept(interaction.guildId, warId);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        addClanLog(interaction.guildId, war.defenderClanId, interaction.user.id, 'war_accept', 'Guerre acceptée');
        return interaction.reply({ content: '✅ Guerre acceptée ! Les scores sont calculés.' });
      }

      if (id.startsWith('war_decline_')) {
        const warId = id.slice('war_decline_'.length);
        const { warDecline, getWar } = require('../data/clans');
        const war = getWar(warId);
        if (!war) return interaction.reply({ content: '❌ Guerre introuvable.', ephemeral: true });
        const member = require('../data/clans').getMember(interaction.guildId, interaction.user.id);
        if (!member || member.clanId !== war.defenderClanId) return interaction.reply({ content: '❌ Tu n\'es pas dans le clan défenseur.', ephemeral: true });
        await warDecline(interaction.guildId, warId);
        return interaction.reply({ content: '🛡️ Guerre refusée.' });
      }

      if (id.startsWith('clan_delete_')) {
        const clanId = id.slice('clan_delete_'.length);
        const { getFullClan, deleteClan } = require('../data/clans');
        const clan = getFullClan(interaction.guildId, clanId);
        if (!clan) return interaction.reply({ content: '❌ Clan introuvable.', ephemeral: true });
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Seul le staff peut supprimer un clan.', ephemeral: true });
        }
        if (clan.channelId) interaction.guild.channels.delete(clan.channelId).catch(() => {});
        const colorRole = interaction.guild.roles.cache.find(r => r.name === `🏰 ${clan.name}`);
        if (colorRole) colorRole.delete().catch(() => {});
        deleteClan(interaction.guildId, clanId);
        return interaction.reply({ content: `✅ Clan **${clan.name}** supprimé.` });
      }
    }
  },
};
