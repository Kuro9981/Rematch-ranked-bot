const { ChannelType } = require('discord.js');
const { saveMatches, loadMatches } = require('./database');

/**
 * Create a match channel with proper permissions
 * @param {Guild} guild - Discord Guild
 * @param {Object} team1 - First team object (teamName, captainId, mmr)
 * @param {Object} team2 - Second team object (teamName, captainId, mmr)
 * @param {Boolean} autoMatched - Whether this is an auto-matched game
 * @returns {Promise<Object>} { matchChannel, match }
 */
async function createMatchChannel(guild, team1, team2, autoMatched = false) {
  try {
    // Create private channel for the match
    const channelName = `match-${team1.teamName.toLowerCase()}-vs-${team2.teamName.toLowerCase()}`.substring(0, 100);
    
    const matchChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: team1.captainId,
          allow: ['ViewChannel', 'SendMessages'],
        },
        {
          id: team2.captainId,
          allow: ['ViewChannel', 'SendMessages'],
        },
      ],
    });

    // Create match object
    const matches = await loadMatches();
    const match = {
      id: `match_${Date.now()}`,
      team1: team1.teamName,
      team2: team2.teamName,
      team1Captain: team1.captainId,
      team2Captain: team2.captainId,
      team1MMR: team1.mmr,
      team2MMR: team2.mmr,
      channelId: matchChannel.id,
      status: 'active',
      winner: null,
      confirmations: [],
      createdAt: new Date().toISOString(),
      autoMatched: autoMatched,
    };

    matches.push(match);
    await saveMatches(matches);

    return { matchChannel, match };
  } catch (error) {
    console.error('Error creating match channel:', error);
    throw error;
  }
}

/**
 * Send match info to the match channel
 * @param {Channel} matchChannel - The match channel
 * @param {Object} team1 - First team object
 * @param {Object} team2 - Second team object
 * @param {Boolean} isAutoMatched - Whether this is an auto-matched game
 */
async function sendMatchInfo(matchChannel, team1, team2, isAutoMatched = false) {
  try {
    const mmrDiff = Math.abs(team1.mmr - team2.mmr);
    const autoTag = isAutoMatched ? '🤖 **AUTO-MATCHED!**\n\n' : '🎮 **MATCH START!**\n\n';
    
    const matchInfo = `${autoTag}🔵 **${team1.teamName}** (${team1.mmr} MMR) vs 🔴 **${team2.teamName}** (${team2.mmr} MMR)`;

    await matchChannel.send({
      embeds: [
        {
          title: '⚔️ Match Started',
          description: matchInfo,
          fields: [
            {
              name: '📊 MMR Difference',
              value: `${mmrDiff} points`,
              inline: false,
            },
            {
              name: '💬 Instructions',
              value: 'Both captains must use `/win` command to confirm the winner and finalize the match results.',
              inline: false,
            },
          ],
          color: 0xff0000,
          timestamp: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error('Error sending match info:', error);
  }
}

/**
 * Notify captains via DM
 * @param {Client} client - Discord client
 * @param {Object} team1 - First team object
 * @param {Object} team2 - Second team object
 * @param {String} channelId - Match channel ID
 */
async function notifyCaptains(client, team1, team2, channelId) {
  try {
    const team1User = await client.users.fetch(team1.captainId).catch(() => null);
    const team2User = await client.users.fetch(team2.captainId).catch(() => null);

    if (team1User) {
      team1User
        .send(
          `🎮 **Your team ${team1.teamName} has been matched!**\n\n🆚 vs **${team2.teamName}** (${team2.mmr} MMR)\n📍 <#${channelId}>`
        )
        .catch(() => {});
    }

    if (team2User) {
      team2User
        .send(
          `🎮 **Your team ${team2.teamName} has been matched!**\n\n🆚 vs **${team1.teamName}** (${team1.mmr} MMR)\n📍 <#${channelId}>`
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error('Error notifying captains:', error);
  }
}

module.exports = {
  createMatchChannel,
  sendMatchInfo,
  notifyCaptains,
};
