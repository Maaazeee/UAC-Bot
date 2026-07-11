const mots = [
  'javascript', 'discord', 'bot', 'jeu', 'pendu',
  'ordinateur', 'programmation', 'serveur', 'membre',
  'message', 'commande', 'salon', 'token', 'node',
];

const parties = new Map();

function start(userId) {
  const mot = mots[Math.floor(Math.random() * mots.length)];
  const etat = mot.split('').map(() => '_');
  parties.set(userId, { mot, etat, erreurs: 0, maxErreurs: 6, lettres: [] });
  return { etat: etat.join(' '), longueur: mot.length };
}

function guess(userId, lettre) {
  const partie = parties.get(userId);
  if (!partie) return { error: 'Aucune partie en cours. Lance /pendu lancer' };

  lettre = lettre.toLowerCase();
  if (partie.lettres.includes(lettre)) return { error: 'Lettre déjà proposée.' };
  if (!/^[a-z]$/.test(lettre)) return { error: 'Lettre invalide.' };

  partie.lettres.push(lettre);

  if (partie.mot.includes(lettre)) {
    for (let i = 0; i < partie.mot.length; i++) {
      if (partie.mot[i] === lettre) partie.etat[i] = lettre;
    }
    if (!partie.etat.includes('_')) {
      parties.delete(userId);
      return { etat: partie.etat.join(' '), gagne: true, mot: partie.mot };
    }
    return { etat: partie.etat.join(' '), gagne: false, fin: false, erreurs: partie.erreurs };
  }

  partie.erreurs++;
  if (partie.erreurs >= partie.maxErreurs) {
    parties.delete(userId);
    return { etat: partie.etat.join(' '), gagne: false, fin: true, perdu: true, mot: partie.mot, erreurs: partie.erreurs };
  }

  return { etat: partie.etat.join(' '), gagne: false, fin: false, erreurs: partie.erreurs };
}

function drawHangman(erreurs) {
  const stades = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```',
  ];
  return stades[erreurs] || stades[0];
}

module.exports = { name: 'pendu', start, guess, drawHangman };
