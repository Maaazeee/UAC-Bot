const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const {
  createClan, deleteClan, getFullClan, getUserClan, getClans, getMember,
  addMember, removeMember, setRole,
  setClanField, setClanChannel,
  addClanBalance, removeClanBalance, contributeCoins, addClanXp,
  transferOwnership,
  createInvite, acceptInvite, declineInvite, getInvites,
  warChallenge, warAccept, warDecline, getWar, getActiveWar, finishWar, warCalculateScore,
  getUpgrades, buyUpgrade, getUpgradeBonus,
  addClanLog, getClanLogs,
  syncChannelPerms, applyRoleColor,
} = require('../../data/clans');
const { getBalance, addBalance } = require('../../data/economy');
const { get, set } = require('../../data/config');
const db = require('../../data/database');

const CAN_MANAGE = ['owner', 'coleader'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clan')
    .setDescription('Système de clans')

    .addSubcommand(s => s.setName('create').setDescription('Créer un clan')
      .addStringOption(o => o.setName('nom').setDescription('Nom du clan').setRequired(true).setMaxLength(32)))

    .addSubcommand(s => s.setName('delete').setDescription('[Propriétaire] Supprimer ton clan'))

    .addSubcommand(s => s.setName('info').setDescription('Voir les infos d\'un clan')
      .addStringOption(o => o.setName('nom').setDescription('Nom du clan')))

    .addSubcommand(s => s.setName('list').setDescription('Liste des clans'))

    .addSubcommand(s => s.setName('set').setDescription('[Propriétaire] Personnaliser le clan')
      .addStringOption(o => o.setName('propriété').setDescription('Ce que tu veux changer').setRequired(true)
        .addChoices({ name: 'Description', value: 'description' }, { name: 'Couleur', value: 'color' }, { name: 'Emoji', value: 'emoji' }, { name: 'Bannière (URL)', value: 'banner' }))
      .addStringOption(o => o.setName('valeur').setDescription('Nouvelle valeur').setRequired(true).setMaxLength(500)))

    .addSubcommand(s => s.setName('chat').setDescription('Envoyer un message dans le salon privé du clan')
      .addStringOption(o => o.setName('message').setDescription('Ton message').setRequired(true).setMaxLength(1000)))

    .addSubcommand(s => s.setName('invite').setDescription('Gère les invitations')
      .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true)
        .addChoices({ name: 'Inviter', value: 'send' }, { name: 'Voir', value: 'list' }, { name: 'Accepter', value: 'accept' }, { name: 'Refuser', value: 'decline' }))
      .addUserOption(o => o.setName('membre').setDescription('Membre (pour Inviter)')))

    .addSubcommand(s => s.setName('join').setDescription('Rejoindre un clan (sans invitation)')
      .addStringOption(o => o.setName('nom').setDescription('Nom du clan').setRequired(true)))

    .addSubcommand(s => s.setName('leave').setDescription('Quitter ton clan'))

    .addSubcommand(s => s.setName('kick').setDescription('[Propriétaire/Co-leader] Expulser un membre')
      .addUserOption(o => o.setName('membre').setDescription('Le membre à expulser').setRequired(true)))

    .addSubcommand(s => s.setName('transfer').setDescription('[Propriétaire] Transférer la propriété')
      .addUserOption(o => o.setName('membre').setDescription('Nouveau propriétaire').setRequired(true)))

    .addSubcommand(s => s.setName('promote').setDescription('[Propriétaire] Promouvoir un membre')
      .addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true))
      .addStringOption(o => o.setName('grade').setDescription('Nouveau grade').setRequired(true)
        .addChoices({ name: 'Co-leader', value: 'coleader' }, { name: 'Membre', value: 'member' })))

    .addSubcommand(s => s.setName('deposit').setDescription('Déposer des coins dans la cagnotte')
      .addIntegerOption(o => o.setName('montant').setDescription('Montant').setRequired(true).setMinValue(1)))

    .addSubcommand(s => s.setName('withdraw').setDescription('[Propriétaire/Co-leader] Retirer des coins de la cagnotte')
      .addIntegerOption(o => o.setName('montant').setDescription('Montant').setRequired(true).setMinValue(1)))

    .addSubcommand(s => s.setName('bank').setDescription('Voir le solde de la cagnotte'))

    .addSubcommand(s => s.setName('upgrades').setDescription('Voir les améliorations du clan'))

    .addSubcommand(s => s.setName('upgrade').setDescription('[Propriétaire/Co-leader] Acheter une amélioration')
      .addStringOption(o => o.setName('id').setDescription('ID de l\'amélioration').setRequired(true)))

    .addSubcommand(s => s.setName('war').setDescription('[Propriétaire/Co-leader] Défier un clan')
      .addStringOption(o => o.setName('clan').setDescription('Nom du clan adverse').setRequired(true))
      .addIntegerOption(o => o.setName('mise').setDescription('Mise en coins (optionnel)').setMinValue(1)))

    .addSubcommand(s => s.setName('wars').setDescription('Voir l\'état de la guerre en cours'))

    .addSubcommand(s => s.setName('logs').setDescription('Voir les logs du clan'))
    .addSubcommand(s => s.setName('motd').setDescription('[Propriétaire] Définir le message du jour')
      .addStringOption(o => o.setName('message').setDescription('Le message (laisser vide pour effacer)').setMaxLength(1000))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const isAdmin = interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
    const getSelf = () => getUserClan(guildId, userId);
    const requireClan = (clan) => { if (!clan) throw '❌ Tu n\'es dans aucun clan.'; };
    const requireRole = (clan, roles) => {
      const m = clan.members.find(x => x.userId === userId);
      if (!m || !roles.includes(m.role)) throw '❌ Tu n\'as pas le grade requis.';
    };

    try {
      /* ───── CRÉER ───── */
      if (sub === 'create') {
        const name = interaction.options.getString('nom');
        const result = createClan(guildId, name, userId);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        const hasColorUpgrade = getUpgradeBonus(guildId, result.clanId, 'role_color') > 0;
        if (hasColorUpgrade) applyRoleColor(interaction.guild, result.clanId).catch(() => {});
        return interaction.reply({ content: `✅ Clan **${name}** créé ! Utilise \`/clan set\` pour le personnaliser.` });
      }

      /* ───── SUPPRIMER ───── */
      if (sub === 'delete') {
        const clan = getSelf(); requireClan(clan);
        if (!isAdmin) return interaction.reply({ content: '❌ Seul le staff peut supprimer un clan.', ephemeral: true });
        const confirmId = `clan_delete_${clan.clanId}`;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(confirmId).setLabel('🗑️ Confirmer la suppression').setStyle(ButtonStyle.Danger),
        );
        await interaction.reply({ content: `⚠️ Es-tu sûr de vouloir supprimer **${clan.name}** ? Cette action est irréversible.`, components: [row], ephemeral: true });
      }

      /* ───── INFOS ───── */
      if (sub === 'info') {
        let clan;
        const input = interaction.options.getString('nom');
        if (input) {
          const list = getClans(guildId);
          clan = list.find(c => c.name.toLowerCase() === input.toLowerCase());
          if (clan) clan = getFullClan(guildId, clan.clanId);
        } else {
          clan = getSelf();
        }
        if (!clan) return interaction.reply({ content: '❌ Clan introuvable.', ephemeral: true });

        const topContrib = [...clan.members].sort((a, b) => (b.xpContributed || 0) - (a.xpContributed || 0)).slice(0, 5);
        const memberLines = clan.members.map(m => {
          const badge = m.role === 'owner' ? '👑' : m.role === 'coleader' ? '⭐' : '•';
          return `${badge} <@${m.userId}> — ${m.xpContributed || 0}XP contribué`;
        }).join('\n');

        const upgrades = getUpgrades(guildId, clan.clanId);
        const upgradeLines = upgrades.filter(u => u.level > 0).map(u => `${u.name} **Nv.${u.level}**`).join(', ') || 'Aucune';

        const embed = new EmbedBuilder()
          .setTitle(`${clan.emoji || '🏰'} ${clan.name}`)
          .setDescription(clan.description || 'Aucune description')
          .setColor(parseInt(clan.color?.replace('#', ''), 16) || 0x3498DB)
          .addFields(
            { name: '👑 Propriétaire', value: `<@${clan.ownerId}>`, inline: true },
            { name: '📊 Niveau', value: `${clan.level}`, inline: true },
            { name: '💰 Cagnotte', value: `${clan.balance} 🪙`, inline: true },
            { name: '👥 Membres', value: `${clan.members.length}`, inline: true },
            { name: '⚡ XP', value: `${clan.xp}`, inline: true },
            { name: '🔧 Améliorations', value: upgradeLines || 'Aucune', inline: true },
            { name: `📋 Membres (top contributeurs)`, value: memberLines.slice(0, 1024) || 'Aucun' },
          )
          .setFooter({ text: `ID: ${clan.clanId}${clan.channelId ? ` | Salon: #${interaction.guild.channels.cache.get(clan.channelId)?.name || '?'}` : ''}` });
        if (clan.banner) embed.setImage(clan.banner);
        return interaction.reply({ embeds: [embed] });
      }

      /* ───── LISTE ───── */
      if (sub === 'list') {
        const clans = getClans(guildId);
        if (!clans.length) return interaction.reply({ content: '📭 Aucun clan sur ce serveur.', ephemeral: true });
        const embed = new EmbedBuilder().setTitle('🏰 Clans').setColor(0x3498DB);
        let desc = '';
        for (const c of clans) {
          desc += `**${c.emoji || '🏰'} ${c.name}** (Lv.${c.level}) — 🧑‍🤝‍🧑 ${c.memberCount} membres — ${c.balance} 🪙 — ${c.xp}XP\n`;
        }
        embed.setDescription(desc);
        return interaction.reply({ embeds: [embed] });
      }

      /* ───── SET ───── */
      if (sub === 'set') {
        const clan = getSelf(); requireClan(clan);
        if (clan.ownerId !== userId) return interaction.reply({ content: '❌ Seul le propriétaire peut modifier le clan.', ephemeral: true });
        const prop = interaction.options.getString('propriété');
        const val = interaction.options.getString('valeur');
        const result = setClanField(guildId, clan.clanId, prop, val);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        addClanLog(guildId, clan.clanId, userId, 'set', `${prop} changé`);
        return interaction.reply({ content: `✅ ${prop} mis à jour !`, ephemeral: true });
      }

      /* ───── CHAT ───── */
      if (sub === 'chat') {
        const clan = getSelf(); requireClan(clan);
        const message = interaction.options.getString('message');
        let channel;
        if (clan.channelId) channel = interaction.guild.channels.cache.get(clan.channelId);
        if (!channel) {
          channel = await interaction.guild.channels.create({
            name: `🏰-${clan.name.toLowerCase().replace(/\s+/g, '-')}`,
            type: ChannelType.GuildText,
            topic: `Salon privé du clan ${clan.name}`,
            permissionOverwrites: [
              { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
              { id: interaction.guild.members.me, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            ],
          });
          setClanChannel(guildId, clan.clanId, channel.id);
          await syncChannelPerms(interaction.guild, clan.clanId);
          const motd = get(guildId, `clan_motd_${clan.clanId}`);
          if (motd) await channel.send({ content: `📢 **MOTD:** ${motd}` }).catch(() => {});
        }
        await channel.send({ content: `💬 **${interaction.user.tag}:** ${message}` });
        return interaction.reply({ content: `✅ Message envoyé dans ${channel}`, ephemeral: true });
      }

      /* ───── INVITE ───── */
      if (sub === 'invite') {
        const action = interaction.options.getString('action');
        if (action === 'send') {
          const clan = getSelf(); requireClan(clan);
          const member = clan.members.find(m => m.userId === userId);
          if (!member || !CAN_MANAGE.includes(member.role)) return interaction.reply({ content: '❌ Grade insuffisant.', ephemeral: true });
          const target = interaction.options.getUser('membre');
          if (!target) return interaction.reply({ content: '❌ Tu dois spécifier un membre.', ephemeral: true });
          const result = await createInvite(guildId, clan.clanId, userId, target.id);
          if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
          addClanLog(guildId, clan.clanId, userId, 'invite', `<@${target.id}> invité`);
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('clan_accept').setLabel('✅ Accepter').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('clan_decline').setLabel('❌ Refuser').setStyle(ButtonStyle.Danger),
          );
          await target.send({ content: `🎉 **${clan.name}** t'a invité à rejoindre leur clan !`, components: [row] }).catch(() => {});
          return interaction.reply({ content: `✅ Invitation envoyée à ${target}.`, ephemeral: true });
        }
        if (action === 'list') {
          const invite = getInvites(guildId, userId);
          if (!invite) return interaction.reply({ content: '📭 Aucune invitation en attente.', ephemeral: true });
          return interaction.reply({ content: `📩 Invitation de **${invite.clanName}**. Utilise \`/clan invite action:Accepter\`.`, ephemeral: true });
        }
        if (action === 'accept') {
          const result = await acceptInvite(guildId, userId);
          if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
          const clan = getSelf();
          if (clan) await syncChannelPerms(interaction.guild, clan.clanId);
          return interaction.reply({ content: `✅ Tu as rejoint **${result.clanName}** !` });
        }
        if (action === 'decline') {
          const result = declineInvite(guildId, userId);
          if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
          return interaction.reply({ content: '✅ Invitation refusée.' });
        }
      }

      /* ───── JOIN ───── */
      if (sub === 'join') {
        const input = interaction.options.getString('nom');
        const list = getClans(guildId);
        const clan = list.find(c => c.name.toLowerCase() === input.toLowerCase());
        if (!clan) return interaction.reply({ content: '❌ Clan introuvable.', ephemeral: true });
        const maxUpgrade = getUpgradeBonus(guildId, clan.clanId, 'max_members');
        const maxMembers = 10 + maxUpgrade * 2;
        if (clan.memberCount >= maxMembers) return interaction.reply({ content: `❌ Ce clan a atteint sa limite (${maxMembers} membres).`, ephemeral: true });
        const result = addMember(guildId, clan.clanId, userId);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        const fullClan = getFullClan(guildId, clan.clanId);
        if (fullClan) await syncChannelPerms(interaction.guild, fullClan.clanId);
        addClanLog(guildId, clan.clanId, userId, 'join', 'A rejoint volontairement');
        return interaction.reply({ content: `✅ Tu as rejoint **${clan.name}** !` });
      }

      /* ───── LEAVE ───── */
      if (sub === 'leave') {
        const clan = getSelf(); requireClan(clan);
        if (clan.ownerId === userId) return interaction.reply({ content: '❌ Le propriétaire ne peut pas quitter. Transfère d\'abord.', ephemeral: true });
        removeMember(guildId, userId);
        await syncChannelPerms(interaction.guild, clan.clanId);
        addClanLog(guildId, clan.clanId, userId, 'leave', 'A quitté le clan');
        return interaction.reply({ content: `✅ Tu as quitté **${clan.name}**.` });
      }

      /* ───── KICK ───── */
      if (sub === 'kick') {
        const clan = getSelf(); requireClan(clan);
        const member = clan.members.find(m => m.userId === userId);
        if (!member || !CAN_MANAGE.includes(member.role)) return interaction.reply({ content: '❌ Grade insuffisant.', ephemeral: true });
        const target = interaction.options.getUser('membre');
        if (target.id === userId) return interaction.reply({ content: '❌ Tu ne peux pas t\'auto-expulser.', ephemeral: true });
        const targetMember = clan.members.find(m => m.userId === target.id);
        if (!targetMember) return interaction.reply({ content: '❌ Ce membre n\'est pas dans ton clan.', ephemeral: true });
        if (targetMember.role === 'owner') return interaction.reply({ content: '❌ Tu ne peux pas expulser le propriétaire.', ephemeral: true });
        if (targetMember.role === 'coleader' && member.role !== 'owner') return interaction.reply({ content: '❌ Seul le propriétaire peut expulser un co-leader.', ephemeral: true });
        removeMember(guildId, target.id);
        await syncChannelPerms(interaction.guild, clan.clanId);
        addClanLog(guildId, clan.clanId, userId, 'kick', `<@${target.id}> expulsé`);
        return interaction.reply({ content: `✅ ${target} a été expulsé de **${clan.name}**.` });
      }

      /* ───── TRANSFER ───── */
      if (sub === 'transfer') {
        const clan = getSelf(); requireClan(clan);
        if (clan.ownerId !== userId) return interaction.reply({ content: '❌ Seul le propriétaire peut transférer.', ephemeral: true });
        const target = interaction.options.getUser('membre');
        const result = transferOwnership(guildId, clan.clanId, target.id);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        addClanLog(guildId, clan.clanId, userId, 'transfer', `Propriété → <@${target.id}>`);
        return interaction.reply({ content: `✅ Propriété transférée à ${target} !` });
      }

      /* ───── PROMOTE ───── */
      if (sub === 'promote') {
        const clan = getSelf(); requireClan(clan);
        if (clan.ownerId !== userId) return interaction.reply({ content: '❌ Seul le propriétaire peut promouvoir.', ephemeral: true });
        const target = interaction.options.getUser('membre');
        const grade = interaction.options.getString('grade');
        const targetMember = clan.members.find(m => m.userId === target.id);
        if (!targetMember) return interaction.reply({ content: '❌ Ce membre n\'est pas dans ton clan.', ephemeral: true });
        if (targetMember.role === 'owner') return interaction.reply({ content: '❌ Impossible de rétrograder le propriétaire.', ephemeral: true });
        setRole(guildId, target.id, grade);
        addClanLog(guildId, clan.clanId, userId, 'promote', `<@${target.id}> → ${grade}`);
        return interaction.reply({ content: `✅ ${target} est maintenant **${grade}**.` });
      }

      /* ───── DEPOSIT ───── */
      if (sub === 'deposit') {
        const clan = getSelf(); requireClan(clan);
        const amount = interaction.options.getInteger('montant');
        const bal = getBalance(guildId, userId);
        if (bal < amount) return interaction.reply({ content: `❌ Tu n'as que ${bal} 🪙.`, ephemeral: true });
        addBalance(guildId, userId, -amount);
        contributeCoins(guildId, clan.clanId, userId, amount);
        addClanLog(guildId, clan.clanId, userId, 'deposit', `${amount}🪙`);
        return interaction.reply({ content: `✅ **${amount}** 🪙 déposés dans **${clan.name}**.` });
      }

      /* ───── WITHDRAW ───── */
      if (sub === 'withdraw') {
        const clan = getSelf(); requireClan(clan);
        const member = clan.members.find(m => m.userId === userId);
        if (!member || !CAN_MANAGE.includes(member.role)) return interaction.reply({ content: '❌ Grade insuffisant.', ephemeral: true });
        const amount = interaction.options.getInteger('montant');
        if ((clan.balance || 0) < amount) return interaction.reply({ content: `❌ La cagnotte n'a que ${clan.balance || 0} 🪙.`, ephemeral: true });
        removeClanBalance(guildId, clan.clanId, amount);
        addBalance(guildId, userId, amount);
        addClanLog(guildId, clan.clanId, userId, 'withdraw', `${amount}🪙`);
        return interaction.reply({ content: `✅ **${amount}** 🪙 retirés de la cagnotte.` });
      }

      /* ───── BANK ───── */
      if (sub === 'bank') {
        const clan = getSelf(); requireClan(clan);
        const topDepositors = clan.members.filter(m => m.coinsContributed > 0).sort((a, b) => b.coinsContributed - a.coinsContributed).slice(0, 5);
        const lines = topDepositors.length ? topDepositors.map(m => `<@${m.userId}>: ${m.coinsContributed}🪙`).join('\n') : 'Aucun dépôt';
        const embed = new EmbedBuilder()
          .setTitle(`💰 Cagnotte — ${clan.name}`)
          .setDescription(`**Solde:** ${clan.balance} 🪙`)
          .addFields({ name: 'Top déposants', value: lines })
          .setColor(0xF1C40F);
        return interaction.reply({ embeds: [embed] });
      }

      /* ───── UPGRADES / UPGRADE ───── */
      if (sub === 'upgrades') {
        const clan = getSelf(); requireClan(clan);
        const upgrades = getUpgrades(guildId, clan.clanId);
        const embed = new EmbedBuilder()
          .setTitle(`🔧 Améliorations — ${clan.name}`)
          .setColor(0x9B59B6);
        for (const u of upgrades) {
          const status = u.canUpgrade ? `(${u.nextCost}🪙 → Nv.${u.level + 1})` : '✅ MAX';
          embed.addFields({ name: `${u.name} [Nv.${u.level}/${u.maxLevel}]`, value: `${u.desc}\n**ID:** \`${u.id}\` ${status}` });
        }
        return interaction.reply({ embeds: [embed] });
      }

      if (sub === 'upgrade') {
        const clan = getSelf(); requireClan(clan);
        const member = clan.members.find(m => m.userId === userId);
        if (!member || !CAN_MANAGE.includes(member.role)) return interaction.reply({ content: '❌ Grade insuffisant.', ephemeral: true });
        const id = interaction.options.getString('id');
        const result = buyUpgrade(guildId, clan.clanId, id);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        if (id === 'role_color') await applyRoleColor(interaction.guild, clan.clanId);
        return interaction.reply({ content: `✅ **${result.name}** niveau **${result.newLevel}** acheté pour **${result.cost}** 🪙 !` });
      }

      /* ───── WAR ───── */
      if (sub === 'war') {
        const clan = getSelf(); requireClan(clan);
        const member = clan.members.find(m => m.userId === userId);
        if (!member || !CAN_MANAGE.includes(member.role)) return interaction.reply({ content: '❌ Grade insuffisant.', ephemeral: true });
        const targetName = interaction.options.getString('clan');
        const list = getClans(guildId);
        const target = list.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (!target) return interaction.reply({ content: '❌ Clan adverse introuvable.', ephemeral: true });
        if (target.clanId === clan.clanId) return interaction.reply({ content: '❌ Tu ne peux pas te défier toi-même.', ephemeral: true });
        const bet = interaction.options.getInteger('mise') || 0;
        const result = await warChallenge(guildId, clan.clanId, target.clanId, bet);
        if (result.error) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        addClanLog(guildId, clan.clanId, userId, 'war_challenge', `Défi lancé à ${target.name} (mise:${bet})`);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`war_accept_${result.warId}`).setLabel('⚔️ Accepter').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`war_decline_${result.warId}`).setLabel('🛡️ Refuser').setStyle(ButtonStyle.Danger),
        );
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Guerre de clans !')
          .setDescription(`**${clan.name}** défie **${target.name}** !\n${bet > 0 ? `💰 Mise: **${bet}** 🪙 chacun` : '💰 Sans mise'}\n\`/clan acceptwar ${result.warId}\` pour accepter.`)
          .setColor(0xE74C3C);
        await interaction.reply({ content: `⚔️ Guerre proposée à **${target.name}** !`, ephemeral: true });
        const targetClan = getFullClan(guildId, target.clanId);
        if (targetClan?.channelId) {
          const ch = interaction.guild.channels.cache.get(targetClan.channelId);
          if (ch) ch.send({ embeds: [embed], components: [row] }).catch(() => {});
        }
      }

      /* ───── WARS ───── */
      if (sub === 'wars') {
        const clan = getSelf(); requireClan(clan);
        const war = getActiveWar(guildId, clan.clanId);
        if (!war) return interaction.reply({ content: '📭 Aucune guerre en cours.', ephemeral: true });
        const attacker = getClan(guildId, war.attackerClanId);
        const defender = getClan(guildId, war.defenderClanId);
        const now = Date.now();
        const end = new Date(war.endTime).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 60000));
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Guerre en cours')
          .setDescription(`**${attacker?.name || '?'}** vs **${defender?.name || '?'}**`)
          .addFields(
            { name: `${attacker?.name || '?'}`, value: `${war.attackerScore} pts`, inline: true },
            { name: `${defender?.name || '?'}`, value: `${war.defenderScore} pts`, inline: true },
            { name: '⏱️ Temps restant', value: `${remaining} min` },
            { name: '💰 Mise', value: `${war.bet || 0} 🪙` },
          )
          .setColor(0xE74C3C);
        return interaction.reply({ embeds: [embed] });
      }

      /* ───── LOGS ───── */
      if (sub === 'logs') {
        const clan = getSelf(); requireClan(clan);
        const logs = getClanLogs(guildId, clan.clanId, 15);
        if (!logs.length) return interaction.reply({ content: '📭 Aucun log.', ephemeral: true });
        const lines = logs.map(l => `[\`${l.time}\`] ${l.action} — ${l.details}`);
        const embed = new EmbedBuilder()
          .setTitle(`📜 Logs — ${clan.name}`)
          .setDescription(lines.join('\n').slice(0, 4000))
          .setColor(0x95A5A6);
        return interaction.reply({ embeds: [embed] });
      }

      /* ───── MOTD ───── */
      if (sub === 'motd') {
        const clan = getSelf(); requireClan(clan);
        if (clan.ownerId !== userId) return interaction.reply({ content: '❌ Seul le propriétaire peut définir le MOTD.', ephemeral: true });
        const message = interaction.options.getString('message');
        if (!message) {
          set(guildId, `clan_motd_${clan.clanId}`, '');
          return interaction.reply({ content: '✅ MOTD effacé.', ephemeral: true });
        }
        set(guildId, `clan_motd_${clan.clanId}`, message);
        addClanLog(guildId, clan.clanId, userId, 'motd', 'MOTD mis à jour');
        if (clan.channelId) {
          const ch = interaction.guild.channels.cache.get(clan.channelId);
          if (ch) ch.send({ content: `📢 **Nouveau MOTD:** ${message}` }).catch(() => {});
        }
        return interaction.reply({ content: `✅ MOTD défini !`, ephemeral: true });
      }
    } catch (e) {
      if (typeof e === 'string') return interaction.reply({ content: e, ephemeral: true });
      throw e;
    }
  },
};
