const choices = ['pierre', 'feuille', 'ciseaux'];

function getWinner(player, bot) {
  if (player === bot) return 'egalite';
  if (
    (player === 'pierre' && bot === 'ciseaux') ||
    (player === 'feuille' && bot === 'pierre') ||
    (player === 'ciseaux' && bot === 'feuille')
  ) {
    return 'joueur';
  }
  return 'bot';
}

function play(playerChoice) {
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  const result = getWinner(playerChoice, botChoice);
  return { playerChoice, botChoice, result };
}

module.exports = { name: 'pfc', play, choices };
