const {
  loadTeams,
  loadAutoQueue,
  saveAutoQueue,
  loadQueueConfig,
} = require('../utils/database');
const { findAllMatches, getQueueStatus } = require('../utils/queueMatcher');
const { createMatchChannel, sendMatchInfo, notifyCaptains } = require('../utils/matchManager');
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { addMatch } = require('./activeMatches');

// Store polling intervals per guild
const pollingIntervals = new Map();

/**
 * Start the queue polling system for a guild
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID to start polling for
 */
async function startQueuePolling(client, guildId) {
  if (pollingIntervals.has(guildId)) return; // Already polling

  const polling = setInterval(async () => {
    try {
      const queueConfig = await loadQueueConfig(guildId);

      // Skip if queue not configured
      if (!queueConfig.enabled || !queueConfig.queueChannelId) {
        return;
      }

      const queue = await loadAutoQueue(guildId);
      if (queue.length === 0) return;

      // Find all possible matches
      const matches = findAllMatches(queue);

      // Process matches
      if (matches.length > 0) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        for (const [team1, team2] of matches) {
          await createAutoMatch(guild, team1, team2, queueConfig, client);
        }

        // Remove matched teams from queue
        const matchedTeams = new Set();
        matches.forEach(([t1, t2]) => {
          matchedTeams.add(t1.teamName);
          matchedTeams.add(t2.teamName);
        });

        const newQueue = queue.filter((t) => !matchedTeams.has(t.teamName));
        await saveAutoQueue(guildId, newQueue);
      }

      // Update queue display
      await updateQueueDisplay(client, guildId, queueConfig, queue);
    } catch (error) {
      console.error('Error in queue polling:', error);
    }
  }, 3000); // Poll every 3 seconds

  pollingIntervals.set(guildId, polling);
}

/**
 * Stop queue polling for a guild
 * @param {string} guildId - Guild ID
 */
function stopQueuePolling(guildId) {
  if (pollingIntervals.has(guildId)) {
    clearInterval(pollingIntervals.get(guildId));
    pollingIntervals.delete(guildId);
  }
}

/**
 * Create a match from queue teams
 * @param {Guild} guild - Discord Guild
 * @param {Object} team1 - First team object
 * @param {Object} team2 - Second team object
 * @param {Object} queueConfig - Queue configuration
 * @param {Client} client - Discord client
 */
async function createAutoMatch(guild, team1, team2, queueConfig, client) {
  try {
    // Get queue channel to extract category
    const queueChannel = guild.channels.cache.get(queueConfig.queueChannelId);
    const categoryId = queueChannel?.parent?.id || null;

    // Create match channel and match data
    const { matchChannel, match } = await createMatchChannel(guild, team1, team2, true, categoryId);

    // Create vote data for memory storage (same format as setup voting)
    const voteData = {
      matchId: match.id,
      team1: team1.teamName,
      team2: team2.teamName,
      channelId: matchChannel.id,
      messageId: null, // Will be set when message is sent
      votes: {},
      createdAt: new Date().toISOString(),
    };

    // Save to active matches
    addMatch(match.id, voteData);
    console.log('[AUTO_MATCH] Vote data saved for matchId:', match.id);

    // Send match info to channel with voting buttons and vote data
    await sendMatchInfo(matchChannel, team1, team2, true, match, voteData);

    // Notify captains via DM
    await notifyCaptains(client, team1, team2, matchChannel.id);

    // Notify in queue channel
    if (queueChannel) {
      await queueChannel.send({
        embeds: [
          {
            title: '✅ Match Found!',
            description: `**${team1.teamName}** (${team1.mmr} MMR) vs **${team2.teamName}** (${team2.mmr} MMR)`,
            color: 0x00ff00,
            timestamp: new Date(),
          },
        ],
      });
    }
  } catch (error) {
    console.error('Error creating auto match:', error);
  }
}

/**
 * Update the queue display message in the channel
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID
 * @param {Object} queueConfig - Queue configuration
 * @param {Array} queue - Current queue
 */
async function updateQueueDisplay(client, guildId, queueConfig, queue) {
  try {
    if (!queueConfig.queueChannelId || !queueConfig.queueMessageId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(queueConfig.queueChannelId);
    if (!channel) return;

    const message = await channel.messages.fetch(queueConfig.queueMessageId).catch(() => null);
    if (!message) return;

    const queueStatus = getQueueStatus(queue);

    // Build queue list
    let queueList = '';
    if (queueStatus.length === 0) {
      queueList = 'No teams in queue. Click the buttons below to join!';
    } else {
      queueList = queueStatus
        .map(
          (team, index) =>
            `${index + 1}. **${team.teamName}** - ${team.mmr} MMR (⏱️ ${team.waitTimeMinutes}m, 📊 ±${team.currentRange})`
        )
        .join('\n');
    }

    // Create buttons
    const joinButton = new ButtonBuilder()
      .setCustomId('autojoinqueue_join')
      .setLabel('➕ Join Queue')
      .setStyle(ButtonStyle.Success);

    const leaveButton = new ButtonBuilder()
      .setCustomId('autojoinqueue_leave')
      .setLabel('❌ Leave Queue')
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder()
      .addComponents(joinButton, leaveButton);

    const closeButton = new ButtonBuilder()
      .setCustomId('autojoinqueue_close')
      .setLabel('🔒 Close Queue')
      .setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder()
      .addComponents(closeButton);

    await message.edit({
      embeds: [
        {
          title: '📋 Match Queue',
          description: queueList,
          color: 0x0099ff,
          fields: [
            {
              name: '⏳ Status',
              value: queueStatus.length === 0 ? 'Waiting for teams...' : 'Finding matches...',
              inline: false,
            },
            {
              name: '👥 Teams in Queue',
              value: queueStatus.length.toString(),
              inline: true,
            },
            {
              name: '🤖 System',
              value: 'Auto-polling every 3 seconds',
              inline: true,
            },
          ],
          timestamp: new Date(),
        },
      ],
      components: [row1, row2],
    });
  } catch (error) {
    console.error('Error updating queue display:', error);
  }
}

/**
 * Initialize queue polling for all guilds when bot starts
 * @param {Client} client - Discord client
 */
async function initializeQueuePolling(client) {
  try {
    for (const guild of client.guilds.cache.values()) {
      startQueuePolling(client, guild.id);
    }
  } catch (error) {
    console.error('Error initializing queue polling:', error);
  }
}

module.exports = {
  startQueuePolling,
  stopQueuePolling,
  initializeQueuePolling,
  createAutoMatch,
  updateQueueDisplay,
};
