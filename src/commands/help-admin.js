const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help-admin')
    .setDescription('Show admin-only commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🔐 Admin Commands')
        .setDescription('Commands available only to administrators')
        .addFields(
          {
            name: '📋 Queue Management',
            value: '`/queuesetup <channel>` - Setup a channel for automatic queue matching\n' +
                   '`/clearteams <confirm>` - Delete all teams from the database\n' +
                   '`/resetseason` - Reset all teams statistics (wins/losses/MMR)',
            inline: false,
          },
          {
            name: '⚙️ System Configuration',
            value: '`/setup` - Interactive setup for team creation and management\n' +
                   '`/queuesetup` - Configure automatic queue channel',
            inline: false,
          },
          {
            name: '📊 Database Commands',
            value: '`/clearteams` - Completely wipe all teams\n' +
                   '`/resetseason` - Reset season and team statistics',
            inline: false,
          },
          {
            name: '⚠️ Dangerous Operations',
            value: 'These commands require confirmation and will permanently modify data:\n' +
                   '• Deletion of all teams\n' +
                   '• Season reset (clears wins/losses/MMR)',
            inline: false,
          }
        )
        .setColor(0xff6b6b)
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error in help-admin command:', error);
      return interaction.reply({
        content: '❌ Error displaying help!',
        ephemeral: true,
      });
    }
  },
};
