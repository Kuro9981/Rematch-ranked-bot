const { PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { loadTeams, loadQueue, saveQueue, loadMatches, saveMatches, saveTeams } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');

// Store temporaneo per i dati dei match durante il voto
const activeMatches = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // Handle chat input commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`Command ${interaction.commandName} not found`);
          return;
        }

        try {
          await command.execute(interaction, client);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ An error occurred while executing this command!',
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: '❌ An error occurred while executing this command!',
              ephemeral: true,
            });
          }
        }
      }

      // Handle button interactions
      if (interaction.isButton()) {
        const customId = interaction.customId;
        const teams = await loadTeams();
        const queue = await loadQueue();

        // Vote buttons for winner
        if (customId.startsWith('vote_')) {
          await handleVote(interaction);
          return;
        }

        // Find team of captain
        let userTeam = null;
        for (const [teamId, team] of Object.entries(teams)) {
          if (team.captain === interaction.user.id) {
            userTeam = { id: teamId, ...team };
            break;
          }
        }

        if (customId === 'queue_join') {
          if (!userTeam) {
            return await interaction.reply({ 
              content: '❌ You must be a team captain to join the queue!', 
              ephemeral: true 
            });
          }
          
          // Check if team is already in queue
          if (queue.some(teamId => teamId === userTeam.id)) {
            return await interaction.reply({ 
              content: '❌ Your team is already in the queue!', 
              ephemeral: true 
            });
          }
          
          // Add team to queue
          queue.push(userTeam.id);
          await saveQueue(queue);
          
          // Update message
          await updateQueueMessage(interaction, queue, teams);
          
          // If 2 teams, start match
          if (queue.length === 2) {
            await startMatch(interaction, queue, teams);
          }
          
        } else if (customId === 'queue_leave') {
          if (!userTeam) {
            return await interaction.reply({ 
              content: '❌ You must be a team captain!', 
              ephemeral: true 
            });
          }
          
          // Remove team from queue
          const index = queue.indexOf(userTeam.id);
          if (index > -1) {
            queue.splice(index, 1);
            await saveQueue(queue);
            
            // Update message
            await updateQueueMessage(interaction, queue, teams);
          } else {
            return await interaction.reply({ 
              content: '❌ Your team is not in the queue!', 
              ephemeral: true 
            });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  },
};

// Function to update queue message
async function updateQueueMessage(interaction, queue, teams) {
  let description = 'Click the buttons to join or leave the queue!\\n\\n';
  
  if (queue.length === 0) {
    description += '**No teams waiting...**';
  } else {
    queue.forEach((teamId, index) => {
      const team = teams[teamId];
      description += `**${index + 1}. ${team.name}** (${team.members.length} players)\\n`;
    });
  }
  
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🎮 Queue Matchmaking')
    .setDescription(description)
    .addFields(
      { name: 'Teams Waiting', value: `${queue.length}/2`, inline: false }
    )
    .setFooter({ text: 'Rematch Ranked Bot' });
  
  await interaction.message.edit({ embeds: [embed] });
  
  await interaction.reply({ 
    content: queue.length === 1 ? '✅ Team added!' : '✅ Team added! Waiting for the second team...', 
    ephemeral: true 
  });
}

// Function to start match
async function startMatch(interaction, queue, teams) {
  const team1 = teams[queue[0]];
  const team2 = teams[queue[1]];
  const matchId = `match_${Date.now()}`;
  const guild = interaction.guild;
  
  try {
    console.log(`Creating match channel for ${team1.name} vs ${team2.name}`);
    
    // Get category of current channel
    const category = interaction.channel.parent;
    const categoryId = category ? category.id : null;
    
    console.log(`Category ID: ${categoryId}`);
    console.log(`Team 1 Captain: ${team1.captain}, Team 2 Captain: ${team2.captain}`);
    
    // Create private channel for match
    const matchChannel = await guild.channels.create({
      name: `match-${team1.name.toLowerCase().replace(/\s+/g, '-')}-vs-${team2.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: ['ViewChannel'],
        },
        {
          id: team1.captain,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: team2.captain,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });
    
    console.log(`Match channel created: ${matchChannel.id}`);
    
    // Create buttons to vote for winner
    const voteTeam1Button = new ButtonBuilder()
      .setCustomId(`vote_${matchId}_${queue[0]}`)
      .setLabel(`🔵 Vote ${team1.name}`)
      .setStyle(ButtonStyle.Primary);
    
    const voteTeam2Button = new ButtonBuilder()
      .setCustomId(`vote_${matchId}_${queue[1]}`)
      .setLabel(`🔴 Vote ${team2.name}`)
      .setStyle(ButtonStyle.Danger);
    
    const voteRow = new ActionRowBuilder()
      .addComponents(voteTeam1Button, voteTeam2Button);
    
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚔️ MATCH IN PROGRESS!')
      .addFields(
        { name: team1.name, value: `👥 Players: ${team1.members.length}\n📊 MMR: ${team1.mmr}`, inline: true },
        { name: team2.name, value: `👥 Players: ${team2.members.length}\n📊 MMR: ${team2.mmr}`, inline: true },
        { name: '🗳️ Winner Vote', value: 'Click the button of the winning team!\n(Both captains must vote)', inline: false }
      )
      .setFooter({ text: 'Match ID: ' + matchId });
    
    const voteMessage = await matchChannel.send({ embeds: [embed], components: [voteRow] });
    
    // Save voting status
    const voteData = {
      matchId,
      team1: queue[0],
      team2: queue[1],
      channelId: matchChannel.id,
      messageId: voteMessage.id,
      votes: {},
      createdAt: new Date().toISOString(),
    };
    
    // Save voting status in memory
    activeMatches.set(matchId, voteData);
    
    console.log(`Match data saved for ${matchId}`);
    
    // Notify in queue channel
    const notifyEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ MATCH STARTED!')
      .setDescription(`**${team1.name}** vs **${team2.name}**\n\n📍 Private channel created for voting: <#${matchChannel.id}>`)
      .setFooter({ text: 'Match ID: ' + matchId });
    
    await interaction.channel.send({ embeds: [notifyEmbed] });
    
    // Clear queue after match starts
    await saveQueue([]);
    
  } catch (error) {
    console.error('Error creating match channel:', error);
    console.error('Stack:', error.stack);
    await interaction.channel.send({
      content: '❌ Error creating match channel!\n```' + error.message + '```',
      ephemeral: false,
    });
  }
}

// Function to handle votes
async function handleVote(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const customId = interaction.customId;
    const parts = customId.split('_');
    const matchId = parts[1];
    const votedTeamId = parts[2];
    
    // Load vote data
    const voteData = activeMatches.get(matchId);
    
    if (!voteData) {
      console.log(`Match data not found for ${matchId}. Available matches: ${Array.from(activeMatches.keys()).join(', ')}`);
      return await interaction.editReply({
        content: '❌ Match not found for this vote!',
        ephemeral: true,
      });
    }
    
    const teams = await loadTeams();
    const userTeamId = Object.keys(teams).find(teamId => teams[teamId].captain === interaction.user.id);
    
    if (!userTeamId) {
      return await interaction.editReply({
        content: '❌ You must be a team captain!',
        ephemeral: true,
      });
    }
    
    // Check if captain is one of the two match teams
    if (userTeamId !== voteData.team1 && userTeamId !== voteData.team2) {
      return await interaction.editReply({
        content: '❌ Your team is not part of this match!',
        ephemeral: true,
      });
    }
    
    // Register vote
    voteData.votes[userTeamId] = votedTeamId;
    activeMatches.set(matchId, voteData);
    
    const votedTeamName = teams[votedTeamId].name;
    await interaction.editReply({
      content: `✅ You voted for **${votedTeamName}**!`,
      ephemeral: true,
    });
    
    // Check if both teams have voted
    if (Object.keys(voteData.votes).length === 2) {
      // Count votes
      const votes = Object.values(voteData.votes);
      const team1Votes = votes.filter(v => v === voteData.team1).length;
      const team2Votes = votes.filter(v => v === voteData.team2).length;
      
      let winner;
      if (team1Votes > team2Votes) {
        winner = voteData.team1;
      } else if (team2Votes > team1Votes) {
        winner = voteData.team2;
      } else {
        // Draw
        winner = null;
      }
      
      // Update winner team
      if (winner) {
        const updatedTeams = await loadTeams();
        const winnerTeam = updatedTeams[winner];
        const loserTeamId = winner === voteData.team1 ? voteData.team2 : voteData.team1;
        const loserTeam = updatedTeams[loserTeamId];
        
        // Update team data
        winnerTeam.wins++;
        loserTeam.losses++;
        
        // Calculate and apply MMR changes
        const { winnerChange, loserChange } = calculateMMRChange(winnerTeam.mmr, loserTeam.mmr);
        
        winnerTeam.mmr += winnerChange;
        loserTeam.mmr = Math.max(0, loserTeam.mmr + loserChange);
        
        // Save updated teams
        await saveTeams(updatedTeams);
        
        // Send match end message in match channel
        const matchChannel = await interaction.guild.channels.fetch(voteData.channelId);
        
        const resultEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🏆 MATCH ENDED!')
          .addFields(
            { name: '👑 Winner', value: winnerTeam.name, inline: false },
            { name: `📊 ${winnerTeam.name}`, value: `MMR: **${winnerTeam.mmr}** (${winnerChange > 0 ? '+' : ''}${winnerChange})`, inline: true },
            { name: `📊 ${loserTeam.name}`, value: `MMR: **${loserTeam.mmr}** (${loserChange})`, inline: true }
          )
          .setFooter({ text: 'Match ID: ' + matchId });
        
        await matchChannel.send({ embeds: [resultEmbed] });
        
        // Delete vote data from memory
        activeMatches.delete(matchId);
        console.log(`Match data deleted for ${matchId}`);
      } else {
        // Draw
        const matchChannel = await interaction.guild.channels.fetch(voteData.channelId);
        await matchChannel.send({
          content: '⚖️ Draw! No team won.',
          ephemeral: false,
        });
      }
    }
  } catch (error) {
    console.error('Error in voting:', error);
    await interaction.editReply({
      content: '❌ Error during voting!',
      ephemeral: true,
    });
  }
}
