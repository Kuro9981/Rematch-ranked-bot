const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams, loadRanks } = require('../utils/database');
const { getRankFromMMR } = require('../utils/mmr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createteam')
    .setDescription('Create a new team')
    .addStringOption((option) =>
      option.setName('name').setDescription('Team name').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const teamName = interaction.options.getString('name');
    const teams = loadTeams();
    const ranks = loadRanks();

    if (teams[teamName]) {
      return interaction.reply({
        content: `❌ Team **${teamName}** already exists!`,
        ephemeral: true,
      });
    }

    teams[teamName] = {
      name: teamName,
      mmr: 1000,
      members: [],
      captain: null,
      createdAt: new Date().toISOString(),
      wins: 0,
      losses: 0,
      matches: [],
    };

    saveTeams(teams);

    const rank = getRankFromMMR(teams[teamName].mmr, ranks);
    interaction.reply({
      content: `✅ Team **${teamName}** created successfully!\n📊 Starting MMR: **${teams[teamName].mmr}**\n🏆 Rank: **${rank.name}**`,
      ephemeral: false,
    });
  },
};
