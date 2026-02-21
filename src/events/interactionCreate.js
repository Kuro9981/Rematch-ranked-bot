const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { loadTeams, loadQueue, saveQueue, loadMatches, saveMatches } = require('../utils/database');
const { calculateMMRChange } = require('../utils/mmr');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
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

      // Handle queue join button
      if (customId.startsWith('queue_join_')) {
        await handleQueueJoin(interaction);
      }
      // Handle queue leave button
      else if (customId.startsWith('queue_leave_')) {
        await handleQueueLeave(interaction);
      }
    }
  },
};

async function handleQueueJoin(interaction) {
  try {
    await interaction.deferReply();
    const teams = await loadTeams();
    const queue = await loadQueue();
    let userTeam = null;

    // Find team where user is captain
    for (const [teamName, team] of Object.entries(teams)) {
      if (team.captain === interaction.user.id) {
        userTeam = team;
        break;
      }
    }

    if (!userTeam) {
      return interaction.editReply({
        content: '❌ You must be a team captain to join the queue!',
        ephemeral: true,
      });
    }

    // Check if team is already in queue
    if (queue.some((q) => q.teamName === userTeam.name)) {
      return interaction.editReply({
        content: `❌ **${userTeam.name}** is already in queue!`,
        ephemeral: true,
      });
    }

    // Add to queue
    queue.push({
      teamName: userTeam.name,
      captainId: interaction.user.id,
      mmr: userTeam.mmr,
      addedAt: new Date().toISOString(),
    });

    await saveQueue(queue);

    // Update queue status message
    await updateQueueStatus(interaction.channel, queue, teams);

    await interaction.editReply({
      content: `✅ **${userTeam.name}** joined the queue!\n⏳ Waiting for opponents... (${queue.length}/2 teams)`,
      ephemeral: true,
    });

    // Check if we have 2 teams to match
    if (queue.length >= 2) {
      await startMatch(interaction, queue.slice(0, 2), teams);
      // Remove matched teams from queue
      queue.shift();
      queue.shift();
      await saveQueue(queue);
      await updateQueueStatus(interaction.channel, queue, teams);
    }
  } catch (error) {
    console.error('Error handling queue join:', error);
    await interaction.editReply({
      content: '❌ Error joining queue!',
      ephemeral: true,
    });
  }
}

async function handleQueueLeave(interaction) {
  try {
    await interaction.deferReply();
    const queue = await loadQueue();
    let userTeam = null;

    // Find user's team in queue
    userTeam = queue.find((q) => q.captainId === interaction.user.id);

    if (!userTeam) {
      return interaction.editReply({
        content: '❌ Your team is not in the queue!',
        ephemeral: true,
      });
    }

    // Remove from queue
    const index = queue.findIndex((q) => q.captainId === interaction.user.id);
    queue.splice(index, 1);
    await saveQueue(queue);

    // Update queue status message
    const teams = await loadTeams();
    await updateQueueStatus(interaction.channel, queue, teams);

    await interaction.editReply({
      content: `✅ **${userTeam.teamName}** left the queue!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error handling queue leave:', error);
    await interaction.editReply({
      content: '❌ Error leaving queue!',
      ephemeral: true,
    });
  }
}

async function updateQueueStatus(channel, queue, teams) {
  try {
    // Find the pinned status message
    const pinnedMessages = await channel.messages.fetchPinned();
    const statusMessage = pinnedMessages.first();

    if (!statusMessage) return;

    // Build queue list
    let queueList = '```\n';
    if (queue.length === 0) {
      queueList += 'Queue is empty\n```';
    } else {
      queue.forEach((entry, index) => {
        const team = teams[entry.teamName];
        queueList += `${index + 1}. ${entry.teamName} - ${entry.mmr} MMR\n`;
      });
      queueList += '```';
    }

    const queueEmbed = new EmbedBuilder()
      .setTitle('⏳ Matchmaking Queue')
      .setDescription('Click a button below to join or leave the queue')
      .setColor(0x0099ff)
      .addFields(
        { name: '👥 Players in Queue', value: `${queue.length}`, inline: true },
        { name: '🎯 Need', value: queue.length >= 2 ? 'READY!' : `${2 - queue.length} more`, inline: true },
        { name: 'Teams in Queue', value: queueList }
      )
      .setTimestamp();

    await statusMessage.edit({
      embeds: [queueEmbed],
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
  }
}

async function startMatch(interaction, matchTeams, teams) {
  const team1 = matchTeams[0];
  const team2 = matchTeams[1];
  const guild = interaction.guild;

  try {
    // Create private channel for the match
    const matchChannel = await guild.channels.create({
      name: `match-${team1.teamName.toLowerCase()}-vs-${team2.teamName.toLowerCase()}`,
      type: 'GuildText',
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: team1.captainId,
          allow: ['ViewChannel', 'SendMessages'],
        },
        {
          id: team2.captainId,
          allow: ['ViewChannel', 'SendMessages'],
        },
      ],
    });

    // Store match data
    const matches = await loadMatches();
    const match = {
      id: `match_${Date.now()}`,
      team1: team1.teamName,
      team2: team2.teamName,
      team1Captain: team1.captainId,
      team2Captain: team2.captainId,
      channelId: matchChannel.id,
      status: 'active',
      winner: null,
      confirmations: [],
      createdAt: new Date().toISOString(),
    };

    matches.push(match);
    await saveMatches(matches);

    // Send match info to channel
    const matchInfo = `🎮 **MATCH START!**\n\n`;
    matchInfo += `🔵 **${team1.teamName}** (${team1.mmr} MMR) vs 🔴 **${team2.teamName}** (${team2.mmr} MMR)\n\n`;
    matchInfo += `Both captains must use \`/win\` command to report the winner and confirm the result.`;

    await matchChannel.send({
      embeds: [
        {
          title: '⚔️ Match Started',
          description: matchInfo,
          color: 0xff0000,
          timestamp: new Date(),
        },
      ],
    });

    // Notify in thread
    await interaction.channel.send({
      content: `🎮 **MATCH FOUND!**\n\n🔵 **${team1.teamName}** vs 🔴 **${team2.teamName}**\n\nMatch channel: <#${matchChannel.id}>`,
      embeds: [
        new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle('⚔️ Teams Matched!')
          .setDescription(`${team1.teamName} (${team1.mmr} MMR) vs ${team2.teamName} (${team2.mmr} MMR)`),
      ],
    });

    // Notify captains via DM
    await interaction.client.users
      .fetch(team1.captainId)
      .then((user) =>
        user.send(`🎮 Your team **${team1.teamName}** matched against **${team2.teamName}**!\n<#${matchChannel.id}>`)
      )
      .catch(() => {});

    await interaction.client.users
      .fetch(team2.captainId)
      .then((user) =>
        user.send(`🎮 Your team **${team2.teamName}** matched against **${team1.teamName}**!\n<#${matchChannel.id}>`)
      )
      .catch(() => {});
  } catch (error) {
    console.error('Error creating match:', error);
  }
}
