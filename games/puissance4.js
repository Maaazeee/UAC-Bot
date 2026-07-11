const ROWS = 6;
const COLS = 7;
const parties = new Map();

function start(channelId, joueur1, joueur2, bet = 0) {
  const grille = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  parties.set(channelId, { grille, joueur1, joueur2, tour: joueur1, bet });
  return parties.get(channelId);
}

function play(channelId, userId, col) {
  const partie = parties.get(channelId);
  if (!partie) return { error: 'Aucune partie en cours.' };
  if (userId !== partie.tour) return { error: "Ce n'est pas ton tour." };
  if (col < 0 || col >= COLS) return { error: 'Colonne invalide (1-7).' };

  const ligne = partie.grille.findLastIndex(row => row[col] === null);
  if (ligne === -1) return { error: 'Cette colonne est pleine.' };

  const symbole = userId === partie.joueur1 ? '🔴' : '🟡';
  partie.grille[ligne][col] = symbole;

  if (checkWin(partie.grille, symbole)) {
    return { grille: partie.grille, gagnant: userId, fin: true };
  }

  if (partie.grille.every(row => row.every(c => c !== null))) {
    return { grille: partie.grille, egalite: true, fin: true };
  }

  partie.tour = partie.tour === partie.joueur1 ? partie.joueur2 : partie.joueur1;
  return { grille: partie.grille, tour: partie.tour, fin: false };
}

function checkWin(grille, symbole) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grille[r][c] !== symbole) continue;
      for (const [dr, dc] of directions) {
        let count = 1;
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (grille[nr][nc] !== symbole) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

function drawBoard(grille) {
  const header = ' 1   2   3   4   5   6   7\n';
  const lignes = grille.map(row =>
    row.map(c => c || '⬛').join(' ')
  ).join('\n');
  return `\`\`\`\n${header}${lignes}\n\`\`\``;
}

module.exports = { name: 'puissance4', start, play, drawBoard, ROWS, COLS, parties };
