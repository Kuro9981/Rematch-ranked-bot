const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    try {
      console.log('📚 /help command triggered');

      const commands = interaction.client.commands;
      console.log(`✅ Found ${commands.size} commands`);

      // Categorize commands
      const categories = {
        '🏆 Team Management': [],
        '📊 Ranking & Stats': [],
        '🎮 Queue System': [],
        '⚔️ Match System': [],
        '🔧 Admin Tools': [],
        '❓ Info': [],
      };

      // Map commands to categories
      const commandMap = {
        // Team Management
        createteam: '🏆 Team Management',
        setcaptain: '🏆 Team Management',
        addmember: '🏆 Team Management',
        removemember: '🏆 Team Management',
        teaminfo: '🏆 Team Management',

        // Ranking & Stats
        rank: '📊 Ranking & Stats',
        leaderboard: '📊 Ranking & Stats',
        history: '📊 Ranking & Stats',

        // Queue System
        queue: '🎮 Queue System',
        autojoinqueue: '🎮 Queue System',
        leavequeue: '🎮 Queue System',
        queuesetup: '🎮 Queue System',

        // Match System
        win: '⚔️ Match System',

        // Admin Tools
        setmmr: '🔧 Admin Tools',
        resetseason: '🔧 Admin Tools',
        setup: '🔧 Admin Tools',

        // Info
        help: '❓ Info',
      };

      // Populate categories
      console.log('📋 Populating categories...');
      for (const [name, command] of commands) {
        const category = commandMap[name] || '❓ Info';
        if (!categories[category]) {
          categories[category] = [];
        }

        const description = command.data.description || 'No description available';
        categories[category].push({
          name: `/${name}`,
          value: description,
        });
      }

      // Build embed
      console.log('🎨 Building embed...');
      const embed = {
        title: '📚 Command List',
        description: 'Here are all available commands:',
        color: 0x0099ff,
        fields: [],
        footer: {
          text: 'Use /command-name for more details or to execute a command',
        },
        timestamp: new Date(),
      };

      // Add fields for each category
      for (const [category, cmds] of Object.entries(categories)) {
        if (cmds.length > 0) {
          embed.fields.push({
            name: category,
            value: cmds.map((cmd) => `**${cmd.name}**\n${cmd.value}`).join('\n\n'),
            inline: false,
          });
        }
      }

      console.log(`📊 Embed has ${embed.fields.length} fields`);

      console.log('📤 Sending reply...');
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });

      console.log('✅ /help command completed successfully');
    } catch (error) {
      console.error('❌ Error in /help command:', error);
      try {
        await interaction.reply({
          content: `❌ Error loading help: ${error.message}`,
          ephemeral: true,
        });
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
  },
};
