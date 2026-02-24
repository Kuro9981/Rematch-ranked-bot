const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
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
    .addChannelOption((option) =>
      option
        .setName('results')
        .setDescription('Channel where match results will be posted')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const resultsChannel = interaction.options.getChannel('results');
    const guildId = interaction.guildId;

    try {
      // Save queue configuration
      const config = await loadQueueConfig(guildId);
      config.queueChannelId = channel.id;
      config.resultsChannelId = resultsChannel ? resultsChannel.id : null; // Optional results channel
      config.enabled = true;
      config.startedAt = Date.now(); // Track when queue started for uptime
      await saveQueueConfig(guildId, config);

      // Send initial queue message
      const joinButton = new ButtonBuilder()
        .setCustomId('autojoinqueue_join')
        .setLabel('➕ Join Queue')
        .setStyle(ButtonStyle.Success);

      const leaveButton = new ButtonBuilder()
        .setCustomId('autojoinqueue_leave')
        .setLabel('❌ Leave Queue')
        .setStyle(ButtonStyle.Danger);

      const row1 = new ActionRowBuilder()
        .addComponents(joinButton, leaveButton);

      const closeButton = new ButtonBuilder()
        .setCustomId('autojoinqueue_close')
        .setLabel('🔒 Close Queue')
        .setStyle(ButtonStyle.Secondary);

      const row2 = new ActionRowBuilder()
        .addComponents(closeButton);

      const queueMessage = await channel.send({
        embeds: [
          {
            title: '📋 Match Queue',
            description: 'No teams in queue. Use the buttons below to join!',
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
        components: [row1, row2],
      });

      // Save message ID for updates
      config.queueMessageId = queueMessage.id;
      await saveQueueConfig(guildId, config);

      let responseText = `✅ Queue channel set to <#${channel.id}>!`;
      if (resultsChannel) {
        responseText += `\n✅ Results channel set to <#${resultsChannel.id}>!`;
      } else {
        responseText += `\n⚠️ No results channel configured (optional)`;
      }
      responseText += `\n\nClick the buttons on the queue message to join or leave the automatic queue.`;

      return interaction.reply({
        content: responseText,
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
