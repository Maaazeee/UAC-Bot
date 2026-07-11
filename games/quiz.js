const questions = [
  {
    question: 'Quelle est la capitale de la France ?',
    options: ['Lyon', 'Paris', 'Marseille', 'Toulouse'],
    reponse: 1,
  },
  {
    question: "Combien de continents y a-t-il sur Terre ?",
    options: ['5', '6', '7', '8'],
    reponse: 2,
  },
  {
    question: "Qui a peint La Joconde ?",
    options: ['Van Gogh', 'Picasso', 'De Vinci', 'Rembrandt'],
    reponse: 2,
  },
  {
    question: "Quel est l'océan le plus profond ?",
    options: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'],
    reponse: 3,
  },
  {
    question: "En quelle année l'homme a-t-il marché sur la Lune ?",
    options: ['1965', '1969', '1972', '1959'],
    reponse: 1,
  },
];

const sessions = new Map();

function start(userId) {
  const index = Math.floor(Math.random() * questions.length);
  const q = questions[index];
  sessions.set(userId, { index, reponse: q.reponse });
  return q;
}

function answer(userId, choix) {
  const session = sessions.get(userId);
  if (!session) return { error: "Aucune question en cours. Lance /quiz pour commencer." };

  const correct = choix === session.reponse;
  const q = questions[session.index];
  sessions.delete(userId);

  return {
    correct,
    reponse: q.reponse,
    reponseTexte: q.options[q.reponse],
    question: q.question,
  };
}

module.exports = { name: 'quiz', start, answer };
