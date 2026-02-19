// MMR calculation utility
// K-factor determines rating volatility (higher = more change per match)
const K_FACTOR = 32;

function calculateMMRChange(winnerMMR, loserMMR) {
  const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserMMR - winnerMMR) / 400));
  const expectedLoserScore = 1 / (1 + Math.pow(10, (winnerMMR - loserMMR) / 400));

  const winnerChange = Math.round(K_FACTOR * (1 - expectedWinnerScore));
  const loserChange = Math.round(K_FACTOR * (0 - expectedLoserScore));

  return {
    winnerChange,
    loserChange,
  };
}

function getRankFromMMR(mmr, ranks) {
  let currentRank = ranks[0];
  for (const rank of ranks) {
    if (mmr >= rank.minMMR) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

function getProgressToNextRank(mmr, ranks) {
  const currentRankIndex = ranks.findIndex(
    (rank) => rank.minMMR <= mmr && (ranks[ranks.indexOf(rank) + 1]?.minMMR || Infinity) > mmr
  );

  if (currentRankIndex === -1 || currentRankIndex === ranks.length - 1) {
    return { currentRank: ranks[ranks.length - 1], nextRank: null, progress: 100 };
  }

  const currentRank = ranks[currentRankIndex];
  const nextRank = ranks[currentRankIndex + 1];
  const currentMinMMR = currentRank.minMMR;
  const nextMinMMR = nextRank.minMMR;
  const progress = Math.round(((mmr - currentMinMMR) / (nextMinMMR - currentMinMMR)) * 100);

  return { currentRank, nextRank, progress };
}

module.exports = {
  calculateMMRChange,
  getRankFromMMR,
  getProgressToNextRank,
};
