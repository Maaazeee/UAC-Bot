const parties = new Map();

function start(channelId, joueur1, joueur2, bet = 0) {
  const total = 21;
  parties.set(channelId, { total, joueur1, joueur2, tour: joueur1, bet });
  return { total };
}

function play(channelId, userId, nb) {
  const partie = parties.get(channelId);
  if (!partie) return { error: 'Aucune partie en cours.' };
  if (userId !== partie.tour) return { error: "Ce n'est pas ton tour." };
  if (nb < 1 || nb > 3) return { error: 'Tu dois retirer entre 1 et 3 allumettes.' };
  if (nb > partie.total) return { error: `Il ne reste que ${partie.total} allumette(s).` };

  partie.total -= nb;

  if (partie.total <= 0) {
    return { total: 0, perdant: userId, fin: true };
  }

  partie.tour = partie.tour === partie.joueur1 ? partie.joueur2 : partie.joueur1;
  return { total: partie.total, tour: partie.tour, fin: false };
}

function drawAllumettes(nb) {
  const allumettes = '|'.repeat(Math.min(nb, 40));
  return `\`\`\`${allumettes || ' '}\`\`\`\nIl reste **${nb}** allumette(s)`;
}

module.exports = { name: 'allumettes', start, play, drawAllumettes, parties };
