function roll() {
  return Math.floor(Math.random() * 6) + 1;
}

function play(pari, valeur) {
  const resultat = roll();
  let gagne = false;

  if (pari === 'nombre') {
    gagne = resultat === valeur;
  } else if (pari === 'pair') {
    gagne = resultat % 2 === 0;
  } else if (pari === 'impair') {
    gagne = resultat % 2 !== 0;
  }

  return { resultat, gagne };
}

const emojis = {
  1: ':one:', 2: ':two:', 3: ':three:',
  4: ':four:', 5: ':five:', 6: ':six:',
};

module.exports = { name: 'des', play, emojis };
