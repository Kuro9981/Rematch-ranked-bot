const { SlashCommandBuilder } = require('discord.js');
const { loadTeams, findTeamByName } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teaminfo')
    .setDescription('Get detailed information about a team')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name')
        .setRequired(true)
    ),
  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const teams = await loadTeams();

    const result = findTeamByName(teams, teamName);
    if (!result) {
      return interaction.reply({
        content: `❌ Team **${teamName}** does not exist!`,
        ephemeral: true,
      });
    }

    const team = result.data;
    const createdDate = new Date(team.createdAt).toLocaleDateString();

    let memberList = '';
    if (team.members.length === 0) {
      memberList = 'No members yet';
    } else {
      memberList = team.members.map((id) => `<@${id}>`).join(', ');
    }

    const captainName = team.captain ? `<@${team.captain}>` : 'Not assigned';

    let description = `**Team Name:** ${team.name}\n`;
    description += `**Captain:** ${captainName}\n`;
    description += `**Members:** ${memberList}\n`;
    description += `**MMR:** ${team.mmr}\n`;
    description += `**Record:** ${team.wins}W - ${team.losses}L\n`;
    description += `**Created:** ${createdDate}`;

    interaction.reply({
      embeds: [
        {
          title: `🏆 ${team.name}`,
          description,
          color: 0x0099ff,
          timestamp: new Date(),
        },
      ],
      ephemeral: false,
    });
  },
};
