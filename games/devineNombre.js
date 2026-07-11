const games = new Map();

function start(userId, max) {
  const nombre = Math.floor(Math.random() * max) + 1;
  games.set(userId, { nombre, max, tentatives: 0 });
  return { max };
}

function guess(userId, nombre) {
  const game = games.get(userId);
  if (!game) return { error: 'Aucune partie en cours. Lance /devine pour commencer.' };

  game.tentatives++;
  if (nombre < game.nombre) return { reponse: 'trop_petit', tentatives: game.tentatives };
  if (nombre > game.nombre) return { reponse: 'trop_grand', tentatives: game.tentatives };

  games.delete(userId);
  return { reponse: 'gagne', nombre: game.nombre, tentatives: game.tentatives };
}

module.exports = { name: 'devineNombre', start, guess };
