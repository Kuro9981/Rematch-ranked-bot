/**
 * Global storage for active matches during voting
 * Shared between interactionCreate and autoQueueManager
 */
const activeMatches = new Map();

/**
 * Add a match to active matches
 * @param {string} matchId - Match ID
 * @param {Object} voteData - Vote data object
 */
function addMatch(matchId, voteData) {
  activeMatches.set(matchId, voteData);
}

/**
 * Get a match from active matches
 * @param {string} matchId - Match ID
 * @returns {Object|undefined} Vote data object
 */
function getMatch(matchId) {
  return activeMatches.get(matchId);
}

/**
 * Remove a match from active matches
 * @param {string} matchId - Match ID
 */
function removeMatch(matchId) {
  activeMatches.delete(matchId);
}

/**
 * Update a match in active matches
 * @param {string} matchId - Match ID
 * @param {Object} voteData - Updated vote data
 */
function updateMatch(matchId, voteData) {
  activeMatches.set(matchId, voteData);
}

/**
 * Get all active matches
 * @returns {Array} Array of match IDs
 */
function getAllMatches() {
  return Array.from(activeMatches.keys());
}

module.exports = {
  activeMatches,
  addMatch,
  getMatch,
  removeMatch,
  updateMatch,
  getAllMatches,
};
