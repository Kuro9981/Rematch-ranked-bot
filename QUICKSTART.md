# ⚡ Quick Start Guide

## 1️⃣ Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org)
- **Discord Bot Token** - [Create at Discord Developer Portal](https://discord.com/developers/applications)
- **Your Discord Server ID** - Enable Developer Mode in Discord and right-click your server

## 2️⃣ Installation (5 minutes)

```bash
# Navigate to project directory
cd c:\Users\Utente\Desktop\Programmazione

# Dependencies already installed, but ensure:
npm install

# Update .env with your credentials:
# DISCORD_TOKEN=your_token
# CLIENT_ID=your_client_id
# GUILD_ID=your_server_id

# Deploy commands to Discord
npm run deploy

# Start the bot
npm start
```

✅ You should see: `✅ Bot is online as YourBot#1234`

## 3️⃣ First Steps in Discord

### Create Your First Tournament

```
1. /createteam name: "Alpha Team"
2. /setcaptain user: @YourName team: "Alpha Team"
3. /createteam name: "Beta Team"
4. /setcaptain user: @Friend team: "Beta Team"
```

### Run a Match

```
1. /queue team: "Alpha Team"              (as Alpha captain)
2. /queue team: "Beta Team"               (as Beta captain)
3. (Private channel created automatically)
4. /win team: "Alpha Team"                (Alpha captain reports win)
5. /win team: "Alpha Team"                (Beta captain confirms)
6. ✅ Match complete! MMR updated!
```

### Check Results

```
/leaderboard                              (See all teams)
/rank team: "Alpha Team"                  (Check team MMR)
/history team: "Alpha Team"               (Match history)
```

## 📁 Project Structure

```
📂 Programmazione
├── 📄 package.json          (Dependencies)
├── 📄 .env                  (Your tokens - keep secret!)
├── 📄 deploy-commands.js    (Register slash commands)
├── 📄 config.js             (Bot settings)
├── 📂 src/
│   ├── 📄 index.js          (Main bot file)
│   ├── 📂 commands/         (All slash commands)
│   │   ├── createteam.js
│   │   ├── queue.js
│   │   ├── win.js
│   │   └── ... (9 more)
│   ├── 📂 events/           (Discord event handlers)
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   └── 📂 utils/
│       ├── database.js      (Save/load JSON data)
│       └── mmr.js           (MMR calculations)
├── 📂 data/                 (Saved game data)
│   ├── teams.json
│   ├── matches.json
│   └── queue.json
└── 📂 Documentation
    ├── README.md            (Full documentation)
    ├── SETUP.md             (Detailed setup)
    └── COMMANDS.md          (Command reference)
```

## 🔑 Essential Commands

| Command | Use |
|---------|-----|
| `/createteam` | Create a tournament team |
| `/queue` | Queue for a match (Captain) |
| `/win` | Report match result (Captain) |
| `/rank` | Check your team's MMR |
| `/leaderboard` | Global rankings |
| `/setmmr` | Adjust MMR manually (Admin) |
| `/resetseason` | Reset all teams (Admin) |

## ⚙️ Configuration

### Edit Rank Thresholds
File: `src/utils/database.js` - Line 12-19

```javascript
const DEFAULT_RANKS = [
  { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
  { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
  // ... edit thresholds here
];
```

### Adjust MMR Volatility
File: `src/utils/mmr.js` - Line 3

```javascript
const K_FACTOR = 32; // ← Change this (higher = more volatile)
```

## 🆘 Common Issues

### Bot not online
```
❌ Error: Token invalid
✅ Solution: Copy token from Developer Portal again
```

### Commands not showing
```
❌ Error: Slash commands missing
✅ Solution: Run: npm run deploy
```

### Can't create match channels
```
❌ Error: Permission denied
✅ Solution: 
  - Invite bot with admin permission
  - Check bot role is above other roles
```

### MMR not updating
```
❌ Error: Only first captain can report
✅ Solution: Both captains must use /win command
```

## 📊 How MMR Works

- **Winner gets:** +12 to +28 MMR (depends on opponent strength)
- **Loser loses:** -12 to -28 MMR (same calculation)
- **Formula:** Modified Elo rating (chess-based system)

## 🚀 Next Steps

1. ✅ Bot is running
2. ✅ Create test teams
3. ✅ Run a test match
4. 📖 Read [full documentation](./README.md)
5. 🔧 Customize [settings](./config.js)
6. 🌐 Deploy to cloud (future)

## 📞 Need Help?

1. Check [COMMANDS.md](./COMMANDS.md) for all commands
2. Check [SETUP.md](./SETUP.md) for detailed setup
3. Read [README.md](./README.md) for full documentation
4. Make sure `.env` file has your bot token

---

**🎮 Enjoy your Rematch Tournament Bot!**

Start with: `/createteam name: "My Team"`
