const { PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { loadTeams, loadQueue, saveQueue, loadMatches, saveMatches, saveTeams, loadAutoQueue, saveAutoQueue, loadQueueConfig, saveQueueConfig } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');
const { getMatch, updateMatch, removeMatch, getAllMatches } = require('../utils/activeMatches');

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

        // Vote buttons for winner (handles both setup and auto-queue)
        if (customId.startsWith('vote_')) {
          console.log('[VOTE] Button clicked with customId:', customId);
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
        } else if (customId === 'autojoinqueue_join') {
          // Handle auto-join queue button
          const guildId = interaction.guildId;
          const autoQueue = await loadAutoQueue(guildId);

          // Find team of captain
          let userTeam = null;
          for (const [teamName, teamData] of Object.entries(teams)) {
            if (teamData.captain === interaction.user.id) {
              userTeam = { name: teamName, ...teamData };
              break;
            }
          }

          if (!userTeam) {
            return await interaction.reply({
              content: '❌ You must be a team captain to join the queue!',
              ephemeral: true,
            });
          }

          // Check if team already in queue
          if (autoQueue.some((q) => q.teamName === userTeam.name)) {
            return await interaction.reply({
              content: `❌ **${userTeam.name}** is already in queue!`,
              ephemeral: true,
            });
          }

          // Add to queue
          autoQueue.push({
            teamName: userTeam.name,
            captainId: interaction.user.id,
            mmr: userTeam.mmr,
            addedAt: Date.now(),
            waitTime: 0,
          });

          await saveAutoQueue(guildId, autoQueue);

          return await interaction.reply({
            content: `✅ **${userTeam.name}** joined the queue!\n\n📊 Current MMR: ${userTeam.mmr}\n⏳ Finding opponents...`,
            ephemeral: true,
          });

        } else if (customId === 'autojoinqueue_leave') {
          // Handle auto-leave queue button
          const guildId = interaction.guildId;
          const autoQueue = await loadAutoQueue(guildId);

          // Find team of captain
          let userTeam = null;
          for (const [teamName, teamData] of Object.entries(teams)) {
            if (teamData.captain === interaction.user.id) {
              userTeam = { name: teamName, ...teamData };
              break;
            }
          }

          if (!userTeam) {
            return await interaction.reply({
              content: '❌ You must be a team captain!',
              ephemeral: true,
            });
          }

          // Remove from queue
          const index = autoQueue.findIndex((q) => q.teamName === userTeam.name);
          if (index > -1) {
            autoQueue.splice(index, 1);
            await saveAutoQueue(guildId, autoQueue);

            return await interaction.reply({
              content: `✅ **${userTeam.name}** left the queue!`,
              ephemeral: true,
            });
          } else {
            return await interaction.reply({
              content: `❌ **${userTeam.name}** is not in the queue!`,
              ephemeral: true,
            });
          }
        } else if (customId === 'autojoinqueue_close') {
          // Handle close queue button (admin only)
          const guildId = interaction.guildId;

          // Check if user is admin
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
              content: '❌ Only administrators can close the queue!',
              ephemeral: true,
            });
          }

          // Load queue config
          const queueConfig = await loadQueueConfig(guildId);

          // Check if queue is already closed
          if (!queueConfig.enabled) {
            return await interaction.reply({
              content: '❌ The queue is already closed!',
              ephemeral: true,
            });
          }

          // Disable queue and clear teams
          queueConfig.enabled = false;
          await saveQueueConfig(guildId, queueConfig);
          await saveAutoQueue(guildId, []); // Clear queue

          // Update the queue message to show it's closed
          try {
            const channel = interaction.guild.channels.cache.get(queueConfig.queueChannelId);
            if (channel && queueConfig.queueMessageId) {
              const message = await channel.messages.fetch(queueConfig.queueMessageId).catch(() => null);
              if (message) {
                await message.edit({
                  embeds: [
                    {
                      title: '📋 Match Queue',
                      description: 'Queue is **CLOSED** ❌',
                      color: 0xff0000,
                      fields: [
                        {
                          name: '⏳ Status',
                          value: 'Queue is currently closed',
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
                  components: [],
                });
              }
            }
          } catch (error) {
            console.error('Error updating queue message:', error);
          }

          return await interaction.reply({
            content: `🔒 Queue has been **closed** by an administrator!`,
            ephemeral: true,
          });
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
    console.log('[MATCH] Creating match with ID:', matchId);
    console.log('[MATCH] Team 1:', team1.name, '| Team 2:', team2.name);
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
    
    console.log('[MATCH] Vote button 1 customId:', `vote_${matchId}_${queue[0]}`);
    
    const voteTeam2Button = new ButtonBuilder()
      .setCustomId(`vote_${matchId}_${queue[1]}`)
      .setLabel(`🔴 Vote ${team2.name}`)
      .setStyle(ButtonStyle.Danger);
    
    console.log('[MATCH] Vote button 2 customId:', `vote_${matchId}_${queue[1]}`);
    
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
      matchId: matchId,
      team1: queue[0],
      team2: queue[1],
      channelId: matchChannel.id,
      messageId: voteMessage.id,
      votes: {},
      createdAt: new Date().toISOString(),
    };
    
    // Save voting status in memory using the shared module
    addMatch(matchId, voteData);
    
    console.log('[MATCH] Vote data saved for matchId:', matchId);
    console.log('[MATCH] All active match IDs:', getAllMatches());
    console.log('[MATCH] Vote data:', JSON.stringify(voteData, null, 2));
    
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

// Function to handle votes (unified for setup and auto-queue)
async function handleVote(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const customId = interaction.customId;
    console.log('[VOTE] Custom ID received:', customId);
    console.log('[VOTE] Active matches in memory:', getAllMatches());
    
    // Parse customId: vote_MATCHID_VOTEDTEAM
    // Format: vote_match_TIMESTAMP_TEAMNAME
    const parts = customId.split('_');
    if (parts.length < 3) {
      console.error('[VOTE] Failed to parse customId:', customId);
      return await interaction.editReply({
        content: '❌ Invalid vote format!',
        ephemeral: true,
      });
    }

    const matchId = parts.slice(1, -1).join('_'); // Handle team names with spaces
    const votedTeam = parts[parts.length - 1]; // Last part is the team name/id
    
    console.log('[VOTE] Parsed matchId:', matchId);
    console.log('[VOTE] Parsed votedTeam:', votedTeam);
    
    // Load vote data from active matches
    const voteData = getMatch(matchId);
    
    if (!voteData) {
      console.error('[VOTE] Match data NOT found!');
      console.error('[VOTE] Looking for:', matchId);
      console.error('[VOTE] Available matches:', getAllMatches().join(', '));
      return await interaction.editReply({
        content: '❌ Match not found for this vote!',
        ephemeral: true,
      });
    }
    
    console.log('[VOTE] Match data FOUND for:', matchId);
    
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
    console.log('[VOTE] User team ID:', userTeamId);
    console.log('[VOTE] Voted for team:', votedTeam);
    voteData.votes[userTeamId] = votedTeam;
    updateMatch(matchId, voteData);
    
    console.log('[VOTE] Current votes:', voteData.votes);
    console.log('[VOTE] Votes count:', Object.keys(voteData.votes).length);
    
    const votedTeamName = votedTeam;
    await interaction.editReply({
      content: `✅ You voted for **${votedTeamName}**!`,
      ephemeral: true,
    });
    
    // Check if both teams have voted
    if (Object.keys(voteData.votes).length === 2) {
      console.log('[VOTE] Both teams have voted! Processing match result...');
      // Get the votes
      const team1Vote = voteData.votes[voteData.team1];
      const team2Vote = voteData.votes[voteData.team2];
      
      console.log('[VOTE] Team 1 voted for:', team1Vote, '| Team 2 voted for:', team2Vote);
      
      let winner;
      if (team1Vote === team2Vote) {
        // Both teams voted for the same team - we have a winner!
        winner = team1Vote;
      } else {
        // Draw - votes don't match
        winner = null;
      }
      
      // Update winner team
      if (winner) {
        console.log('[VOTE] Winner team:', winner);
        const updatedTeams = await loadTeams();
        const winnerTeam = updatedTeams[voteData.team1 === winner ? voteData.team1 : voteData.team2];
        const loserTeam = updatedTeams[voteData.team1 === winner ? voteData.team2 : voteData.team1];
        
        console.log('[VOTE] Winner:', winnerTeam.name, '| Loser:', loserTeam.name);
        
        // Update team data
        winnerTeam.wins++;
        loserTeam.losses++;
        
        // Calculate and apply MMR changes
        const { winnerChange, loserChange } = calculateMMRChange(winnerTeam.mmr, loserTeam.mmr);
        
        winnerTeam.mmr += winnerChange;
        loserTeam.mmr = Math.max(0, loserTeam.mmr + loserChange);
        
        // Save match to history
        const matches = await loadMatches();
        matches.push({
          id: matchId,
          team1: voteData.team1,
          team1Name: voteData.team1,
          team2: voteData.team2,
          team2Name: voteData.team2,
          winner: winner,
          winnerName: winnerTeam.name,
          loserName: loserTeam.name,
          winnerMMRChange: winnerChange,
          loserMMRChange: loserChange,
          completedAt: new Date().toISOString(),
        });
        await saveMatches(matches);
        
        // Save updated teams
        await saveTeams(updatedTeams);
        console.log('[VOTE] Teams saved to database');
        
        // Send match end message in match channel
        const matchChannel = await interaction.guild.channels.fetch(voteData.channelId);
        console.log('[VOTE] Match channel ID:', voteData.channelId);
        
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
        console.log('[VOTE] Result embed sent to match channel');
        
        // Delete match channel after 3 seconds to allow users to see the result
        setTimeout(async () => {
          try {
            await matchChannel.delete();
            console.log('[VOTE] Match channel deleted:', voteData.channelId);
          } catch (error) {
            console.error('[VOTE] Error deleting match channel:', error);
          }
        }, 3000);
        
        // Delete vote data from memory
        removeMatch(matchId);
        console.log('[VOTE] Match data deleted for matchId:', matchId);
        console.log('[VOTE] Remaining active matches:', getAllMatches());
      } else {
        // Draw - teams voted for different teams, restart voting
        console.log('[VOTE] It\'s a draw! Teams voted for different winners. Restarting voting...');
        
        const matchChannel = await interaction.guild.channels.fetch(voteData.channelId);
        const updatedTeams = await loadTeams();
        
        // Send draw message
        const drawEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('⚖️ It\'s a Draw!')
          .setDescription(`${voteData.team1} and ${voteData.team2} voted for different teams!\n\n**Please vote again:**`)
          .addFields(
            { name: voteData.team1, value: `📊 MMR: ${updatedTeams[voteData.team1].mmr}`, inline: true },
            { name: voteData.team2, value: `📊 MMR: ${updatedTeams[voteData.team2].mmr}`, inline: true }
          );
        
        // Create new voting buttons
        const voteTeam1Button = new ButtonBuilder()
          .setCustomId(`vote_${matchId}_${voteData.team1}`)
          .setLabel(`🔵 Vote ${voteData.team1}`)
          .setStyle(ButtonStyle.Primary);
        
        const voteTeam2Button = new ButtonBuilder()
          .setCustomId(`vote_${matchId}_${voteData.team2}`)
          .setLabel(`🔴 Vote ${voteData.team2}`)
          .setStyle(ButtonStyle.Danger);
        
        const voteRow = new ActionRowBuilder()
          .addComponents(voteTeam1Button, voteTeam2Button);
        
        // Reset votes and save
        voteData.votes = {};
        updateMatch(matchId, voteData);
        
        await matchChannel.send({ embeds: [drawEmbed], components: [voteRow] });
        console.log('[VOTE] Restarted voting with new buttons');
      }
    }
  } catch (error) {
    console.error('[VOTE] Error in voting:', error);
    console.error('[VOTE] Stack:', error.stack);
    await interaction.editReply({
      content: '❌ Error during voting!\n```' + error.message + '```',
      ephemeral: true,
    });
  }
};
