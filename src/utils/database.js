const redis = require('redis');

const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.connect().catch(console.error);

// Key prefixes per instance
const getKey = (type) => `${INSTANCE_ID}:${type}`;

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

// Load data from Redis
async function loadTeams() {
  try {
    const data = await client.get(getKey('teams'));
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading teams:', error);
    return {};
  }
}

async function loadMatches() {
  try {
    const data = await client.get(getKey('matches'));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading matches:', error);
    return [];
  }
}

async function loadQueue() {
  try {
    const data = await client.get(getKey('queue'));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading queue:', error);
    return [];
  }
}

async function loadRanks() {
  try {
    const data = await client.get(getKey('ranks'));
    return data ? JSON.parse(data) : DEFAULT_RANKS;
  } catch (error) {
    console.error('Error loading ranks:', error);
    return DEFAULT_RANKS;
  }
}

// Save data to Redis
async function saveTeams(teams) {
  try {
    await client.set(getKey('teams'), JSON.stringify(teams));
  } catch (error) {
    console.error('Error saving teams:', error);
  }
}

async function saveMatches(matches) {
  try {
    await client.set(getKey('matches'), JSON.stringify(matches));
  } catch (error) {
    console.error('Error saving matches:', error);
  }
}

async function saveQueue(queue) {
  try {
    await client.set(getKey('queue'), JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving queue:', error);
  }
}

async function saveRanks(ranks) {
  try {
    await client.set(getKey('ranks'), JSON.stringify(ranks));
  } catch (error) {
    console.error('Error saving ranks:', error);
  }
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
