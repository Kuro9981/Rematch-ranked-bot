const { SlashCommandBuilder } = require('discord.js');
const { loadAutoQueue, saveAutoQueue } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leavequeue')
    .setDescription('Leave the automatic match queue (Captain only)')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const guildId = interaction.guildId;

    const autoQueue = await loadAutoQueue(guildId);

    // Check if team is in queue
    const teamIndex = autoQueue.findIndex((q) => q.teamName === teamName);
    if (teamIndex === -1) {
      return interaction.reply({
        content: `❌ **${teamName}** is not in queue!`,
        ephemeral: true,
      });
    }

    // Check if user is captain
    if (autoQueue[teamIndex].captainId !== interaction.user.id) {
      return interaction.reply({
        content: `❌ Only the captain of **${teamName}** can leave the queue!`,
        ephemeral: true,
      });
    }

    // Remove from queue
    autoQueue.splice(teamIndex, 1);
    await saveAutoQueue(guildId, autoQueue);

    return interaction.reply({
      content: `✅ **${teamName}** left the queue!`,
      ephemeral: true,
    });
  },
};
