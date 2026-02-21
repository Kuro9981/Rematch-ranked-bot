const { PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { loadTeams, loadQueue, saveQueue, loadMatches, saveMatches, saveTeams } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');

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

        // Bottoni di votazione per il vincitore
        if (customId.startsWith('vote_')) {
          await handleVote(interaction);
          return;
        }

        // Trova il team del capitano
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
              content: '❌ Devi essere capitano di un team per entrare in queue!', 
              ephemeral: true 
            });
          }
          
          // Controlla se il team è già in queue
          if (queue.some(teamId => teamId === userTeam.id)) {
            return await interaction.reply({ 
              content: '❌ Il tuo team è già nella queue!', 
              ephemeral: true 
            });
          }
          
          // Aggiungi il team alla queue
          queue.push(userTeam.id);
          await saveQueue(queue);
          
          // Aggiorna il messaggio
          await updateQueueMessage(interaction, queue, teams);
          
          // Se sono 2 team, avvia il match
          if (queue.length === 2) {
            await startMatch(interaction, queue, teams);
          }
          
        } else if (customId === 'queue_leave') {
          if (!userTeam) {
            return await interaction.reply({ 
              content: '❌ Devi essere capitano di un team!', 
              ephemeral: true 
            });
          }
          
          // Rimuovi il team dalla queue
          const index = queue.indexOf(userTeam.id);
          if (index > -1) {
            queue.splice(index, 1);
            await saveQueue(queue);
            
            // Aggiorna il messaggio
            await updateQueueMessage(interaction, queue, teams);
          } else {
            return await interaction.reply({ 
              content: '❌ Il tuo team non è nella queue!', 
              ephemeral: true 
            });
          }
        }
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  },
};

// Funzione per aggiornare il messaggio della queue
async function updateQueueMessage(interaction, queue, teams) {
  let description = 'Clicca i bottoni per entrare o uscire dalla queue!\\n\\n';
  
  if (queue.length === 0) {
    description += '**Nessun team in attesa...**';
  } else {
    queue.forEach((teamId, index) => {
      const team = teams[teamId];
      description += `**${index + 1}. ${team.name}** (${team.members.length} giocatori)\\n`;
    });
  }
  
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🎮 Queue Matchmaking')
    .setDescription(description)
    .addFields(
      { name: 'Team in Attesa', value: `${queue.length}/2`, inline: false }
    )
    .setFooter({ text: 'Rematch Ranked Bot' });
  
  await interaction.message.edit({ embeds: [embed] });
  
  await interaction.reply({ 
    content: queue.length === 1 ? '✅ Team aggiunto!' : '✅ Team aggiunto! In attesa del secondo team...', 
    ephemeral: true 
  });
}

// Funzione per avviare il match
async function startMatch(interaction, queue, teams) {
  const team1 = teams[queue[0]];
  const team2 = teams[queue[1]];
  const matchId = `match_${Date.now()}`;
  
  // Crea bottoni per votare il vincitore
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
    .setTitle('⚔️ MATCH FOUND!')
    .addFields(
      { name: team1.name, value: `Giocatori: ${team1.members.length}`, inline: true },
      { name: team2.name, value: `Giocatori: ${team2.members.length}`, inline: true },
      { name: '🗳️ Votazione', value: 'Clicca il bottone del team che ha vinto!\n(Entrambi i team devono votare)', inline: false }
    )
    .setFooter({ text: 'Match ID: ' + matchId });
  
  const voteMessage = await interaction.channel.send({ embeds: [embed], components: [voteRow] });
  
  // Salva lo stato della votazione
  const voteData = {
    matchId,
    team1: queue[0],
    team2: queue[1],
    messageId: voteMessage.id,
    votes: {},
    createdAt: new Date().toISOString(),
  };
  
  // Salva i dati della votazione in Redis
  await saveMatchVote(voteData);
  
  // Svuota la queue dopo l'avvio del match
  await saveQueue([]);
}

// Funzione per salvare i dati della votazione
async function saveMatchVote(voteData) {
  const redis = require('redis');
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  
  try {
    await client.connect();
    const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
    const key = `${INSTANCE_ID}:match_votes:${voteData.matchId}`;
    await client.set(key, JSON.stringify(voteData));
  } finally {
    await client.quit();
  }
}

