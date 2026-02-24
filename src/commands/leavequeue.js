const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadAutoQueue, saveAutoQueue } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leavequeue')
    .setDescription('Leave the automatic match queue (Team members only)')
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
        content: `❌ You must be a member of **${teamName}** to leave the queue!`,
        ephemeral: true,
      });
    }

    const autoQueue = await loadAutoQueue(guildId);

    // Check if team is in queue
    const teamIndex = autoQueue.findIndex((q) => q.teamName === teamName);
    if (teamIndex === -1) {
      return interaction.reply({
        content: `❌ **${teamName}** is not in queue!`,
        ephemeral: true,
      });
    }

    // Remove from queue
    autoQueue.splice(teamIndex, 1);
    await saveAutoQueue(guildId, autoQueue);

    const userRole = isCaptain ? 'Captain' : 'Team Member';
    return interaction.reply({
      content: `✅ **${teamName}** left the queue! (Removed by ${userRole})`,
    });
  },
};
