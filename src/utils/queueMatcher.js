/**
 * Queue Matching System with Exponential Range Growth
 * 
 * Range calculation: 100 × 1.5^(minutes_waited)
 * This ensures teams get matched quickly at first, then expands range over time
 */

/**
 * Calculate the MMR range based on wait time
 * @param {number} waitTimeMs - Time in milliseconds since team joined queue
 * @returns {number} - MMR range in points
 */
function calculateExponentialRange(waitTimeMs) {
  const waitTimeMinutes = waitTimeMs / (1000 * 60);
  // Formula: 100 × 1.5^(minutes)
  const range = 100 * Math.pow(1.5, waitTimeMinutes);
  return Math.round(range);
}

/**
 * Find potential match for a team
 * @param {Object} team - The team looking for a match
 * @param {Array} otherTeams - Array of other teams in queue
 * @returns {Object|null} - Matched team or null
 */
function findMatch(team, otherTeams) {
  const currentTime = Date.now();
  const range = calculateExponentialRange(currentTime - team.addedAt);

  // Look for teams within the exponential range
  const rangeMin = team.mmr - range;
  const rangeMax = team.mmr + range;

  for (const other of otherTeams) {
    if (
      other.teamName !== team.teamName &&
      other.mmr >= rangeMin &&
      other.mmr <= rangeMax
    ) {
      return other;
    }
  }

  return null;
}

/**
 * Process queue and find all possible matches
 * @param {Array} queue - Queue array with teams
 * @returns {Array} - Array of match pairs [[team1, team2], ...]
 */
function findAllMatches(queue) {
  const matches = [];
  const usedTeams = new Set();

  for (const team of queue) {
    if (usedTeams.has(team.teamName)) continue;

    const otherTeams = queue.filter(
      (t) => t.teamName !== team.teamName && !usedTeams.has(t.teamName)
    );

    const match = findMatch(team, otherTeams);
    if (match) {
      matches.push([team, match]);
      usedTeams.add(team.teamName);
      usedTeams.add(match.teamName);
    }
  }

  return matches;
}

/**
 * Get queue status for display
 * @param {Array} queue - Queue array with teams
 * @returns {Array} - Array of teams with their current wait time and range
 */
function getQueueStatus(queue) {
  const currentTime = Date.now();
  return queue.map((team) => {
    const waitTimeMs = currentTime - team.addedAt;
    const waitTimeMin = Math.floor(waitTimeMs / (1000 * 60));
    const range = calculateExponentialRange(waitTimeMs);

    return {
      ...team,
      waitTimeMinutes: waitTimeMin,
      currentRange: range,
    };
  });
}

module.exports = {
  calculateExponentialRange,
  findMatch,
  findAllMatches,
  getQueueStatus,
};
