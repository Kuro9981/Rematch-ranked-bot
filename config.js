// Configuration file for the Rematch Tournament Bot
// Customize these values to match your preferences

module.exports = {
  // Bot Status
  activity: {
    name: 'Rematch Tournament',
    type: 'WATCHING', // Can be: PLAYING, STREAMING, LISTENING, WATCHING
  },

  // MMR Settings
  mmr: {
    kFactor: 32, // Higher = more volatile MMR changes per match
    baseMMR: 1000, // Starting MMR for new teams
    minMMR: 0, // Minimum MMR a team can have
  },

  // Rank Configuration
  ranks: [
    { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
    { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
    { name: 'Gold', minMMR: 1000, color: '#FFD700' },
    { name: 'Platinum', minMMR: 1500, color: '#E5E4E2' },
    { name: 'Diamond', minMMR: 2000, color: '#B9F2FF' },
    { name: 'Master', minMMR: 2500, color: '#FF1493' },
    { name: 'Grandmaster', minMMR: 3000, color: '#FFD700' },
  ],

  // Match Settings
  match: {
    channelAutoDeleteDelay: 60000, // Delete match channel after 60 seconds (in ms)
    requireBothConfirmations: true, // Both captains must confirm win
  },

  // Colors for embeds
  colors: {
    success: 0x00ff00,
    error: 0xff0000,
    info: 0x0099ff,
    warning: 0xffff00,
    rank: 0xffd700,
  },

  // Permissions
  permissions: {
    adminOnly: ['resetseason', 'setmmr'],
    captainOnly: ['queue', 'win', 'addmember', 'removemember'],
    managerOnly: ['createteam', 'setcaptain'],
  },
};
