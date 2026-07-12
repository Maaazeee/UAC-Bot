const db = require('./database');

/* ─────────── CRUD ─────────── */

function createClan(guildId, name, ownerId) {
  const existing = db.prepare('SELECT clanId FROM clans WHERE guildId = ? AND name = ?').get(guildId, name);
  if (existing) return { error: 'Un clan avec ce nom existe déjà.' };
  const memberCheck = db.prepare('SELECT clanId FROM clan_members WHERE guildId = ? AND userId = ?').get(guildId, ownerId);
  if (memberCheck) return { error: 'Tu es déjà dans un clan.' };
  const clanId = Date.now().toString(36);
  const created = new Date().toISOString();
  db.prepare('INSERT INTO clans (guildId, clanId, name, ownerId, created) VALUES (?, ?, ?, ?, ?)').run(guildId, clanId, name, ownerId, created);
  db.prepare('INSERT INTO clan_members (guildId, clanId, userId, role, joined) VALUES (?, ?, ?, ?, ?)').run(guildId, clanId, ownerId, 'owner', created);
  return { clanId, name };
}

function deleteClan(guildId, clanId) {
  db.prepare('DELETE FROM clan_members WHERE guildId = ? AND clanId = ?').run(guildId, clanId);
  db.prepare('DELETE FROM clan_upgrades WHERE guildId = ? AND clanId = ?').run(guildId, clanId);
  db.prepare('DELETE FROM clan_logs WHERE guildId = ? AND clanId = ?').run(guildId, clanId);
  db.prepare('DELETE FROM clan_invites WHERE guildId = ? AND clanId = ?').run(guildId, clanId);
  db.prepare('DELETE FROM clans WHERE guildId = ? AND clanId = ?').run(guildId, clanId);
}

function getClan(guildId, clanId) {
  return db.prepare('SELECT * FROM clans WHERE guildId = ? AND clanId = ?').get(guildId, clanId);
}

