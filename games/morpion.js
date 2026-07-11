const parties = new Map();

function start(channelId, joueur1, joueur2, bet = 0) {
  const etat = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
  parties.set(channelId, { etat, joueur1, joueur2, tour: joueur1, vainqueur: null, bet });
  return parties.get(channelId);
}

function play(channelId, userId, position) {
  const partie = parties.get(channelId);
  if (!partie) return { error: 'Aucune partie en cours sur ce salon.' };
  if (userId !== partie.tour) return { error: "Ce n'est pas ton tour." };
  if (partie.etat[position] !== ' ') return { error: 'Cette case est déjà prise.' };

  const symbole = userId === partie.joueur1 ? '❌' : '⭕';
  partie.etat[position] = symbole;

  const gagnant = checkVictoire(partie.etat);
  if (gagnant) {
    partie.vainqueur = userId;
    return { etat: partie.etat, vainqueur: userId, fin: true };
  }

  if (!partie.etat.includes(' ')) {
    partie.vainqueur = 'egalite';
    return { etat: partie.etat, vainqueur: null, fin: true, egalite: true };
  }

  partie.tour = partie.tour === partie.joueur1 ? partie.joueur2 : partie.joueur1;
  return { etat: partie.etat, tour: partie.tour, fin: false };
}

function checkVictoire(etat) {
  const combos = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6],
  ];
  for (const [a,b,c] of combos) {
    if (etat[a] !== ' ' && etat[a] === etat[b] && etat[a] === etat[c]) {
      return etat[a];
    }
  }
  return null;
}

function drawBoard(etat) {
  const ligne = (i) => `${etat[i]}│${etat[i+1]}│${etat[i+2]}`;
  return `\`\`\`\n${ligne(0)}\n─┼─┼─\n${ligne(3)}\n─┼─┼─\n${ligne(6)}\n\`\`\``;
}

module.exports = { name: 'morpion', start, play, drawBoard, parties };
