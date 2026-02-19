const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, loadMatches } = require('../utils/database');

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
    const teamName = interaction.options.getString('team');
    const teams = loadTeams();
    const matches = loadMatches();
    let selectedTeam = null;

    if (teamName) {
      selectedTeam = teams[teamName];
      if (!selectedTeam) {
        return interaction.reply({
          content: `❌ Team **${teamName}** does not exist!`,
          ephemeral: true,
        });
      }
    } else {
      // Find team where user is member
      for (const [name, team] of Object.entries(teams)) {
        if (team.members.includes(interaction.user.id)) {
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
        (m.team1 === selectedTeam.name || m.team2 === selectedTeam.name) &&
        m.status === 'completed'
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
    historyText += 'Date                 Result          Opponent\n';
    historyText += '─'.repeat(70) + '\n';

    teamMatches.slice(0, 10).forEach((match) => {
      const date = new Date(match.completedAt).toLocaleDateString();
      const result = match.winner === selectedTeam.name ? '✅ WIN' : '❌ LOSS';
      const opponent = match.winner === selectedTeam.name ? match.team2 : match.team1;

      const dateStr = date.padEnd(21);
      const resultStr = result.padEnd(16);
      historyText += `${dateStr}${resultStr}${opponent}\n`;
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
