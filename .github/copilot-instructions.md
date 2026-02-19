## Project Guidelines

### Project Structure
- **Language**: JavaScript (Node.js)
- **Framework**: discord.js v14
- **Database**: JSON files (local) - can be upgraded to MongoDB/PostgreSQL for production
- **Main Entry**: `src/index.js`

### Command Structure
- All commands in `src/commands/` folder
- Must export `data` (SlashCommandBuilder) and `execute` function
- Commands are auto-loaded from the commands folder

### Adding New Commands
1. Create file in `src/commands/newcommand.js`
2. Export SlashCommandBuilder and execute function
3. Redeploy with: `npm run deploy`

### Updating MMR System
- K-Factor can be adjusted in `src/utils/mmr.js`
- Ranks can be customized in `src/utils/database.js`
- Re-start bot to apply changes (no redeployment needed)

### Database
- Data stored in `data/` folder as JSON files
- Each collection has dedicated load/save functions
- For production: migrate to cloud database in `src/utils/database.js`

### Error Handling
- All commands wrapped in try-catch in `interactionCreate.js` event
- Errors logged to console
- Bot responds with error message to user

### Key Files
- `src/index.js` - Bot initialization and command loading
- `src/events/ready.js` - Bot online confirmation
- `src/events/interactionCreate.js` - Command handling
- `deploy-commands.js` - Register slash commands with Discord
- `config.js` - Configuration values

### Testing
- Test in local Discord server first
- Use `/resetseason` to clear test data
- Check `data/` folder to verify changes were saved

### Deployment Preparation
1. Migrate from JSON to cloud database
2. Add logging service
3. Add error tracking (Sentry)
4. Use process manager (PM2)
5. Set up environment variables on cloud platform
