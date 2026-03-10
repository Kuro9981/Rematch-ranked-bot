const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadAutoQueue, saveAutoQueue } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Remove all teams from the queue (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guildId;

    try {
      // Load current queue
      const autoQueue = await loadAutoQueue(guildId);

      // Check if queue is empty
      if (autoQueue.length === 0) {
        return interaction.reply({
          content: '❌ The queue is already empty!',
          ephemeral: true,
        });
      }

      // Store team count before clearing
      const teamCount = autoQueue.length;

      // Clear the queue
      await saveAutoQueue(guildId, []);

      return interaction.reply({
        content: `✅ Queue cleared! Removed **${teamCount}** team(s) from the queue.\n\nAll teams are now available to join another queue.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error clearing queue:', error);
      return interaction.reply({
        content: '❌ Error clearing the queue!',
        ephemeral: true,
      });
    }
  },
};
