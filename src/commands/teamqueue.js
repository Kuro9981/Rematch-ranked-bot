const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadTeams, loadQueue, loadAutoQueue, loadQueueConfig, findTeamByName } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teamqueue')
    .setDescription('Check in which queue a team is currently in')
    .addStringOption((option) =>
      option
        .setName('team')
        .setDescription('Team name to search for')
        .setRequired(true)
    ),

  async execute(interaction) {
    const teamName = interaction.options.getString('team');
    const guildId = interaction.guildId;

    try {
      const teams = await loadTeams();
      
      // Find the team (case-insensitive)
      const teamResult = findTeamByName(teams, teamName);
      if (!teamResult) {
        return interaction.reply({
          content: `❌ Team **${teamName}** does not exist!`,
          ephemeral: true,
        });
      }

      const actualTeamName = teamResult.key;
      const team = teamResult.data;

      // Check all possible queues
      let queueStatus = '❌ Not in any queue';
      let queueColor = 0xff0000;
      let queuesInfo = [];

      // 1. Check normal queue (from setup)
      const normalQueue = await loadQueue();
      const inNormalQueue = normalQueue.some(teamId => teamId === actualTeamName);
      
      if (inNormalQueue) {
        const position = normalQueue.indexOf(actualTeamName) + 1;
        const queueConfig = await loadQueueConfig(guildId);
        const queueChannel = queueConfig.queueChannelId ? `<#${queueConfig.queueChannelId}>` : 'Unknown Channel';
        
        queueStatus = '📋 **Queue Setup**';
        queueColor = 0x0099ff;
        queuesInfo.push({
          name: '📋 Queue Setup',
          value: `Channel: ${queueChannel}\nPosition: #${position} / ${normalQueue.length}\nType: Manual Queue`,
          inline: false,
        });
      }

      // 2. Check auto queue
      const autoQueue = await loadAutoQueue(guildId);
      const inAutoQueue = autoQueue.some((q) => q.teamName === actualTeamName);
      
      if (inAutoQueue) {
        const autoQueueEntry = autoQueue.find((q) => q.teamName === actualTeamName);
        const position = autoQueue.indexOf(autoQueueEntry) + 1;
        const waitTimeMinutes = autoQueueEntry ? Math.floor((Date.now() - autoQueueEntry.addedAt) / 60000) : 0;
        const queueConfig = await loadQueueConfig(guildId);
        const queueChannel = queueConfig.queueChannelId ? `<#${queueConfig.queueChannelId}>` : 'Unknown Channel';
        
        if (queueStatus !== '❌ Not in any queue') {
          queueStatus += ' + **Auto Queue**';
        } else {
          queueStatus = '🤖 **Auto Queue**';
          queueColor = 0x00ff00;
        }

        queuesInfo.push({
          name: '🤖 Auto Queue (Auto-Polling)',
          value: `Channel: ${queueChannel}\nPosition: #${position} / ${autoQueue.length}\n⏱️ Wait Time: ${waitTimeMinutes}m\n📊 Current MMR: ${autoQueueEntry.mmr}`,
          inline: false,
        });
      }

      // If not in any queue
      if (!inNormalQueue && !inAutoQueue) {
        queuesInfo.push({
          name: '📋 Queue Status',
          value: 'Not currently in any queue',
          inline: false,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Queue Status - **${actualTeamName}**`)
        .setDescription(queueStatus)
        .addFields(
          {
            name: '👥 Team Information',
            value: `Captain: <@${team.captain}>\n📊 MMR: ${team.mmr}\n🏆 Record: ${team.wins}W - ${team.losses}L`,
            inline: false,
          },
          ...queuesInfo
        )
        .setColor(queueColor)
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error checking team queue:', error);
      return interaction.reply({
        content: '❌ Error checking team queue!',
        ephemeral: true,
      });
    }
  },
};
