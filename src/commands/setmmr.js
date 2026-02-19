const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmmr')
    .setDescription('Manually set MMR for a team (Admin only)')
    .addStringOption((option) =>
      option.setName('team').setDescription('Team name').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('value').setDescription('New MMR value').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const mmrValue = interaction.options.getInteger('value');
    const teams = loadTeams();

    if (!teams[teamName]) {
      return interaction.reply({
        content: `❌ Team **${teamName}** does not exist!`,
        ephemeral: true,
      });
    }

    const oldMMR = teams[teamName].mmr;
    teams[teamName].mmr = Math.max(0, mmrValue); // Ensure MMR doesn't go below 0

    saveTeams(teams);

    interaction.reply({
      content: `✅ **${teamName}** MMR updated!\n📊 Old MMR: **${oldMMR}** → New MMR: **${teams[teamName].mmr}**`,
      ephemeral: false,
    });
  },
};
