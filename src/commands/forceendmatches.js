const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadMatches, saveMatches } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceendmatches')
    .setDescription('Force end all active matches and close their channels (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guildId;

    try {
      // Load all matches
      const matches = await loadMatches();
      
      // Find all active matches
      const activeMatches = matches.filter((m) => m.status === 'active');

      // Check if there are active matches
      if (activeMatches.length === 0) {
        return interaction.reply({
          content: '❌ There are no active matches to close!',
          ephemeral: true,
        });
      }

      const guild = interaction.guild;
      let closedCount = 0;
      let channelsClosedCount = 0;

      // Process each active match
      for (const match of activeMatches) {
        // Mark match as force closed without MMR changes
        match.status = 'force_closed';
        match.forceClosedAt = new Date().toISOString();
        match.forceClosedReason = 'Force ended by administrator';
        closedCount++;

        // Try to delete the match channel
        try {
          if (match.channelId) {
            const channel = await guild.channels.fetch(match.channelId).catch(() => null);
            if (channel) {
              await channel.delete();
              channelsClosedCount++;
              console.log(`[FORCE_END] Deleted match channel: ${match.channelId}`);
            }
          }
        } catch (error) {
          console.error(`[FORCE_END] Error deleting channel ${match.channelId}:`, error);
        }
      }

      // Save updated matches
      await saveMatches(matches);

      return interaction.reply({
        content: `✅ Force ended **${closedCount}** active match(es)!\n\n📍 Closed **${channelsClosedCount}** match channel(s).\n\nAll teams have been disconnected from their matches. Their MMR remains unchanged.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error force ending matches:', error);
      return interaction.reply({
        content: '❌ Error force ending matches!',
        ephemeral: true,
      });
    }
  },
};
