const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadAutoQueue, saveAutoQueue, loadQueueConfig } = require('../utils/database');

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
