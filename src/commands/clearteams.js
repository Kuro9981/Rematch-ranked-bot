const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { loadTeams, saveTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearteams')
    .setDescription('Delete all teams (Admin only - requires confirmation)')
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Type true to confirm deletion of ALL teams')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const confirm = interaction.options.getBoolean('confirm');

    try {
      if (!confirm) {
        return interaction.reply({
          content: '❌ Deletion cancelled. Please set the confirm option to `true` to proceed.',
          ephemeral: true,
        });
      }

      const teams = await loadTeams();
      const teamCount = Object.keys(teams).length;

      if (teamCount === 0) {
        return interaction.reply({
          content: '✅ No teams to delete. Database is already empty.',
          ephemeral: true,
        });
      }

      // Clear all teams
      await saveTeams({});

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Teams Cleared')
        .setDescription(`All **${teamCount}** team(s) have been permanently deleted.`)
        .addFields(
          {
            name: '⚠️ Action',
            value: 'Deleted all teams from the database',
            inline: false,
          },
          {
            name: '📊 Teams Removed',
            value: teamCount.toString(),
            inline: true,
          },
          {
            name: '👤 Administrator',
            value: `<@${interaction.user.id}>`,
            inline: true,
          }
        )
        .setColor(0xff6b6b)
        .setFooter({ text: 'This action cannot be undone' })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error clearing teams:', error);
      return interaction.reply({
        content: '❌ Error clearing teams!',
        ephemeral: true,
      });
    }
  },
};
