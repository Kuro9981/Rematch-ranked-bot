const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemember')
    .setDescription('Remove a member from a team (Captain only)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to remove').setRequired(true)
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
    const teams = loadTeams();

    if (!teams[teamName]) {
      return interaction.reply({
        content: `❌ Team **${teamName}** does not exist!`,
        ephemeral: true,
      });
    }

    // Check if user is captain
    if (teams[teamName].captain !== interaction.user.id) {
      return interaction.reply({
        content: `❌ Only the captain of **${teamName}** can remove members!`,
        ephemeral: true,
      });
    }

    // Check if user is in team
    if (!teams[teamName].members.includes(user.id)) {
      return interaction.reply({
        content: `❌ <@${user.id}> is not in **${teamName}**!`,
        ephemeral: true,
      });
    }

    // Cannot remove captain
    if (teams[teamName].captain === user.id) {
      return interaction.reply({
        content: `❌ Cannot remove the team captain!`,
        ephemeral: true,
      });
    }

    teams[teamName].members = teams[teamName].members.filter((id) => id !== user.id);
    saveTeams(teams);

    interaction.reply({
      content: `✅ <@${user.id}> has been removed from **${teamName}**!`,
      ephemeral: false,
    });
  },
};
