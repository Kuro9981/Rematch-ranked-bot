# 🎮 Rematch Tournament Bot

Discord bot for managing Rematch game tournaments with MMR ranking system, team management, and match automation.

## Features

- 🏆 **Team Management**: Create teams, assign captains, manage members
- 📊 **MMR System**: Elo-like rating system with dynamic MMR changes
- 🎯 **Ranking System**: Bronze → Grandmaster tiers with automatic rank assignment
- 🎮 **Match System**: Queue-based matchmaking with automatic opponent pairing
- 📜 **Match History**: Track all team matches and results
- 🔄 **Admin Controls**: Manual MMR adjustments, season resets, match management
- 🔐 **Permission System**: Admin, Captain, and Member roles with appropriate access levels

## Installation

### Requirements
- Node.js 18.0+
- Discord Bot Token
- Discord Server (Guild)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rematch-tournament-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   ```

4. **Register slash commands**
   ```bash
   node deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## Commands

### 🏆 Team Management

| Command | Description | Permission |
|---------|-------------|-----------|
| `/createteam <name>` | Create a new team | Server Manager |
| `/setcaptain <user> <team>` | Assign a team captain | Administrator |
| `/rank [team]` | View your team's MMR and rank | Everyone |
| `/leaderboard` | Show the global team leaderboard | Everyone |

### 🎮 Match System

| Command | Description | Permission |
|---------|-------------|-----------|
| `/queue <team>` | Queue your team for a match | Team Captain |
| `/win <team>` | Report match victory | Team Captain |
| `/history [team]` | View team match history | Everyone |

### 🔧 Admin Commands

| Command | Description | Permission |
|---------|-------------|-----------|
| `/setmmr <team> <value>` | Manually adjust team MMR | Administrator |
| `/resetseason` | Reset all teams for new season | Administrator |

## MMR System

The bot uses a modified Elo rating system for calculating MMR changes:

- **K-Factor**: 32 (determines rating volatility)
- **Base MMR**: 1000
- **Formula**: Expected Score = 1 / (1 + 10^((opponent - player) / 400))

### Rank Thresholds

| Rank | MMR Range | Color |
|------|-----------|-------|
| Bronze | 0-499 | 🟠 |
| Silver | 500-999 | ⚪ |
| Gold | 1000-1499 | 🟡 |
| Platinum | 1500-1999 | ⚫ |
| Diamond | 2000-2499 | 🔵 |
| Master | 2500-2999 | 🔴 |
| Grandmaster | 3000+ | 🟣 |

## Database

The bot uses JSON files for data persistence:
- `data/teams.json` - Team data, MMR, members
- `data/matches.json` - Completed match history
- `data/queue.json` - Current matchmaking queue
- `data/ranks.json` - Rank definitions

## Architecture

```
src/
├── index.js              # Main bot entry point
├── deploy-commands.js    # Command registration
├── commands/             # Slash commands
├── events/               # Discord event handlers
└── utils/
    ├── database.js       # Data persistence
    └── mmr.js            # MMR calculations
```

## Usage Examples

### Create a Team
```
/createteam name: "Team Alpha"
```

### Set a Captain
```
/setcaptain user: @Player team: "Team Alpha"
```

### Queue for a Match
```
/queue team: "Team Alpha"
```

### Report a Win
```
/win team: "Team Alpha"
```
*Note: Both team captains must confirm the result*

## Workflow

1. **Admin** creates teams using `/createteam`
2. **Admin** assigns captains using `/setcaptain`
3. **Captains** queue their team with `/queue`
4. Bot automatically pairs teams when 2+ are in queue
5. Bot creates private match channel visible only to both captains
6. **Both captains** must use `/win` to confirm the result
7. MMR is automatically updated based on match outcome
8. Teams are ranked automatically based on their MMR

## API & Hosting

### Local Development
```bash
npm start
```

### Future Deployment
The bot can be deployed to cloud services:
- Heroku
- AWS Lambda
- DigitalOcean
- Railway
- Replit

## Invite Bot to Your Server

Use this URL to invite the bot (replace CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

**Required Permissions:**
- Manage Roles
- Manage Channels
- Send Messages
- Manage Messages
- Create Instant Invite

## Configuration

Edit rank thresholds in `src/utils/database.js`:

```javascript
const DEFAULT_RANKS = [
  { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
  { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
  // ... more ranks
];
```

Adjust K-Factor in `src/utils/mmr.js` for MMR volatility:
```javascript
const K_FACTOR = 32; // Higher = more volatile changes
```

## Troubleshooting

### Bot not responding to commands
1. Ensure `deploy-commands.js` was run
2. Check bot has "applications.commands" scope
3. Verify bot has message content intent enabled

### Commands not showing in Discord
1. Re-run `node deploy-commands.js`
2. Check `.env` variables are correct
3. Restart the bot

### Match channel not created
1. Ensure bot has "Manage Channels" permission
2. Check guild channel limit not exceeded
3. Verify bot can view the guild

## Support

For issues or feature requests, please open an issue on the repository.

## License

ISC

## Contributors

- Your Name

---

**Version**: 1.0.0  
**Last Updated**: February 2026
