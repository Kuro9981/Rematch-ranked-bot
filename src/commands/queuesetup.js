const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { loadQueueConfig, saveQueueConfig } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queuesetup')
    .setDescription('Setup a channel for automatic queue matching (Admin only)')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel where the queue will be displayed')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    try {
      // Save queue configuration
      const config = await loadQueueConfig(guildId);
      config.queueChannelId = channel.id;
      config.enabled = true;
      await saveQueueConfig(guildId, config);

      // Send initial queue message
      const queueMessage = await channel.send({
        embeds: [
          {
            title: '📋 Match Queue',
            description: 'No teams in queue. Use `/autojoinqueue` to join!',
            color: 0x0099ff,
            fields: [
              {
                name: '⏳ Status',
                value: 'Waiting for teams...',
                inline: false,
              },
              {
                name: '👥 Teams in Queue',
                value: '0',
                inline: true,
              },
              {
                name: '📊 Range (MMR)',
                value: '±100',
                inline: true,
              },
            ],
            timestamp: new Date(),
          },
        ],
      });

      // Save message ID for updates
      config.queueMessageId = queueMessage.id;
      await saveQueueConfig(guildId, config);

      return interaction.reply({
        content: `✅ Queue channel set to <#${channel.id}>!\n\nUse \`/autojoinqueue\` command for teams to enter the queue.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error setting up queue channel:', error);
      return interaction.reply({
        content: '❌ Error setting up queue channel!',
        ephemeral: true,
      });
    }
  },
};
