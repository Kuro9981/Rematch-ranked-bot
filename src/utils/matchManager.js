const { ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { saveMatches, loadMatches, loadTeams, saveTeams } = require('./database');
const { calculateMMRChange } = require('./mmr');

/**
 * Create a match channel with proper permissions
 * @param {Guild} guild - Discord Guild
 * @param {Object} team1 - First team object (teamName, captainId, mmr)
 * @param {Object} team2 - Second team object (teamName, captainId, mmr)
 * @param {Boolean} autoMatched - Whether this is an auto-matched game
 * @param {String} categoryId - Category ID to create channel in (optional)
 * @returns {Promise<Object>} { matchChannel, match }
 */
async function createMatchChannel(guild, team1, team2, autoMatched = false, categoryId = null) {
  try {
    // Create private channel for the match
    const channelName = `match-${team1.teamName.toLowerCase()}-vs-${team2.teamName.toLowerCase()}`.substring(0, 100);
    
    const channelOptions = {
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
    };

    // Add category if provided
    if (categoryId) {
      channelOptions.parent = categoryId;
    }
    
    const matchChannel = await guild.channels.create(channelOptions);

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
 * Send match info to the match channel with voting buttons (aligned with setup)
 * @param {Channel} matchChannel - The match channel
 * @param {Object} team1 - First team object
 * @param {Object} team2 - Second team object
 * @param {Boolean} isAutoMatched - Whether this is an auto-matched game
 * @param {Object} match - Match data object
 * @param {Object} voteData - Vote data for memory storage
 */
async function sendMatchInfo(matchChannel, team1, team2, isAutoMatched = false, match = null, voteData = null) {
  try {
    const mmrDiff = Math.abs(team1.mmr - team2.mmr);
    let autoTag = '';
    
    if (isAutoMatched) {
      autoTag = '🤖 **AUTO-MATCHED!**\n\n';
    }
    
    const matchInfo = `${autoTag}🔵 **${team1.teamName}** (${team1.mmr} MMR) vs 🔴 **${team2.teamName}** (${team2.mmr} MMR)`;

    // Create voting buttons if match object is provided (same as setup)
    let components = [];
    if (match && voteData) {
      const matchId = match.id;
      const team1Name = team1.teamName;
      const team2Name = team2.teamName;

      const voteTeam1Button = new ButtonBuilder()
        .setCustomId(`vote_${matchId}_${team1Name}`)
        .setLabel(`🔵 Vote ${team1Name}`)
        .setStyle(ButtonStyle.Primary);
      
      const voteTeam2Button = new ButtonBuilder()
        .setCustomId(`vote_${matchId}_${team2Name}`)
        .setLabel(`🔴 Vote ${team2Name}`)
        .setStyle(ButtonStyle.Danger);
      
      components = [new ActionRowBuilder().addComponents(voteTeam1Button, voteTeam2Button)];
    }

    await matchChannel.send({
      embeds: [
        {
          title: '⚔️ MATCH IN PROGRESS!',
          description: matchInfo,
          fields: [
            {
              name: team1.teamName,
              value: `📊 MMR: ${team1.mmr}`,
              inline: true,
            },
            {
              name: team2.teamName,
              value: `📊 MMR: ${team2.mmr}`,
              inline: true,
            },
            {
              name: '🗳️ Winner Vote',
              value: 'Click the button of the winning team!\n(Both captains must vote)',
              inline: false,
            },
            {
              name: '📊 MMR Difference',
              value: `${mmrDiff} points`,
              inline: false,
            },
          ],
          color: 0xFFA500,
          timestamp: new Date(),
          footer: { text: `Match ID: ${match?.id}` },
        },
      ],
      components: components,
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