function getUserClan(guildId, userId) {
  const membership = db.prepare('SELECT clanId FROM clan_members WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!membership) return null;
  return getFullClan(guildId, membership.clanId);
}

function getFullClan(guildId, clanId) {
  const clan = getClan(guildId, clanId);
  if (!clan) return null;
  const members = db.prepare('SELECT * FROM clan_members WHERE guildId = ? AND clanId = ? ORDER BY role, joined ASC').all(guildId, clanId);
  const upgrades = db.prepare('SELECT * FROM clan_upgrades WHERE guildId = ? AND clanId = ?').all(guildId, clanId);
  return { ...clan, members, upgrades };
}

function getClans(guildId) {
  return db.prepare(`SELECT c.*,
    (SELECT COUNT(*) FROM clan_members WHERE clanId = c.clanId AND guildId = c.guildId) as memberCount
    FROM clans c WHERE c.guildId = ? ORDER BY c.xp DESC`).all(guildId);
}

/* ─────────── MEMBRES ─────────── */

function addMember(guildId, clanId, userId) {
  const check = db.prepare('SELECT clanId FROM clan_members WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (check) return { error: 'Cet utilisateur est déjà dans un clan.' };
  db.prepare('INSERT INTO clan_members (guildId, clanId, userId, role, joined) VALUES (?, ?, ?, ?, ?)').run(guildId, clanId, userId, 'member', new Date().toISOString());
  return { success: true };
}

function removeMember(guildId, userId) {
  db.prepare('DELETE FROM clan_members WHERE guildId = ? AND userId = ?').run(guildId, userId);
  db.prepare('DELETE FROM clan_invites WHERE guildId = ? AND userId = ?').run(guildId, userId);
}

function getMember(guildId, userId) {
  return db.prepare('SELECT * FROM clan_members WHERE guildId = ? AND userId = ?').get(guildId, userId);
}

function setRole(guildId, userId, role) {
  db.prepare('UPDATE clan_members SET role = ? WHERE guildId = ? AND userId = ?').run(role, guildId, userId);
}

/* ─────────── PERSONNALISATION ─────────── */

function setClanField(guildId, clanId, field, value) {
  const allowed = ['name', 'description', 'color', 'emoji', 'banner'];
  if (!allowed.includes(field)) return { error: 'Champ invalide.' };
  if (field === 'color' && !/^#[0-9a-fA-F]{6}$/.test(value)) return { error: 'Couleur invalide. Format: #RRGGBB' };
  db.prepare(`UPDATE clans SET ${field} = ? WHERE guildId = ? AND clanId = ?`).run(value, guildId, clanId);
  return { success: true };
}

function setClanChannel(guildId, clanId, channelId) {
  db.prepare('UPDATE clans SET channelId = ? WHERE guildId = ? AND clanId = ?').run(channelId, guildId, clanId);
}

/* ─────────── ÉCONOMIE ─────────── */

function addClanBalance(guildId, clanId, amount) {
  db.prepare('UPDATE clans SET balance = balance + ? WHERE guildId = ? AND clanId = ?').run(amount, guildId, clanId);
}

function removeClanBalance(guildId, clanId, amount) {
  db.prepare('UPDATE clans SET balance = MAX(0, balance - ?) WHERE guildId = ? AND clanId = ?').run(amount, guildId, clanId);
}

function contributeCoins(guildId, clanId, userId, amount) {
  addClanBalance(guildId, clanId, amount);
  db.prepare('UPDATE clan_members SET coinsContributed = coinsContributed + ? WHERE guildId = ? AND userId = ?').run(amount, guildId, userId);
}

function contributeXp(guildId, userId, amount) {
  const member = getMember(guildId, userId);
  if (!member) return;
  db.prepare('UPDATE clan_members SET xpContributed = xpContributed + ? WHERE guildId = ? AND userId = ?').run(amount, guildId, userId);
  const clan = getClan(guildId, member.clanId);
  if (!clan) return;
  const leveled = addClanXp(guildId, member.clanId, Math.floor(amount / 10) + 1);
  if (leveled.leveledUp) addClanLog(guildId, member.clanId, null, 'levelup', `Niveau ${leveled.newLevel}`);
  return leveled;
}

/* ─────────── XP / NIVEAU ─────────── */

function addClanXp(guildId, clanId, amount) {
  db.prepare('UPDATE clans SET xp = xp + ? WHERE guildId = ? AND clanId = ?').run(amount, guildId, clanId);
  const clan = getClan(guildId, clanId);
  const newLevel = Math.floor(Math.sqrt(clan.xp / 100)) + 1;
  if (newLevel > clan.level) {
    db.prepare('UPDATE clans SET level = ? WHERE guildId = ? AND clanId = ?').run(newLevel, guildId, clanId);
    return { leveledUp: true, newLevel, name: clan.name };
  }
  return { leveledUp: false };
}

/* ─────────── TRANSFERT ─────────── */

function transferOwnership(guildId, clanId, newOwnerId) {
  const clan = getClan(guildId, clanId);
  if (!clan) return { error: 'Clan introuvable.' };
  const newMember = getMember(guildId, newOwnerId);
  if (!newMember || newMember.clanId !== clanId) return { error: 'Ce membre n\'est pas dans ton clan.' };
  setRole(guildId, clan.ownerId, 'coleader');
  setRole(guildId, newOwnerId, 'owner');
  db.prepare('UPDATE clans SET ownerId = ? WHERE guildId = ? AND clanId = ?').run(newOwnerId, guildId, clanId);
  return { success: true, oldOwner: clan.ownerId, newOwner: newOwnerId };
}

/* ─────────── INVITATIONS ─────────── */

function createInvite(guildId, clanId, inviterId, userId) {
  const check = db.prepare('SELECT clanId FROM clan_invites WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (check) return { error: 'Invitation déjà envoyée à cet utilisateur.' };
  const existing = db.prepare('SELECT clanId FROM clan_members WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (existing) return { error: 'Cet utilisateur est déjà dans un clan.' };
  db.prepare('INSERT OR REPLACE INTO clan_invites (guildId, clanId, userId, inviterId) VALUES (?, ?, ?, ?)').run(guildId, clanId, userId, inviterId);
  return { success: true };
}

function acceptInvite(guildId, userId) {
  const invite = db.prepare('SELECT * FROM clan_invites WHERE guildId = ? AND userId = ?').get(guildId, userId);
  if (!invite) return { error: 'Aucune invitation en attente.' };
  const result = addMember(guildId, invite.clanId, userId);
  if (result.error) return result;
  db.prepare('DELETE FROM clan_invites WHERE guildId = ? AND userId = ?').run(guildId, userId);
  const clan = getClan(guildId, invite.clanId);
  addClanLog(guildId, invite.clanId, userId, 'join', `Rejoint via invitation de <@${invite.inviterId}>`);
  return { success: true, clanName: clan?.name };
}

function declineInvite(guildId, userId) {
  const r = db.prepare('DELETE FROM clan_invites WHERE guildId = ? AND userId = ?').run(guildId, userId);
  if (!r.changes) return { error: 'Aucune invitation en attente.' };
  return { success: true };
}

function getInvites(guildId, userId) {
  return db.prepare('SELECT i.*, c.name as clanName FROM clan_invites i JOIN clans c ON i.clanId = c.clanId WHERE i.guildId = ? AND i.userId = ?').get(guildId, userId);
}

/* ─────────── GUERRE ─────────── */

function warCalculateScore(guildId, clanId) {
  const clan = getFullClan(guildId, clanId);
  if (!clan) return 0;
  const totalMemberXp = clan.members.reduce((s, m) => s + (m.xpContributed || 0), 0);
  const totalCoins = clan.balance;
  const base = Math.floor(totalMemberXp / 10) + Math.floor(totalCoins / 5) + clan.level * 50 + clan.members.length * 20;
  const warBonus = getUpgradeBonus(guildId, clanId, 'war_bonus');
  return Math.floor(base * (1 + warBonus * 0.1));
}

function warChallenge(guildId, attackerClanId, defenderClanId, bet = 0) {
  const existing = db.prepare("SELECT warId FROM clan_wars WHERE guildId = ? AND status = 'active' AND (attackerClanId = ? OR defenderClanId = ?)").get(guildId, attackerClanId, attackerClanId);
  if (existing) return { error: 'Ton clan est déjà en guerre.' };
  const existingDef = db.prepare("SELECT warId FROM clan_wars WHERE guildId = ? AND status = 'active' AND (attackerClanId = ? OR defenderClanId = ?)").get(guildId, defenderClanId, defenderClanId);
  if (existingDef) return { error: 'Le clan adverse est déjà en guerre.' };
  const warId = Date.now().toString(36);
  const endTime = new Date(Date.now() + 3600000).toISOString();
  const clanA = getClan(guildId, attackerClanId);
  const clanD = getClan(guildId, defenderClanId);
  if (bet > 0) {
    if ((clanA.balance || 0) < bet) return { error: `Ton clan n'a que ${clanA.balance || 0} 🪙.` };
    if ((clanD.balance || 0) < bet) return { error: `Le clan adverse n'a que ${clanD.balance || 0} 🪙.` };
    removeClanBalance(guildId, attackerClanId, bet);
    removeClanBalance(guildId, defenderClanId, bet);
  }
  db.prepare('INSERT INTO clan_wars (guildId, warId, attackerClanId, defenderClanId, status, endTime, bet) VALUES (?, ?, ?, ?, ?, ?, ?)').run(guildId, warId, attackerClanId, defenderClanId, 'pending', endTime, bet);
  return { warId, bet };
}

function warAccept(guildId, warId) {
  const war = db.prepare('SELECT * FROM clan_wars WHERE warId = ? AND guildId = ?').get(warId, guildId);
  if (!war) return { error: 'Guerre introuvable.' };
  if (war.status !== 'pending') return { error: 'Cette guerre n\'est plus en attente.' };
  db.prepare("UPDATE clan_wars SET status = 'active' WHERE warId = ?").run(warId);
  db.prepare('UPDATE clan_wars SET attackerScore = ?, defenderScore = ? WHERE warId = ?').run(warCalculateScore(guildId, war.attackerClanId), warCalculateScore(guildId, war.defenderClanId), warId);
  return { success: true, war };
}

function warDecline(guildId, warId) {
  const war = db.prepare('SELECT * FROM clan_wars WHERE warId = ? AND guildId = ?').get(warId, guildId);
  if (!war) return { error: 'Guerre introuvable.' };
  if (war.bet > 0) {
    addClanBalance(guildId, war.attackerClanId, war.bet);
    addClanBalance(guildId, war.defenderClanId, war.bet);
  }
  db.prepare("UPDATE clan_wars SET status = 'declined' WHERE warId = ?").run(warId);
  return { success: true };
}

function getWar(warId) {
  return db.prepare('SELECT * FROM clan_wars WHERE warId = ?').get(warId);
}

function getActiveWar(guildId, clanId) {
  return db.prepare("SELECT * FROM clan_wars WHERE guildId = ? AND status = 'active' AND (attackerClanId = ? OR defenderClanId = ?)").get(guildId, clanId, clanId);
}

function finishWar(guildId, warId) {
  const war = getWar(warId);
  if (!war) return { error: 'Guerre introuvable.' };
  let winnerId, loserId;
  if (war.attackerScore > war.defenderScore) { winnerId = war.attackerClanId; loserId = war.defenderClanId; }
  else if (war.defenderScore > war.attackerScore) { winnerId = war.defenderClanId; loserId = war.attackerClanId; }
  else { winnerId = 'draw'; loserId = 'draw'; }
  db.prepare('UPDATE clan_wars SET status = ? WHERE warId = ?').run(winnerId === 'draw' ? 'draw' : 'finished', warId);
  if (winnerId !== 'draw') {
    if (war.bet > 0) addClanBalance(guildId, winnerId, war.bet * 2);
    addClanXp(guildId, winnerId, 200);
    addClanXp(guildId, loserId, 50);
    addClanLog(guildId, winnerId, null, 'war_win', `Guerre gagnée contre ${loserId}. Gain: ${war.bet * 2 || 0}🪙, 200XP`);
    addClanLog(guildId, loserId, null, 'war_loss', `Guerre perdue contre ${winnerId}. Perte: ${war.bet || 0}🪙`);
  } else {
    addClanXp(guildId, war.attackerClanId, 100);
    addClanXp(guildId, war.defenderClanId, 100);
    if (war.bet > 0) {
      addClanBalance(guildId, war.attackerClanId, war.bet);
      addClanBalance(guildId, war.defenderClanId, war.bet);
    }
  }
  return { winner: winnerId === 'draw' ? null : winnerId, draw: winnerId === 'draw', war };
}

/* ─────────── UPGRADES ─────────── */

const UPGRADES = {
  xp_boost:   { name: 'Boost XP',     desc: 'x1.5 XP pour tous les membres',           baseCost: 500,  maxLevel: 5, costMultiplier: 2 },
  bank_interest: { name: 'Intérêt banquaire', desc: '0.5% de la cagnotte/jour',         baseCost: 1000, maxLevel: 3, costMultiplier: 2.5 },
  max_members: { name: 'Membres max',  desc: '+2 membres maximum',                       baseCost: 2000, maxLevel: 3, costMultiplier: 2 },
  war_bonus:  { name: 'Bonus guerre',  desc: '+10% score en guerre',                     baseCost: 1500, maxLevel: 3, costMultiplier: 2 },
  role_color: { name: 'Couleur rôle',  desc: 'Donne un rôle coloré aux membres',         baseCost: 3000, maxLevel: 1, costMultiplier: 1 },
};

function getUpgrades(guildId, clanId) {
  const owned = db.prepare('SELECT * FROM clan_upgrades WHERE guildId = ? AND clanId = ?').all(guildId, clanId);
  return Object.entries(UPGRADES).map(([id, cfg]) => {
    const current = owned.find(u => u.upgradeId === id);
    const level = current ? current.level : 0;
    const canUpgrade = level < cfg.maxLevel;
    const nextCost = Math.floor(cfg.baseCost * Math.pow(cfg.costMultiplier, level));
    return { id, ...cfg, level, canUpgrade, nextCost };
  });
}

function buyUpgrade(guildId, clanId, upgradeId) {
  const cfg = UPGRADES[upgradeId];
  if (!cfg) return { error: 'Amélioration inconnue.' };
  const current = db.prepare('SELECT * FROM clan_upgrades WHERE guildId = ? AND clanId = ? AND upgradeId = ?').get(guildId, clanId, upgradeId);
  const level = current ? current.level : 0;
  if (level >= cfg.maxLevel) return { error: 'Amélioration déjà au max.' };
  const cost = Math.floor(cfg.baseCost * Math.pow(cfg.costMultiplier, level));
  const clan = getClan(guildId, clanId);
  if (!clan || (clan.balance || 0) < cost) return { error: `Il faut ${cost} 🪙, tu as ${clan?.balance || 0} 🪙.` };
  removeClanBalance(guildId, clanId, cost);
  if (current) {
    db.prepare('UPDATE clan_upgrades SET level = level + 1 WHERE guildId = ? AND clanId = ? AND upgradeId = ?').run(guildId, clanId, upgradeId);
  } else {
    db.prepare('INSERT INTO clan_upgrades (guildId, clanId, upgradeId, level) VALUES (?, ?, ?, 1)').run(guildId, clanId, upgradeId);
  }
  addClanLog(guildId, clanId, null, 'upgrade', `${cfg.name} → niveau ${level + 1} (${cost}🪙)`);
  return { success: true, name: cfg.name, newLevel: level + 1, cost };
}

function getUpgradeBonus(guildId, clanId, upgradeId) {
  const row = db.prepare('SELECT level FROM clan_upgrades WHERE guildId = ? AND clanId = ? AND upgradeId = ?').get(guildId, clanId, upgradeId);
  return row ? row.level : 0;
}

/* ─────────── LOGS ─────────── */

function addClanLog(guildId, clanId, userId, action, details) {
  db.prepare('INSERT INTO clan_logs (guildId, clanId, userId, action, details) VALUES (?, ?, ?, ?, ?)').run(guildId, clanId, userId || '', action, details || '');
}

function getClanLogs(guildId, clanId, limit = 10) {
  return db.prepare('SELECT * FROM clan_logs WHERE guildId = ? AND clanId = ? ORDER BY id DESC LIMIT ?').all(guildId, clanId, limit);
}

/* ─────────── SALON PRIVÉ ─────────── */

async function syncChannelPerms(guild, clanId) {
  const clan = getFullClan(guild.id, clanId);
  if (!clan?.channelId) return;
  const channel = guild.channels.cache.get(clan.channelId);
  if (!channel) return;
  const memberIds = clan.members.map(m => m.userId);
  const currentOverwrites = channel.permissionOverwrites.cache;
  for (const [id, ow] of currentOverwrites) {
    if (id === guild.id || id === guild.members.me.id) continue;
    if (!memberIds.includes(id)) {
      try { await ow.delete(); } catch {}
    }
  }
  for (const uid of memberIds) {
    try {
      if (!currentOverwrites.has(uid)) {
        await channel.permissionOverwrites.create(uid, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      }
    } catch {}
  }
}

function getXpBoostMultiplier(guildId, userId) {
  const member = getMember(guildId, userId);
  if (!member) return 1;
  const level = getUpgradeBonus(guildId, member.clanId, 'xp_boost');
  return 1 + level * 0.15;
}

/* ─────────── ROLE COLORÉ ─────────── */

async function applyRoleColor(guild, clanId) {
  const clan = getFullClan(guild.id, clanId);
  if (!clan) return;
  const level = getUpgradeBonus(guild.id, clanId, 'role_color');
  if (level < 1) return;
  let role = guild.roles.cache.find(r => r.name === `🏰 ${clan.name}` && r.managed === false);
  if (!role) {
    role = await guild.roles.create({
      name: `🏰 ${clan.name}`,
      color: parseInt(clan.color?.replace('#', ''), 16) || 0x3498DB,
      hoist: false,
      mentionable: false,
      reason: `Rôle coloré du clan ${clan.name}`,
    });
  }
  for (const m of clan.members) {
    try {
      const member = await guild.members.fetch(m.userId);
      if (member && !member.roles.cache.has(role.id)) await member.roles.add(role);
    } catch {}
  }
  return role;
}

module.exports = {
  createClan, deleteClan, getClan, getFullClan, getUserClan, getClans,
  addMember, removeMember, getMember, setRole,
  setClanField, setClanChannel,
  addClanBalance, removeClanBalance, contributeCoins, contributeXp,
  addClanXp,
  transferOwnership,
  createInvite, acceptInvite, declineInvite, getInvites,
  warCalculateScore, warChallenge, warAccept, warDecline, getWar, getActiveWar, finishWar,
  getUpgrades, buyUpgrade, getUpgradeBonus, UPGRADES,
  addClanLog, getClanLogs,
  syncChannelPerms, getXpBoostMultiplier, applyRoleColor,
};
