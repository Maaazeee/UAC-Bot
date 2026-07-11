const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const regles = {
  pfc: {
    nom: '🪨📄✂️ Pierre-Feuille-Ciseaux',
    regles: 'Choisis **pierre**, **feuille** ou **ciseaux**.\n- 🪨 Pierre bat ✂️ Ciseaux\n- 📄 Feuille bat 🪨 Pierre\n- ✂️ Ciseaux bat 📄 Feuille\n\nÉgalité si même choix. Le bot joue aléatoirement.',
    commande: '/pfc <pierre|feuille|ciseaux>',
  },
  devine: {
    nom: '🔢 Devine le nombre',
    regles: 'Le bot choisit un nombre aléatoire entre **1** et **N** (défaut: 100).\nTu dois le deviner en proposant des nombres.\n\nÀ chaque proposition, le bot t\'indique si c\'est **plus** ou **moins**.\n\nPas de limite de tentatives. Continue jusqu\'à trouver !',
    commande: '/devine lancer [max] → /devine jouer <nombre>',
  },
  quiz: {
    nom: '❓ Quiz',
    regles: 'Une question à choix multiples t\'est posée.\nClique sur un bouton pour répondre.\n\nTu as **30 secondes** pour répondre.\nBonnes réponses = points au classement !',
    commande: '/quiz',
  },
  pendu: {
    nom: '🪢 Pendu',
    regles: 'Un mot est caché, représenté par des tirets.\nPropose des lettres une par une.\n- ✅ Lettre correcte : elle est révélée\n- ❌ Lettre incorrecte : le bonhomme se dessine\n\n**6 erreurs** maximum avant de perdre !',
    commande: '/pendu lancer → /pendu lettre <lettre>',
  },
  des: {
    nom: '🎲 Dés',
    regles: 'Mise sur un résultat : **pair**, **impair**, ou un nombre **1 à 6**.\nLe bot lance un dé à 6 faces.\n\nSi ton pari est correct, tu gagnes !',
    commande: '/des <pair|impair|1-6>',
  },
  justeprix: {
    nom: '🎯 Juste Prix',
    regles: 'Un objet t\'est présenté. Estime son prix (entre 1€ et 1000€).\nLe bot t\'indique si le prix est **plus haut** ou **plus bas**.\n\nTu as **5 tentatives** pour trouver le juste prix !',
    commande: '/justeprix lancer → /justeprix jouer <prix>',
  },
  morpion: {
    nom: '⭕❌ Morpion (Tic-Tac-Toe)',
    regles: 'Affronte un autre joueur sur une grille 3×3.\n❌ pour le premier joueur, ⭕ pour le second.\n\nTour à tour, placez votre symbole (positions **1 à 9**, de gauche à droite, haut en bas).\n\nLe premier à aligner 3 symboles gagne !',
    commande: '/morpion defier <membre> → /morpion jouer <position>',
  },
  allumettes: {
    nom: '🪄 Allumettes (Nim)',
    regles: 'Affronte un joueur. **21 allumettes** sur la table.\n\nÀ tour de rôle, retirez **1, 2 ou 3 allumettes**.\n\n💀 **Celui qui prend la dernière allumette perd !**\n\nAnticipe les coups de ton adversaire pour le piéger.',
    commande: '/allumettes defier <membre> → /allumettes jouer <1-3>',
  },
  puissance4: {
    nom: '🔴🟡 Puissance 4',
    regles: 'Affronte un joueur sur une grille **6×7**.\n🔴 pour le premier, 🟡 pour le second.\n\nChoisis une colonne (**1 à 7**) pour y laisser tomber ton jeton.\n\nLe premier à aligner **4 jetons** horizontalement, verticalement ou en diagonale gagne !',
    commande: '/puissance4 defier <membre> → /puissance4 jouer <colonne>',
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regles')
    .setDescription('Affiche les règles d\'un jeu')
    .addStringOption(opt =>
      opt.setName('jeu')
        .setDescription('Le jeu dont tu veux voir les règles')
        .setRequired(true)
        .addChoices(
          { name: 'Pierre-Feuille-Ciseaux', value: 'pfc' },
          { name: 'Devine le nombre', value: 'devine' },
          { name: 'Quiz', value: 'quiz' },
          { name: 'Pendu', value: 'pendu' },
          { name: 'Dés', value: 'des' },
          { name: 'Juste Prix', value: 'justeprix' },
          { name: 'Morpion', value: 'morpion' },
          { name: 'Allumettes (Nim)', value: 'allumettes' },
          { name: 'Puissance 4', value: 'puissance4' },
        ),
    ),
  async execute(interaction) {
    const jeu = interaction.options.getString('jeu');
    const info = regles[jeu];

    const embed = new EmbedBuilder()
      .setTitle(info.nom)
      .setDescription(`**Règles :**\n${info.regles}\n\n**Commande :** \`${info.commande}\``)
      .setColor(0x00AE86);

    await interaction.reply({ embeds: [embed] });
  },
};
