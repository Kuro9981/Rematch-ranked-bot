const { ActivityType } = require('discord.js');
const { initializeQueuePolling } = require('../utils/autoQueueManager');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    client.user.setActivity('Rematch Tournament', { type: ActivityType.Watching });

    // Initialize auto queue polling for all guilds
    await initializeQueuePolling(client);
    console.log('📋 Auto queue polling initialized');
  },
};
