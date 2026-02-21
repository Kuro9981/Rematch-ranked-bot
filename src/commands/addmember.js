const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmember')
    .setDescription('Add a member to a team (Captain only)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to add').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name')
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const teamName = interaction.options.getString('team');
    const teams = await loadTeams();

    if (!teams[teamName]) {
      return interaction.reply({
        content: `❌ Team **${teamName}** does not exist!`,
        ephemeral: true,
      });
    }

    // Check if user is captain
    if (teams[teamName].captain !== interaction.user.id) {
      return interaction.reply({
        content: `❌ Only the captain of **${teamName}** can add members!`,
        ephemeral: true,
      });
    }

    // Check if user is already in team
    if (teams[teamName].members.includes(user.id)) {
      return interaction.reply({
        content: `❌ <@${user.id}> is already in **${teamName}**!`,
        ephemeral: true,
      });
    }

    teams[teamName].members.push(user.id);
    await saveTeams(teams);

    interaction.reply({
      content: `✅ <@${user.id}> has been added to **${teamName}**!`,
      ephemeral: false,
    });
  },
};
