const { SlashCommandBuilder } = require('discord.js');
const { loadMatches, saveMatches, loadTeams, saveTeams } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('win')
    .setDescription('Report a match win (Captain only)')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Your team name')
        .setRequired(true)
    ),
  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const matches = await loadMatches();
    const teams = await loadTeams();

    // Find active match for this channel
    const match = matches.find(
      (m) =>
        m.channelId === interaction.channelId && m.status === 'active' &&
        (m.team1 === teamName || m.team2 === teamName)
    );

    if (!match) {
      return interaction.reply({
        content: `❌ No active match found for **${teamName}** in this channel!`,
        ephemeral: true,
      });
    }

    // Check if user is captain of that team
    const isCaptain =
      (match.team1 === teamName && match.team1Captain === interaction.user.id) ||
      (match.team2 === teamName && match.team2Captain === interaction.user.id);

    if (!isCaptain) {
      return interaction.reply({
        content: `❌ Only the captain of **${teamName}** can report the win!`,
        ephemeral: true,
      });
    }

    // Add confirmation
    if (!match.confirmations.includes(interaction.user.id)) {
      match.confirmations.push(interaction.user.id);
    }

    match.winner = teamName;

    // If both captains confirmed
    if (match.confirmations.length === 2) {
      // Update MMR
      const winnerTeam = teams[match.winner];
      const loserTeam = teams[match.winner === match.team1 ? match.team2 : match.team1];

      const { winnerChange, loserChange } = calculateMMRChange(
        winnerTeam.mmr,
        loserTeam.mmr
      );

      winnerTeam.mmr += winnerChange;
      loserTeam.mmr = Math.max(0, loserTeam.mmr + loserChange);

      winnerTeam.wins++;
      loserTeam.losses++;

      // Mark match as completed
      match.status = 'completed';
      match.completedAt = new Date().toISOString();

      await saveTeams(teams);
      await saveMatches(matches);

      // Update match message
      const guild = interaction.guild;
      const channel = await guild.channels.fetch(match.channelId);

      const resultMessage = `✅ **MATCH COMPLETED!**\n\n`;
      resultMessage += `🏆 **${match.winner}** won!\n\n`;
      resultMessage += `**${match.team1}**: ${teams[match.team1].mmr} MMR (${winnerChange > 0 ? '+' : ''}${match.team1 === match.winner ? winnerChange : loserChange})\n`;
      resultMessage += `**${match.team2}**: ${teams[match.team2].mmr} MMR (${winnerChange > 0 ? '+' : ''}${match.team2 === match.winner ? winnerChange : loserChange})`;

      await channel.send({
        embeds: [
          {
            title: '⚔️ Match Ended',
            description: resultMessage,
            color: 0x00ff00,
            timestamp: new Date(),
          },
        ],
      });

      // Close channel after 1 minute
      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 60000);

      interaction.reply({
        content: `✅ Match result confirmed and recorded!`,
        ephemeral: false,
      });
    } else {
      saveMatches(matches);
      interaction.reply({
        content: `⏳ Win reported by **${teamName}**!\n⏳ Waiting for opponent confirmation... (1/2)`,
        ephemeral: false,
      });
    }
  },
};
