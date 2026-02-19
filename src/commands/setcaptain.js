const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadTeams, saveTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcaptain')
    .setDescription('Set a captain for a team (Admin only)')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to set as captain').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('team').setDescription('Team name').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
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

    teams[teamName].captain = user.id;
    if (!teams[teamName].members.includes(user.id)) {
      teams[teamName].members.push(user.id);
    }

    saveTeams(teams);

    interaction.reply({
      content: `✅ <@${user.id}> is now captain of **${teamName}**!`,
      ephemeral: false,
    });
  },
};
