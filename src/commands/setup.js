const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { loadQueue, saveQueue, loadTeams } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Crea una sala d\'attesa per la queue'),
  
  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      
      // Crea i bottoni
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
      
      // Embed iniziale
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎮 Queue Matchmaking')
        .setDescription('Clicca i bottoni per entrare o uscire dalla queue!')
        .addFields(
          { name: 'Team in Attesa', value: '0/2', inline: false }
        )
        .setFooter({ text: 'Rematch Ranked Bot' });
      
      // Invia il messaggio
      await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
      
    } catch (error) {
      console.error('Errore setup:', error);
      await interaction.reply({ content: 'Errore nella creazione della queue!', ephemeral: true });
    }
  },
};
