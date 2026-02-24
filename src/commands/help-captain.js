const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help-captain')
    .setDescription('Show captain commands (Admin and Captains only)'),

  async execute(interaction) {
    try {
      // Check if user is admin or captain
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      
      // For now, we'll allow all to see this help, but mention admin access
      const embed = new EmbedBuilder()
        .setTitle('👨‍💼 Captain Commands')
        .setDescription('Commands available to team captains and administrators')
        .addFields(
          {
            name: '🎮 Team Management',
            value: '`/createteam <name>` - Create a new team\n' +
                   '`/addmember <team> <player>` - Add a player to your team\n' +
                   '`/removemember <team> <player>` - Remove a player from your team\n' +
                   '`/setcaptain <team> <player>` - Transfer captain role\n' +
                   '`/teaminfo <team>` - View team information',
            inline: false,
          },
          {
            name: '📊 Team Statistics',
            value: '`/setmmr <team> <mmr>` - Set team MMR (Admin only)\n' +
                   '`/rank <team>` - View team rank and MMR\n' +
                   '`/leaderboard` - View global leaderboard\n' +
                   '`/history [team]` - View match history',
            inline: false,
          },
          {
            name: '🎯 Queue Operations',
            value: '`/autojoinqueue <team>` - Join the automatic queue (Team members)\n' +
                   '`/leavequeue <team>` - Leave current queue (Team members)\n' +
                   '`/teamqueue <team>` - Check which queue your team is in',
            inline: false,
          },
          {
            name: '⚔️ Match Management',
            value: '`/win <team>` - Report a match victory\n' +
                   '`/setup` - Interactive match setup and configuration',
            inline: false,
          },
          {
            name: '📚 Utilities',
            value: '`/help` - Show general help\n' +
                   '`/help-captain` - Show this command list\n' +
                   '`/help-admin` - Show admin-only commands (Admins only)',
            inline: false,
          }
        )
        .setColor(0x0099ff)
        .setFooter({ text: `Requested by ${interaction.user.username}${isAdmin ? ' (Admin)' : ''}` })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error in help-captain command:', error);
      return interaction.reply({
        content: '❌ Error displaying help!',
        ephemeral: true,
      });
    }
  },
};
