# 📋 Setup Instructions

## Prerequisites
- Node.js 18.0 or higher
- A Discord Server (Guild)
- A Discord Bot Token

## Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Rematch Bot")
3. Go to the "Bot" section and click "Add Bot"
4. Under TOKEN, click "Copy" to copy your bot token
5. Paste the token in your `.env` file as `DISCORD_TOKEN`

## Step 2: Configure Bot Permissions

1. In the Developer Portal, go to "OAuth2" > "URL Generator"
2. Select these scopes:
   - `bot`
   - `applications.commands`
3. Select these permissions:
   - **General**
     - Manage Guild
     - Manage Roles
     - Manage Channels
     - View Channels
   - **Text**
     - Send Messages
     - Embed Links
     - Read Messages/View Channels
3. Copy the generated URL and open it in your browser to invite the bot to your server

## Step 3: Setup Environment Variables

1. Create a `.env` file in the root directory with:
```
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
```

### How to find these values:

**CLIENT_ID**: 
- Developer Portal > Application > General Information > Application ID

**GUILD_ID**:
- In Discord, enable Developer Mode (User Settings > Advanced > Developer Mode)
- Right-click your server and select "Copy Server ID"

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Register Slash Commands

```bash
npm run deploy
```

This registers all commands in your Discord server.

## Step 6: Start the Bot

```bash
npm start
```

You should see: `✅ Bot is online as YourBotName#1234`

## Troubleshooting

### "Token is invalid"
- Make sure your Discord bot token is correct in `.env`
- Copy the token directly from Developer Portal

### Commands not showing in Discord
- Run `npm run deploy` again
- Make sure bot has "applications.commands" scope
- Restart the bot

### Bot not responding
- Check that the bot has permission to send messages in the channel
- Verify bot has "Message Content Intent" enabled in Developer Portal > Bot

### Permission errors
- Make sure the bot role is above other roles in role settings
- Bot needs "Manage Guild" permission to create private channels for matches

## Configuration Options

Edit these files to customize the bot:

### Ranks (src/utils/database.js)
Modify the `DEFAULT_RANKS` array to change rank thresholds and colors:
```javascript
{ name: 'Bronze', minMMR: 0, color: '#CD7F32' }
```

### MMR Settings (src/utils/mmr.js)
Adjust `K_FACTOR` (higher = more volatile MMR changes):
```javascript
const K_FACTOR = 32;
```

## Deployment

### Local (Current Setup)
- Bot runs on your machine
- Stops when you close the terminal

### Production Options
1. **Heroku** (free tier deprecated)
2. **Railway.app** (Recommended)
3. **Render.com**
4. **DigitalOcean App Platform**
5. **AWS Lambda + DynamoDB**

For deployment, you'll need to:
- Use a cloud database instead of JSON files
- Set environment variables on the hosting platform
- Enable "Keep Alive" to prevent bot from sleeping

## Next Steps

1. Create a team: `/createteam`
2. Set a captain: `/setcaptain`
3. Queue for matches: `/queue`
4. View leaderboard: `/leaderboard`

## Support

For issues:
1. Check the bot has required permissions
2. Verify all environment variables are set correctly
3. Ensure Node.js version is compatible
4. Check Discord status page for outages
