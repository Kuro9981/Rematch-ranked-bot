const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadQueue, saveQueue } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup a matchmaking queue for your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;

    try {
      // Create a thread for the queue
      const threadName = `🎮-matchmaking-${Date.now()}`;
      const thread = await channel.threads.create({
        name: threadName,
        type: ChannelType.PublicThread,
      });

      // Store the thread ID for this queue
      const queueData = {
        threadId: thread.id,
        channelId: channel.id,
        guildId: guild.id,
        createdAt: new Date().toISOString(),
      };

      // Create queue status message in thread
      const queueEmbed = new EmbedBuilder()
        .setTitle('⏳ Matchmaking Queue')
        .setDescription('Click a button below to join or leave the queue')
        .setColor(0x0099ff)
        .addFields(
          { name: '👥 Players in Queue', value: '0', inline: true },
          { name: '⏱️ Average Wait Time', value: 'N/A', inline: true }
        )
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`queue_join_${thread.id}`)
            .setLabel('➕ Join Queue')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`queue_leave_${thread.id}`)
            .setLabel('❌ Leave Queue')
            .setStyle(ButtonStyle.Danger)
        );

      const statusMessage = await thread.send({
        embeds: [queueEmbed],
        components: [buttons],
      });

      // Pin the status message
      await statusMessage.pin();

      // Reply to setup command
      await interaction.reply({
        content: `✅ Matchmaking queue created!\n📍 <#${thread.id}>`,
        ephemeral: true,
      });

      // Send welcome message to thread
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('Welcome to Matchmaking!')
        .setDescription('Use the buttons above to:\n• **Join Queue** - Add your team to matchmaking\n• **Leave Queue** - Remove your team from the queue\n\nWhen 2 teams are matched, a match channel will be created for you to play!')
        .setColor(0x00ff00)
        .setTimestamp();

      await thread.send({
        embeds: [welcomeEmbed],
      });

    } catch (error) {
      console.error('Error setting up queue:', error);
      return interaction.reply({
        content: '❌ Error creating matchmaking queue!',
        ephemeral: true,
      });
    }
  },
};
