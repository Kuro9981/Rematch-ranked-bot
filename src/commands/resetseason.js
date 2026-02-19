const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams, loadMatches, saveMatches, loadQueue, saveQueue } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetseason')
    .setDescription('Reset all team MMR for new season (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply();
    const teams = loadTeams();
    const matches = loadMatches();

    // Archive old matches and reset team stats
    Object.values(teams).forEach((team) => {
      team.mmr = 1000;
      team.wins = 0;
      team.losses = 0;
    });

    saveTeams(teams);

    // Clear queue
    saveQueue([]);

    interaction.editReply({
      content: `✅ Season reset complete!\n📊 All teams reset to 1000 MMR\n📜 ${matches.length} matches archived`,
      ephemeral: false,
    });
  },
};
