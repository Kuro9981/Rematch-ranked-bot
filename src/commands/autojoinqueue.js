const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadAutoQueue, saveAutoQueue, loadQueueConfig } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autojoinqueue')
    .setDescription('Join the automatic match queue (Captain only)')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const guildId = interaction.guildId;
    const teams = await loadTeams();

    // Check if team exists
    if (!teams[teamName]) {
      return interaction.reply({
        content: `❌ Team **${teamName}** does not exist!`,
        ephemeral: true,
      });
    }

    // Check if user is captain
    if (teams[teamName].captain !== interaction.user.id) {
      return interaction.reply({
        content: `❌ Only the captain of **${teamName}** can queue!`,
        ephemeral: true,
      });
    }

    // Check if queue channel is set up
    const queueConfig = await loadQueueConfig(guildId);
    if (!queueConfig.queueChannelId) {
      return interaction.reply({
        content: `❌ Queue channel not configured! Ask server admins to use \`/queuesetup\``,
        ephemeral: true,
      });
    }

    // Load auto queue
    const autoQueue = await loadAutoQueue(guildId);

    // Check if team already in queue
    if (autoQueue.some((q) => q.teamName === teamName)) {
      return interaction.reply({
        content: `❌ **${teamName}** is already in queue!`,
        ephemeral: true,
      });
    }

    // Add to queue
    autoQueue.push({
      teamName,
      captainId: interaction.user.id,
      mmr: teams[teamName].mmr,
      addedAt: Date.now(),
      waitTime: 0, // Will be used to calculate exponential range
    });

    await saveAutoQueue(guildId, autoQueue);

    return interaction.reply({
      content: `✅ **${teamName}** joined the queue!\n\n📊 Current MMR: ${teams[teamName].mmr}\n⏳ Finding opponents...`,
      ephemeral: true,
    });
  },
};
