const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { loadQueue, saveQueue, loadTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create a waiting room for the queue'),
  
  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      
      // Create buttons
      const joinButton = new ButtonBuilder()
        .setCustomId('queue_join')
        .setLabel('➕ Join Queue')
        .setStyle(ButtonStyle.Success);
      
      const leaveButton = new ButtonBuilder()
        .setCustomId('queue_leave')
        .setLabel('❌ Leave Queue')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder()
        .addComponents(joinButton, leaveButton);
      
      // Initial embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎮 Queue Matchmaking')
        .setDescription('Click the buttons to join or leave the queue!')
        .addFields(
          { name: 'Teams Waiting', value: '0/2', inline: false }
        )
        .setFooter({ text: 'Rematch Ranked Bot' });
      
      // Send the message
      await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
      
    } catch (error) {
      console.error('Setup error:', error);
      await interaction.reply({ content: 'Error creating the queue!', ephemeral: true });
    }
  },
};