// Funzione per caricare i dati della votazione
async function loadMatchVote(matchId) {
  const redis = require('redis');
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  
  try {
    await client.connect();
    const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
    const key = `${INSTANCE_ID}:match_votes:${matchId}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } finally {
    await client.quit();
  }
}

// Funzione per gestire i voti
async function handleVote(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const customId = interaction.customId;
    const parts = customId.split('_');
    const matchId = parts[1];
    const votedTeamId = parts[2];
    
    // Carica i dati della votazione
    const voteData = await loadMatchVote(matchId);
    
    if (!voteData) {
      return await interaction.editReply({
        content: '❌ Non trovato il match per questa votazione!',
        ephemeral: true,
      });
    }
    
    const teams = await loadTeams();
    const userTeamId = Object.keys(teams).find(teamId => teams[teamId].captain === interaction.user.id);
    
    if (!userTeamId) {
      return await interaction.editReply({
        content: '❌ Devi essere capitano di un team!',
        ephemeral: true,
      });
    }
    
    // Controlla se il capitano è una delle due squadre del match
    if (userTeamId !== voteData.team1 && userTeamId !== voteData.team2) {
      return await interaction.editReply({
        content: '❌ Il tuo team non è parte di questo match!',
        ephemeral: true,
      });
    }
    
    // Registra il voto
    voteData.votes[userTeamId] = votedTeamId;
    await saveMatchVote(voteData);
    
    const votedTeamName = teams[votedTeamId].name;
    await interaction.editReply({
      content: `✅ Hai votato per **${votedTeamName}**!`,
      ephemeral: true,
    });
    
    // Controlla se entrambi i team hanno votato
    if (Object.keys(voteData.votes).length === 2) {
      // Conta i voti
      const votes = Object.values(voteData.votes);
      const team1Votes = votes.filter(v => v === voteData.team1).length;
      const team2Votes = votes.filter(v => v === voteData.team2).length;
      
      let winner;
      if (team1Votes > team2Votes) {
        winner = voteData.team1;
      } else if (team2Votes > team1Votes) {
        winner = voteData.team2;
      } else {
        // Pareggio - può essere gestito come preferisci
        winner = null;
      }
      
      // Aggiorna il team vincitore
      if (winner) {
        const updatedTeams = await loadTeams();
        const winnerTeam = updatedTeams[winner];
        const loserTeamId = winner === voteData.team1 ? voteData.team2 : voteData.team1;
        const loserTeam = updatedTeams[loserTeamId];
        
        // Aggiorna i dati del team vincitore
        winnerTeam.wins++;
        loserTeam.losses++;
        
        // Calcola e applica i cambiamenti di MMR
        const { calculateMMRChange } = require('../utils/mmr');
        const { winnerChange, loserChange } = calculateMMRChange(winnerTeam.mmr, loserTeam.mmr);
        
        winnerTeam.mmr += winnerChange;
        loserTeam.mmr = Math.max(0, loserTeam.mmr + loserChange);
        
        // Salva i team aggiornati
        await saveTeams(updatedTeams);
        
        // Invia il messaggio di fine match nel canale
        const resultEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🏆 MATCH TERMINATO!')
          .addFields(
            { name: '👑 Vincitore', value: winnerTeam.name, inline: false },
            { name: `📊 ${winnerTeam.name}`, value: `MMR: **${winnerTeam.mmr}** (${winnerChange > 0 ? '+' : ''}${winnerChange})`, inline: true },
            { name: `📊 ${loserTeam.name}`, value: `MMR: **${loserTeam.mmr}** (${loserChange})`, inline: true }
          )
          .setFooter({ text: 'Match ID: ' + matchId });
        
        await interaction.channel.send({ embeds: [resultEmbed] });
        
        // Elimina i dati della votazione
        const redis = require('redis');
        const client = redis.createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        
        try {
          await client.connect();
          const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
          const key = `${INSTANCE_ID}:match_votes:${matchId}`;
          await client.del(key);
        } finally {
          await client.quit();
        }
      } else {
        // Pareggio
        await interaction.channel.send({
          content: '⚖️ Pareggio! Nessun team ha vinto.',
          ephemeral: false,
        });
      }
    }
  } catch (error) {
    console.error('Errore nella votazione:', error);
    await interaction.editReply({
      content: '❌ Errore durante la votazione!',
      ephemeral: true,
    });
  }
}
