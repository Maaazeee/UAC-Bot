# UAC Bot — Résumé complet du projet

**81 commandes** réparties en **9 catégories** + **systèmes automatiques** (logs, événements).

---

## 📁 CONFIG (21 commandes — réservées staff sauf mentions contraires)

| Commande | Accès | Description |
|----------|-------|-------------|
| `/antiinvite <on/off>` | Admin | Bloque les invitations Discord dans les messages |
| `/antiraid on\|off\|unlock` | Admin | Protection anti-raid : verrouille tous les salons, désactive quand le raid est fini |
| `/automod add\|remove\|liste\|caps\|massmention\|liens` | Admin | Mots interdits, détection majuscules, mentions en masse, blocage de liens |
| `/autorole set\|disable` | Admin | Rôle attribué automatiquement à l'arrivée d'un membre |
| `/birthdaychannel <salon> [message]` | Admin | Salon d'annonce des anniversaires + message personnalisé ({users}) |
| `/cc add\|remove\|list` | **add/remove**=Admin, **list**=public | Commandes personnalisées avec préfixe `!` |
| `/clan (24 sous-commandes)` | **Mixte** (voir détail plus bas) | Système complet de clans |
| `/giveaway <prix> <durée> [gagnants]` | ManageGuild | Lance un giveaway avec tirage auto + DM gagnants + bouton réclamer |
| `/permissions set\|remove\|list` | Admin | Restreindre une commande à un rôle spécifique (autocomplete) |
| `/reactrole <salon> <message> <role1> <emoji1> ...` | Admin | Message à réaction pour attribution de rôles (jusqu'à 3) |
| `/setgoodbye <salon> [message]` | Admin | Message d'au revoir ({user}, {server}) |
| `/setlogs <salon>` | Admin | Salon de logs d'audit (messages supprimés, bans, etc.) |
| `/setwelcome <salon> [message] [image]` | Admin | Message et/ou image de bienvenue Canvas ({user}, {server}) |
| `/sondage <question> <choix1> <choix2> [3-6] [anonyme] [durée]` | ManageMessages | Sondage avancé avec boutons, mode anonyme, durée limitée |
| `/starboard set\|disable\|config` | Admin | Salon épinglant les messages les plus réagis (⭐) |
| `/strike timeout\|ban\|disable` | Admin | Actions automatiques après X warns (timeout ou ban) |
| `/tempvoice <salon> <catégorie>` | Admin | Salon vocal « source » : quand un membre rejoint, un salon temporaire est créé |
| `/ticket panel\|close` | Admin | Système de tickets par bouton (salon privé membre/staff) |
| `/verification <role> <salon> [welcomechannel] [welcomemessage]` | Admin | Vérification par bouton + message de bienvenue optionnel |
| `/voicecounter <salon>` | Admin | Compteur vocal dans le nom d'un salon (mis à jour toutes les 30s) |
| `/voicexp <on/off>` | Admin | Active/désactive l'XP gagnée en restant en vocal |

### Sous-commandes `/clan` en détail

| Sous-commande | Accès | Description |
|---------------|-------|-------------|
| `create <nom>` | **Tous** | Crée un nouveau clan (max 32 car.) |
| `delete` | **Staff uniquement** | Supprime le clan (confirmation par bouton) |
| `info [nom]` | **Tous** | Infos détaillées du clan (membres, top contributeurs, améliorations, logs) |
| `list` | **Tous** | Liste tous les clans du serveur |
| `set <propriété> <valeur>` | **Owner** | Description, couleur (#RRGGBB), emoji, bannière (URL) |
| `chat <message>` | **Membres du clan** | Envoie un message dans le salon privé du clan (création auto) |
| `invite <action> [membre]` | **Owner/Co-leader** | Inviter un membre / Voir ses invitations / Accepter / Refuser |
| `join <nom>` | **Tous** | Rejoindre un clan librement (si place dispo) |
| `leave` | **Membres** | Quitter son clan |
| `kick <membre>` | **Owner/Co-leader** | Expulser un membre |
| `transfer <membre>` | **Owner** | Transférer la propriété à un autre membre |
| `promote <membre> <grade>` | **Owner** | Promouvoir Co-leader ou rétrograder Membre |
| `deposit <montant>` | **Membres** | Déposer des coins perso dans la cagnotte du clan |
| `withdraw <montant>` | **Owner/Co-leader** | Retirer des coins de la cagnotte |
| `bank` | **Membres** | Voir la cagnotte et le top déposants |
| `upgrades` | **Membres** | Voir les améliorations disponibles |
| `upgrade <id>` | **Owner/Co-leader** | Acheter une amélioration (Boost XP, Intérêt, Membres max, Bonus guerre, Rôle coloré) |
| `war <clan> [mise]` | **Owner/Co-leader** | Défier un clan (boutons d'acceptation/refus) |
| `wars` | **Membres** | Voir l'état de la guerre en cours (score, temps restant) |
| `logs` | **Membres** | Voir les 15 dernières actions du clan |
| `motd [message]` | **Owner** | Message du jour (posté dans le salon privé) |

---

## 💰 ÉCONOMIE (6 commandes — toutes publiques)

| Commande | Description |
|----------|-------------|
| `/balance [membre]` | Voir son solde ou celui d'un membre |
| `/dailycoin` | Réclamer 100 🪙 par jour |
| `/gamble <montant>` | Tenter sa chance (50% de chance de doubler) |
| `/give <membre> <montant>` | Donner des pièces à un membre |
| `/rich` | Classement des plus riches du serveur |
| `/shop list\|buy\|inventory\|use\|add\|remove` | Boutique : **list/buy/inventory/use**=public, **add/remove**=Admin. Types d'articles : rôle, consommable, permanent. Limite d'achat configurable. Inventaire utilisable avec `/shop use`. |

---

## 🎲 FUN (3 commandes — toutes publiques)

| Commande | Description |
|----------|-------------|
| `/8ball <question>` | La boule magique répond à ta question |
| `/coinflip` | Pile ou face |
| `/dice [faces]` | Lance un dé (2 à 100 faces, défaut 6) |

---

## 🎮 JEUX (11 commandes — toutes publiques)

| Commande | Description |
|----------|-------------|
| `/allumettes <defier\|jouer> [mise]` | Jeu de Nim (21 allumettes). Défi 1v1 avec mise en coins optionnelle. |
| `/classement` | Classement des joueurs (victoires/défaites/égalités) |
| `/des <pari>` | Mise sur un lancer de dé (pair/impair/1-6) |
| `/devine <lancer\|jouer> [max]` | Devine le nombre (1 joueur vs bot) |
| `/justeprix <lancer\|jouer>` | Juste Prix (1 joueur vs bot) |
| `/morpion <defier\|jouer> [mise]` | Morpion 1v1 avec mise optionnelle |
| `/pendu <lancer\|lettre>` | Jeu du pendu (1 joueur) |
| `/pfc <choix>` | Pierre-Feuille-Ciseaux contre le bot |
| `/puissance4 <defier\|jouer> [mise]` | Puissance 4 1v1 avec mise optionnelle |
| `/quiz` | Question aléatoire (culture générale) |
| `/regles <jeu>` | Affiche les règles du jeu choisi |

Tous les jeux 1v1 donnent **+5 coins** au gagnant et contribuent au classement (victoire/défaite/égalité dans `data/scores`). Les mises sont déduites des deux joueurs et reversées au gagnant.

---

## 🛡️ MODERATION (13 commandes — staff uniquement)

| Commande | Permission | Description |
|----------|-----------|-------------|
| `/ban <membre> [raison]` | BanMembers | Bannir un membre |
| `/clear <nombre>` | ManageMessages | Supprimer des messages (1-100) |
| `/delwarn <membre> <id>` | ModerateMembers | Supprimer un avertissement spécifique |
| `/kick <membre> [raison]` | KickMembers | Expulser un membre |
| `/lock [raison]` | ManageChannels | Verrouiller le salon (écriture bloquée) |
| `/purge <membre> [limite]` | ManageMessages | Supprimer tous les messages d'un membre |
| `/slowmode <secondes> [raison]` | ManageChannels | Définir le slowmode (0-21600s) |
| `/softban <membre> [messages] [raison]` | BanMembers | Ban + unban immédiat (purge les messages) |
| `/tempban <membre> <durée> <unité> [raison]` | BanMembers | Bannissement temporaire |
| `/timeout <membre> <durée> <unité> [raison]` | ModerateMembers | Mettre en timeout |
| `/unban <id> [raison]` | BanMembers | Débannir un utilisateur |
| `/unlock` | ManageChannels | Déverrouiller le salon |
| `/warn ajouter\|liste\|clear` | ModerateMembers | Système d'avertissements |

---

## 🎵 MUSIQUE (2 commandes — publiques, nécessite être en vocal)

| Commande | Description |
|----------|-------------|
| `/play <recherche>` | Joue une musique (titre, YouTube, Spotify, SoundCloud) |
| `/music skip\|stop\|pause\|resume\|queue\|nowplaying\|volume\|loop\|shuffle\|remove\|lyrics` | Contrôles du lecteur (volume 0-100, loop off/song/queue, paroles) |

Lecteur basé sur DisTube avec plugins Spotify, SoundCloud et yt-dlp. Salon vide = déconnexion auto.

---

## 📊 NIVEAU (10 commandes — mixte)

| Commande | Accès | Description |
|----------|-------|-------------|
| `/autoleaderboard [salon]` | **Admin** | Classement automatique des niveaux (MAJ toutes les 10 min) |
| `/daily` | **Tous** | Bonus XP quotidien |
| `/level [membre]` | **Tous** | Carte de rang avec canvas (avatar, barre de progression, rang) |
| `/levelannounce [salon]` | **Admin** | Salon d'annonces de passage de niveau |
| `/levelchannel set\|remove\|liste` | **Admin** | Récompenses salon (salon privé débloqué à un niveau) |
| `/levelrole add\|remove\|liste` | **Admin** | Récompenses rôle à certains niveaux |
| `/levels` | **Tous** | Classement des niveaux du serveur |
| `/levelset set\|reset\|dailycap` | **Admin** | Gérer l'XP des membres (set, reset, plafond quotidien) |
| `/voicestats [membre]` | **Tous** | Temps passé en vocal (heures/minutes) |
| `/xpmultiplier role\|salon\|liste` | **Admin** | Multiplicateurs XP par rôle (x1-x5) ou par salon |

L'XP s'obtient en **écrivant des messages** (15-25 XP de base + multiplicateurs) et en **restant en vocal** (10 XP/min si activé). Le clan `xp_boost` ajoute un multiplicateur supplémentaire.

---

## 🔧 UTILITAIRE (10 commandes — toutes publiques sauf mention)

| Commande | Accès | Description |
|----------|-------|-------------|
| `/afk [raison]` | **Tous** | Marque comme absent (détection auto des mentions, retrait au premier message) |
| `/aide` | **Tous** | Liste dynamique de toutes les commandes par catégorie |
| `/anniversaire set\|get\|remove` | **Tous** | Enregistre sa date d'anniversaire (JJ-MM) |
| `/nick <membre> [pseudo]` | **ManageNicknames** | Changer le pseudo d'un membre |
| `/ping` | **Tous** | Vérifier que le bot répond |
| `/remind <temps> <message>` | **Tous** | Planifie un rappel (ex: `10m`, `1h`, `2d`) |
| `/report <membre> <raison>` | **Tous** | Signaler un membre aux modérateurs (envoi dans le salon de logs) |
| `/role add\|remove` | **ManageRoles** | Ajouter ou retirer un rôle à un membre |
| `/tag add\|get\|list\|delete` | **Tous** | Sauvegardes de texte réutilisables |
| `/translate <texte> <langue>` | **Tous** | Traduction (Google Translate, ex: `en`, `es`, `de`) |

---

## 🎤 VOCAL (5 commandes — staff uniquement)

| Commande | Permission | Description |
|----------|-----------|-------------|
| `/moveall <source> <destination>` | MoveMembers | Déplacer tous les membres d'un salon vocal vers un autre |
| `/vckick <membre>` | MoveMembers | Déconnecter un membre du vocal |
| `/voicedeafen <membre>` | DeafenMembers | Rendre sourd / non sourd un membre |
| `/voicemove <membre> <salon>` | MoveMembers | Déplacer un membre dans un autre salon vocal |
| `/voicemute <membre>` | MuteMembers | Micro coupé / remis d'un membre |

---

## ⚙️ SYSTÈMES AUTOMATIQUES

| Système | Déclencheur | Description |
|---------|-------------|-------------|
| **Anti-raid** | Détection de joins massifs | Verrouille tous les salons notifiés |
| **Anti-invite** | À chaque message | Supprime les messages contenant des invitations Discord |
| **Automod** | À chaque message | Vérifie mots interdits, majuscules excessives, mentions en masse, liens |
| **AFK** | Mention d'un membre AFK | Indique automatiquement que le membre est absent |
| **Autorole** | Arrivée d'un membre | Attribue un rôle automatiquement |
| **Bienvenue/au revoir** | Join/leave | Message (et image Canvas optionnelle) dans le salon configuré |
| **Logs d'audit** | Messages supprimés/édités, bans, etc. | Log dans le salon configuré |
| **Giveaway** | Toutes les 15s | Vérifie les giveaways expirés, tire les gagnants, envoie DM + bouton réclamer |
| **Rappels** | Toutes les 10s | Vérifie les rappels planifiés et envoie les notifications |
| **Anniversaires** | Tous les jours à minuit | Vérifie les anniversaires du jour et annonce dans le salon configuré |
| **Voice counter** | Toutes les 30s | Met à jour le nom du salon avec le nombre de membres en vocal |
| **Temp voice** | Arrivée dans le salon source | Crée un salon vocal temporaire, supprimé quand vide |
| **Starboard** | Réaction ⭐ | Épingle les messages avec assez d'étoiles dans le salon configuré |
| **Réactions rôles** | Réaction sur un message | Ajoute/retire le rôle configuré |
| **Niveaux** | Message/vocal | XP gagnée, passage de niveau, récompenses (rôle/salon), classement auto |
| **Clan — intérêt** | Toutes les 24h | Intérêt sur la cagnotte (0.5% × niveau bank_interest) |
| **Clan — guerres** | Toutes les 30s | Vérifie les guerres expirées, calcule le vainqueur, notifie les salons |
| **Clan — level-up** | Toutes les 15s | Vérifie les nouveaux niveaux de clan, annonce dans le salon privé |
| **Clan — XP contribué** | Chaque message/vocal | XP des membres contribuée automatiquement au clan |

---

## 📊 BASE DE DONNÉES (SQLite — `data/bot.db`)

**16 tables :** `config`, `scores`, `levels`, `warns`, `reports`, `economy`, `shop`, `inventory`, `tags`, `reminders`, `birthdays`, `custom_commands`, `tickets`, `afk`, `giveaways`, `starboard`, `temp_voice`, `clans`, `clan_members`, `clan_wars`, `clan_upgrades`, `clan_logs`, `clan_invites`

## 📁 FICHIERS PRINCIPAUX

| Fichier | Rôle |
|---------|------|
| `index.js` | Point d'entrée (~80 lignes), charge dynamique des events/commandes, config DisTube |
| `deploy-commands.js` | Enregistre toutes les commandes via l'API REST Discord |
| `data/database.js` | Initialisation SQLite (WAL mode, 16 tables) |
| `data/logger.js` | Logger Winston (console + fichier `logs/bot.log`) |
| `data/config.js` | Lecture/écriture dans la table config (JSON stocké) |
| `data/state.js` | Maps mémoire (voiceTracker, spamMap, raidMap, xpCooldown) |
| `data/economy.js` | Gestion des balances, daily, leaderboard |
| `data/levels.js` | XP, niveaux, daily XP, leaderboard |
| `data/clans.js` | CRUD clans, membres, guerres, améliorations, logs |
| `data/giveaways.js` | Giveaway SQLite |
| `data/tickets.js` | Tickets SQLite |
| `data/scores.js` | Statistiques de jeux (victoires/défaites/égalités) |
| `data/customCommands.js` | Commandes personnalisées SQLite |
| `data/birthdays.js` | Anniversaires SQLite |
| `data/reminders.js` | Rappels SQLite |
| `data/tags.js` | Tags SQLite |
| `events/` (9 fichiers) | ready, interactionCreate, messageCreate, voiceStateUpdate, messageDelete, guildMemberAdd, guildMemberRemove, guildAuditLogEntryCreate, messageReactionAdd |
| `commands/` (9 dossiers) | 81 fichiers de commandes |
| `games/` (3 fichiers) | morpion, allumettes, puissance4 |
| `dashboard/server.js` | Dashboard web Express (port 8080, EJS, OAuth2 Discord) |

---

## 🔑 PERMISSIONS — RÉSUMÉ DE L'ARCHITECTURE

1. **`setDefaultMemberPermissions`** sur les commandes 100% staff (`/ban`, `/clear`, `/setlogs`, etc.)
2. **`permissionsRequired`** map dans `interactionCreate.js` — vérification Discord native (double sécurité)
3. **Vérification interne** `memberPermissions.has()` pour les commandes mixtes (`/shop add` admin, `shop list` public)
4. **Grades internes** (`owner`/`coleader`/`member`) pour les actions clan
5. **`/permissions set`** — restriction par rôle pour n'importe quelle commande, stocké en config
6. **Cooldown** — 3s par défaut entre chaque utilisation d'une commande par utilisateur

---

## 🚀 POUR LANCER

```
lancer.bat          → Bot principal
dashboard.bat       → Dashboard web (port 8080)
node deploy-commands.js  → Déploiement des commandes
```
