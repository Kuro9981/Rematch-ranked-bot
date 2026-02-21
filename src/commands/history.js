const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadMatches, findTeamByName } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Show match history for a team')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name (defaults to your team)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const teamNameOption = interaction.options.getString('team');
    const teams = await loadTeams();
    const matches = await loadMatches();
    let selectedTeam = null;
    let selectedTeamKey = null;

    if (teamNameOption) {
      const result = findTeamByName(teams, teamNameOption);
      if (!result) {
        return interaction.reply({
          content: `❌ Team **${teamNameOption}** does not exist!`,
          ephemeral: true,
        });
      }
      selectedTeamKey = result.key;
      selectedTeam = result.data;
    } else {
      // Find team where user is member
      for (const [key, team] of Object.entries(teams)) {
        if (team.members.includes(interaction.user.id)) {
          selectedTeamKey = key;
          selectedTeam = team;
          break;
        }
      }

      if (!selectedTeam) {
        return interaction.reply({
          content: '❌ You are not part of any team!',
          ephemeral: true,
        });
      }
    }

    // Get team's completed matches
    const teamMatches = matches.filter(
      (m) =>
        (m.team1 === selectedTeamKey || m.team2 === selectedTeamKey) &&
        m.completedAt
    );

    if (teamMatches.length === 0) {
      return interaction.reply({
        content: `📜 **${selectedTeam.name}** has no match history yet!`,
        ephemeral: true,
      });
    }

    // Sort by date (newest first)
    teamMatches.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    );

    // Build history text
    let historyText = '```\n';
    historyText += 'Date                 Result          Opponent            MMR Change\n';
    historyText += '─'.repeat(80) + '\n';

    teamMatches.slice(0, 10).forEach((match) => {
      const date = new Date(match.completedAt).toLocaleDateString();
      const isWinner = match.winner === selectedTeamKey;
      const result = isWinner ? '✅ WIN' : '❌ LOSS';
      const opponent = isWinner ? match.team2Name : match.team1Name;
      const mmrChange = isWinner ? match.winnerMMRChange : match.loserMMRChange;
      const mmrStr = `${mmrChange > 0 ? '+' : ''}${mmrChange}`;

      const dateStr = date.padEnd(21);
      const resultStr = result.padEnd(16);
      const opponentStr = opponent.substring(0, 20).padEnd(20);
      historyText += `${dateStr}${resultStr}${opponentStr}${mmrStr}\n`;
    });

    historyText += '```';

    interaction.reply({
      embeds: [
        {
          title: `📜 Match History - ${selectedTeam.name}`,
          description: historyText,
          footer: { text: `Total matches: ${teamMatches.length}` },
          color: 0x0099ff,
          timestamp: new Date(),
        },
      ],
      ephemeral: false,
    });
  },
};
