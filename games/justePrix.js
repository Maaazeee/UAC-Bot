const objets = [
  { nom: '🎧 Casque audio sans fil', prix: 79 },
  { nom: '⌚ Montre connectée', prix: 199 },
  { nom: '📱 Smartphone', prix: 699 },
  { nom: '🖥️ Écran 27 pouces', prix: 349 },
  { nom: '🎮 Console de jeux', prix: 499 },
  { nom: '📷 Appareil photo', prix: 899 },
  { nom: '🛴 Trottinette électrique', prix: 449 },
  { nom: '⌨️ Clavier mécanique', prix: 129 },
  { nom: '🎸 Guitare électrique', prix: 299 },
  { nom: '🏋️ Abonnement salle (1 an)', prix: 599 },
];

const parties = new Map();

function start(userId) {
  const obj = objets[Math.floor(Math.random() * objets.length)];
  const marge = Math.floor(Math.random() * 41) - 20;
  const prix = obj.prix + marge;
  parties.set(userId, {
    nom: obj.nom,
    prix,
    tentatives: 0,
    maxTentatives: 5,
  });
  return { nom: obj.nom, tentatives: 0, maxTentatives: 5 };
}

function guess(userId, proposition) {
  const partie = parties.get(userId);
  if (!partie) return { error: 'Aucune partie en cours. Lance /justeprix lancer' };

  partie.tentatives++;
  if (proposition === partie.prix) {
    parties.delete(userId);
    return { gagne: true, prix: partie.prix, tentatives: partie.tentatives };
  }

  if (partie.tentatives >= partie.maxTentatives) {
    parties.delete(userId);
    return { perdu: true, prix: partie.prix, tentatives: partie.tentatives };
  }

  return { indication: proposition < partie.prix ? 'haut' : 'bas', tentatives: partie.tentatives, maxTentatives: partie.maxTentatives };
}

module.exports = { name: 'justePrix', start, guess };
