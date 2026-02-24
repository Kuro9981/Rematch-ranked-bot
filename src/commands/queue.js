const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadQueue, saveQueue } = require('../utils/database');
const { createMatchChannel, sendMatchInfo, notifyCaptains } = require('../utils/matchManager');

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
    const teams = await loadTeams();
    const queue = await loadQueue();

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

    await saveQueue(queue);

    // Check if we have 2 teams to match
    if (queue.length >= 2) {
      await startMatch(interaction, queue, teams, saveQueue);
    } else {
      interaction.reply({
        content: `✅ **${teamName}** queued for a match!\n⏳ Waiting for opponents... (${queue.length}/2 teams)`,
        ephemeral: false,
      });
    }
  },
};

async function startMatch(interaction, queue, teams, saveQueue) {
  const team1 = queue[0];
  const team2 = queue[1];

  const guild = interaction.guild;

  try {
    // Create match channel and match data
    const { matchChannel, match } = await createMatchChannel(guild, team1, team2);

    // Send match info to channel
    await sendMatchInfo(matchChannel, team1, team2, false);

    // Remove teams from queue
    queue.shift();
    queue.shift();
    await saveQueue(queue);

    // Notify captains via DM
    await notifyCaptains(interaction.client, team1, team2, matchChannel.id);

    await interaction.reply({
      content: `✅ Match started! **${team1.teamName}** (${team1.mmr} MMR) vs **${team2.teamName}** (${team2.mmr} MMR)\n📍 <#${matchChannel.id}>`,
      ephemeral: false,
    });
  } catch (error) {
    console.error('Error creating match channel:', error);
    interaction.reply({
      content: '❌ Error creating match channel!',
      ephemeral: true,
    });
  }
}

