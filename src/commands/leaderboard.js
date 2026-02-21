const { SlashCommandBuilder } = require('discord.js');
const { loadTeams } = require('../utils/database');
const { getRankFromMMR } = require('../utils/mmr');
const { loadRanks } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the team leaderboard'),
  async execute(interaction) {
    await interaction.deferReply();
    const teams = await loadTeams();
    const ranks = await loadRanks();

    if (Object.keys(teams).length === 0) {
      return interaction.editReply({
        content: '❌ No teams exist yet!',
        ephemeral: true,
      });
    }

    // Sort teams by MMR (descending)
    const sortedTeams = Object.values(teams).sort((a, b) => b.mmr - a.mmr);

    let leaderboardText = '```\n';
    leaderboardText += '#   Team Name                    MMR       W-L       Rank\n';
    leaderboardText += '─'.repeat(70) + '\n';

    sortedTeams.forEach((team, index) => {
      const rank = getRankFromMMR(team.mmr, ranks);
      const position = String(index + 1).padEnd(3);
      const name = team.name.padEnd(30);
      const mmr = String(team.mmr).padEnd(10);
      const record = `${team.wins}-${team.losses}`.padEnd(10);
      const rankName = rank.name;

      leaderboardText += `${position}${name}${mmr}${record}${rankName}\n`;
    });

    leaderboardText += '```';

    interaction.editReply({
      embeds: [
        {
          title: '🏆 Team Leaderboard',
          description: leaderboardText,
          color: 0xffd700,
          timestamp: new Date(),
        },
      ],
      ephemeral: false,
    });
  },
};
