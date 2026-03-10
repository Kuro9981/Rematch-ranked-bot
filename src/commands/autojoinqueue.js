const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadAutoQueue, saveAutoQueue, loadQueueConfig, loadMatches, saveMatches } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autojoinqueue')
    .setDescription('Join the automatic match queue (Team members only)')
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

    // Check if user is captain or team member
    const team = teams[teamName];
    const isCaptain = team.captain === interaction.user.id;
    const isMember = team.members && team.members.includes(interaction.user.id);

    if (!isCaptain && !isMember) {
      return interaction.reply({
        content: `❌ You must be a member of **${teamName}** to queue!`,
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

    // Check if team has an active match
    const matches = await loadMatches();
    const activeMatch = matches.find(
      (m) => (m.team1 === teamName || m.team2 === teamName) && m.status === 'active'
    );

    if (activeMatch) {
      // Verify that the match channel still exists
      try {
        const guild = interaction.guild;
        const matchChannel = await guild.channels.fetch(activeMatch.channelId).catch(() => null);
        
        // If the channel was deleted, the match is effectively closed
        if (!matchChannel) {
          // Update match status to completed since its channel is gone
          activeMatch.status = 'completed';
          activeMatch.completedAt = new Date().toISOString();
          await saveMatches(matches);
          console.log(`[AUTOJOINQUEUE] Match ${activeMatch.id} marked as completed (channel was deleted)`);
        } else {
          // Channel still exists, match is truly active
          return interaction.reply({
            content: `❌ **${teamName}** is currently in an active match! Finish the match before joining the queue.`,
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error('Error checking match channel:', error);
        // If there's an error, allow the team to join anyway as a fail-safe
      }
    }

    // Add to queue - use captain ID or current user ID
    const queueEntry = {
      teamName,
      captainId: isCaptain ? interaction.user.id : team.captain,
      mmr: team.mmr,
      addedAt: Date.now(),
      waitTime: 0,
    };

    autoQueue.push(queueEntry);
    await saveAutoQueue(guildId, autoQueue);

    const userRole = isCaptain ? 'Captain' : 'Team Member';
    return interaction.reply({
      content: `✅ **${teamName}** joined the queue! (Added by ${userRole})\n\n📊 Current MMR: ${team.mmr}\n⏳ Finding opponents...`,
      ephemeral: true,
    });
  },
};
