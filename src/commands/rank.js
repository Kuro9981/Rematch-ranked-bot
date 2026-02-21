const { SlashCommandBuilder } = require('discord.js');
const { loadTeams } = require('../utils/database');
const { getRankFromMMR, getProgressToNextRank } = require('../utils/mmr');
const { loadRanks } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your team ranking')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name (defaults to your team)')
        .setRequired(false)
    ),
  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const teams = await loadTeams();
    const ranks = await loadRanks();
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

    const rank = getRankFromMMR(selectedTeam.mmr, ranks);
    const { currentRank, nextRank, progress } = getProgressToNextRank(
      selectedTeam.mmr,
      ranks
    );

    let description = `**${selectedTeam.name}**\n\n`;
    description += `📊 MMR: **${selectedTeam.mmr}**\n`;
    description += `🏆 Rank: **${rank.name}**\n`;
    description += `✅ Wins: **${selectedTeam.wins}** | ❌ Losses: **${selectedTeam.losses}**\n`;

    if (nextRank) {
      description += `\n📈 Progress to **${nextRank.name}**: ${progress}%\n`;
      description += `(${selectedTeam.mmr} / ${nextRank.minMMR} MMR)`;
    } else {
      description += '\n🌟 You are at maximum rank!';
    }

    interaction.reply({
      embeds: [
        {
          title: '🏅 Team Ranking',
          description,
          color: rank.color || 0x00ff00,
          timestamp: new Date(),
        },
      ],
      ephemeral: false,
    });
  },
};
