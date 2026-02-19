const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { loadTeams, loadQueue, saveQueue, loadMatches, saveMatches } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Queue your team for a match (Captain only)')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name')
        .setRequired(true)
    ),
  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const teams = loadTeams();
    const queue = loadQueue();

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

    // Check if team is already in queue
    if (queue.some((q) => q.teamName === teamName)) {
      return interaction.reply({
        content: `❌ **${teamName}** is already in queue!`,
        ephemeral: true,
      });
    }

    // Add to queue
    queue.push({
      teamName,
      captainId: interaction.user.id,
      mmr: teams[teamName].mmr,
      addedAt: new Date().toISOString(),
    });

    saveQueue(queue);

    // Check if we have 2 teams to match
    if (queue.length >= 2) {
      await startMatch(interaction, queue, teams);
    } else {
      interaction.reply({
        content: `✅ **${teamName}** queued for a match!\n⏳ Waiting for opponents... (${queue.length}/2 teams)`,
        ephemeral: false,
      });
    }
  },
};

async function startMatch(interaction, queue, teams) {
  const team1 = queue[0];
  const team2 = queue[1];

  // Create private channel for the match
  const guild = interaction.guild;

  try {
    const matchChannel = await guild.channels.create({
      name: `match-${team1.teamName.toLowerCase()}-vs-${team2.teamName.toLowerCase()}`,
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

    // Store match data
    const matches = require('../utils/database').loadMatches();
    const match = {
      id: `match_${Date.now()}`,
      team1: team1.teamName,
      team2: team2.teamName,
      team1Captain: team1.captainId,
      team2Captain: team2.captainId,
      channelId: matchChannel.id,
      status: 'active',
      winner: null,
      confirmations: [],
      createdAt: new Date().toISOString(),
    };

    matches.push(match);
    require('../utils/database').saveMatches(matches);

    // Remove teams from queue
    queue.shift();
    queue.shift();
    require('../utils/database').saveQueue(queue);

    // Send match info to channel
    const matchInfo = `🎮 **MATCH START!**\n\n`;
    matchInfo += `🔵 **${team1.teamName}** (${team1.mmr} MMR) vs 🔴 **${team2.teamName}** (${team2.mmr} MMR)\n\n`;
    matchInfo += `Both captains must use \`/win\` command to report the winner and confirm the result.`;

    await matchChannel.send({
      embeds: [
        {
          title: '⚔️ Match Started',
          description: matchInfo,
          color: 0xff0000,
          timestamp: new Date(),
        },
      ],
    });

    // Notify captains
    await interaction.client.users
      .fetch(team1.captainId)
      .then((user) =>
        user.send(
          `🎮 Your team **${team1.teamName}** is now in a match against **${team2.teamName}**!\n<#${matchChannel.id}>`
        )
      )
      .catch(() => {});

    await interaction.client.users
      .fetch(team2.captainId)
      .then((user) =>
        user.send(
          `🎮 Your team **${team2.teamName}** is now in a match against **${team1.teamName}**!\n<#${matchChannel.id}>`
        )
      )
      .catch(() => {});
  } catch (error) {
    console.error('Error creating match channel:', error);
    interaction.reply({
      content: '❌ Error creating match channel!',
      ephemeral: true,
    });
  }
}
