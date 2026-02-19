# 🎉 Rematch Tournament Bot - Setup Complete!

Your Discord bot is **fully created and ready to configure**.

## ✅ What Has Been Set Up

- ✅ Complete Node.js project structure
- ✅ 12 fully implemented Discord commands
- ✅ MMR ranking system (Elo-based)
- ✅ Team management system
- ✅ Match automation with private channels
- ✅ Data persistence (JSON files)
- ✅ Permission system (Admin, Captain, Member)
- ✅ Error handling and validation
- ✅ Complete documentation

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Discord Credentials

1. Go to https://discord.com/developers/applications
2. Click "New Application" and name it "Rematch Bot"
3. Go to "Bot" section → Click "Add Bot"
4. Copy the **TOKEN** (keep it secret!)
5. Go to "General Information"
6. Copy your **APPLICATION ID** (this is CLIENT_ID)
7. In Discord, enable Developer Mode (Settings → Advanced)
8. Right-click your server and copy **SERVER ID** (this is GUILD_ID)

### Step 2: Update .env File

Open `.env` file and replace:
```
DISCORD_TOKEN=your_actual_token_here
CLIENT_ID=your_actual_client_id_here
GUILD_ID=your_actual_server_id_here
```

### Step 3: Run the Bot

```bash
# Validate everything is correct
npm run validate

# Register commands to Discord
npm run deploy

# Start the bot
npm start
```

✅ You should see: `✅ Bot is online as YourBotName#1234`

## 📝 Available Commands in Discord

After starting, you can use:

```
🏆 Team Management
/createteam name: "Team Name"
/setcaptain user: @Player team: "Team Name"
/addmember user: @Player team: "Team Name"
/removemember user: @Player team: "Team Name"
/teaminfo team: "Team Name"

📊 Rankings
/rank [team: "Team Name"]
/leaderboard
/history [team: "Team Name"]

🎮 Matches
/queue team: "Team Name"                  (Captain only)
/win team: "Team Name"                    (Both captains confirm)

🔧 Admin
/setmmr team: "Team Name" value: 1500     (Admin only)
/resetseason                              (Admin only)
```

## 📁 Project Files

Key files you might want to customize:

### Configure Ranks
Edit: `src/utils/database.js` (lines 12-19)
```javascript
const DEFAULT_RANKS = [
  { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
  { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
  // ...
];
```

### Adjust MMR Changes
Edit: `src/utils/mmr.js` (line 3)
```javascript
const K_FACTOR = 32;  // Higher = bigger changes per match
```

### Bot Settings
Edit: `config.js` for game settings

## 📚 Documentation

- **README.md** - Full project documentation
- **QUICKSTART.md** - 5-minute quick start
- **SETUP.md** - Detailed setup guide
- **COMMANDS.md** - All commands explained
- **PROJECT_SUMMARY.md** - Feature overview

## 🔗 Useful Commands

```bash
npm start              # Start the bot
npm run deploy         # Register slash commands
npm run validate       # Check project integrity
npm run invite         # Generate invite link (after .env is set)
npm run dev           # Development mode (same as start)
```

## 🌐 Invite Bot to Your Server

After setting up .env:
```bash
npm run invite
```

This will show you the invite URL.

**OR manually:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

## ⚙️ Configuration Checklist

- [ ] Create Discord Application
- [ ] Get Bot Token
- [ ] Get Application ID (CLIENT_ID)
- [ ] Get Guild/Server ID (GUILD_ID)
- [ ] Update `.env` file
- [ ] Run `npm run validate`
- [ ] Run `npm run deploy`
- [ ] Run `npm start`
- [ ] Test with `/createteam`

## 🆘 Troubleshooting

### "Invalid Token"
- Copy token directly from Discord Developer Portal
- Make sure there are no extra spaces in .env

### "Slash commands not showing"
- Run `npm run deploy` after bot is running
- Make sure bot has "applications.commands" scope

### "Bot can't create match channels"
- Bot needs Administrator permission
- Bot role must be above user roles

### "MMR not updating"
- Both captains must use `/win` command
- Check bot has permission to send messages

## 📞 Support

1. Check the documentation files
2. Run `npm run validate` to check for issues
3. Ensure Discord bot has correct permissions
4. Verify .env file has no typos

## 🎯 Next Steps

1. **Now:** Update `.env` with your credentials
2. **Then:** Run `npm run deploy`
3. **Start:** Run `npm start`
4. **Create:** Use `/createteam` to start
5. **Have fun:** Run tournaments!

## 📊 System Requirements

- Node.js 18.0+ (you have this)
- Discord Bot Token (get from Discord)
- Discord Server (your testing server)
- ~50MB disk space

## 🚀 Future Enhancements

The code is structured for easy expansion:
- Add more commands in `src/commands/`
- Customize MMR in `src/utils/mmr.js`
- Migrate to cloud database (MongoDB, PostgreSQL)
- Deploy to Railway, Render, or AWS

---

## ✨ You're All Set!

The hard part is done. Now just:

```bash
# Edit .env with your Discord credentials
nano .env              # (or use VS Code)

# Deploy and start
npm run deploy && npm start
```

**Then in Discord:** `/createteam name: "My Team"`

Enjoy! 🎮

---

**Questions?** Check the docs or validate with: `npm run validate`
