const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');
const RANKS_FILE = path.join(DATA_DIR, 'ranks.json');

// Initialize default rank thresholds
const DEFAULT_RANKS = [
  { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
  { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
  { name: 'Gold', minMMR: 1000, color: '#FFD700' },
  { name: 'Platinum', minMMR: 1500, color: '#E5E4E2' },
  { name: 'Diamond', minMMR: 2000, color: '#B9F2FF' },
  { name: 'Master', minMMR: 2500, color: '#FF1493' },
  { name: 'Grandmaster', minMMR: 3000, color: '#FFD700' },
];

// Load data from JSON files
function loadTeams() {
  try {
    if (fs.existsSync(TEAMS_FILE)) {
      return JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading teams:', error);
  }
  return {};
}

function loadMatches() {
  try {
    if (fs.existsSync(MATCHES_FILE)) {
      return JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading matches:', error);
  }
  return [];
}

function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading queue:', error);
  }
  return [];
}

function loadRanks() {
  try {
    if (fs.existsSync(RANKS_FILE)) {
      return JSON.parse(fs.readFileSync(RANKS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading ranks:', error);
  }
  return DEFAULT_RANKS;
}

// Save data to JSON files
function saveTeams(teams) {
  fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2));
}

function saveMatches(matches) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function saveRanks(ranks) {
  fs.writeFileSync(RANKS_FILE, JSON.stringify(ranks, null, 2));
}

module.exports = {
  loadTeams,
  loadMatches,
  loadQueue,
  loadRanks,
  saveTeams,
  saveMatches,
  saveQueue,
  saveRanks,
  DEFAULT_RANKS,
};
