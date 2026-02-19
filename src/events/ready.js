const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    client.user.setActivity('Rematch Tournament', { type: ActivityType.Watching });
  },
};
