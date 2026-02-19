# 🎮 Complete Command Reference

## 🏆 Team Management Commands

### /createteam
Create a new tournament team
- **Requires:** Server Manager permission
- **Options:**
  - `name` (required): Team name
- **Example:** `/createteam name: "Team Alpha"`
- **Response:** Team created with 1000 starting MMR

---

### /setcaptain
Assign a captain to a team
- **Requires:** Administrator
- **Options:**
  - `user` (required): User to set as captain
  - `team` (required): Team name
- **Example:** `/setcaptain user: @Player team: "Team Alpha"`
- **Response:** User is now team captain

---

### /rank
Display your team's MMR and rank
- **Requires:** Everyone (anyone in a team)
- **Options:**
  - `team` (optional): Team name (defaults to your team)
- **Example:** `/rank team: "Team Alpha"`
- **Response:** Shows MMR, current rank, and progress to next rank

---

### /leaderboard
Display the global team rankings
- **Requires:** Everyone
- **Options:** None
- **Example:** `/leaderboard`
- **Response:** Ranked list of all teams by MMR

---

### /teaminfo
Get detailed information about a team
- **Requires:** Everyone
- **Options:**
  - `team` (required): Team name
- **Example:** `/teaminfo team: "Team Alpha"`
- **Response:** Shows team details, captain, members, record

---

### /addmember
Add a member to your team
- **Requires:** Team Captain
- **Options:**
  - `user` (required): User to add
  - `team` (required): Team name
- **Example:** `/addmember user: @NewPlayer team: "Team Alpha"`
- **Response:** User added to team

---

### /removemember
Remove a member from your team
- **Requires:** Team Captain
- **Options:**
  - `user` (required): User to remove
  - `team` (required): Team name
- **Example:** `/removemember user: @Player team: "Team Alpha"`
- **Response:** User removed from team

---

## 🎮 Match Management Commands

### /queue
Queue your team for a match
- **Requires:** Team Captain
- **Options:**
  - `team` (required): Team name
- **Example:** `/queue team: "Team Alpha"`
- **Action:**
  - Team enters matchmaking queue
  - If 2+ teams in queue, automatic match is created
  - Private channel created for both teams
  - Both captains notified

---

### /win
Report a match victory
- **Requires:** Team Captain (in active match)
- **Options:**
  - `team` (required): Your team name
- **Example:** `/win team: "Team Alpha"`
- **Process:**
  1. First captain reports win (1/2 confirmations)
  2. Second captain confirms win (2/2 confirmations)
  3. Both confirmations trigger:
     - MMR updates (winner gains, loser loses)
     - Match recorded in history
     - Channel deleted after 60 seconds
     - Both teams notified

---

### /history
Display match history for a team
- **Requires:** Everyone
- **Options:**
  - `team` (optional): Team name (defaults to your team)
- **Example:** `/history team: "Team Alpha"`
- **Response:** Shows last 10 matches with dates, results, opponents

---

## 🔧 Admin Commands

### /setmmr
Manually adjust a team's MMR
- **Requires:** Administrator
- **Options:**
  - `team` (required): Team name
  - `value` (required): New MMR value (cannot go below 0)
- **Example:** `/setmmr team: "Team Alpha" value: 1500`
- **Response:** Shows old and new MMR

---

### /resetseason
Reset all teams for a new tournament season
- **Requires:** Administrator
- **Options:** None
- **Action:**
  - All teams reset to 1000 MMR
  - All win/loss records reset to 0
  - All matches archived
  - Queue cleared
- **Example:** `/resetseason`
- **Caution:** This action cannot be undone

---

## 📊 Understanding MMR & Ranks

### MMR (Matchmaking Rating) System
- **Formula:** Uses modified Elo rating system
- **K-Factor:** 32 (amount MMR changes per match)
- **Base MMR:** 1000 (starting point for new teams)

### Example MMR Changes
```
Scenario 1: Higher rated team wins (expected)
- Winner: +12 MMR
- Loser: -12 MMR

Scenario 2: Lower rated team wins (upset)
- Winner: +28 MMR
- Loser: -28 MMR

Scenario 3: Equal teams
- Winner: +16 MMR
- Loser: -16 MMR
```

### Rank Progression
| Rank | MMR Range | Progress |
|------|-----------|----------|
| 🟠 Bronze | 0-499 | Beginner |
| ⚪ Silver | 500-999 | Intermediate |
| 🟡 Gold | 1000-1499 | Advanced |
| ⚫ Platinum | 1500-1999 | Expert |
| 🔵 Diamond | 2000-2499 | Master |
| 🔴 Master | 2500-2999 | Elite |
| 🟣 Grandmaster | 3000+ | Peak |

---

## 📋 Typical Match Workflow

### Step 1: Team Setup
```
/createteam name: "Team Alpha"
/setcaptain user: @Captain team: "Team Alpha"
/addmember user: @Player2 team: "Team Alpha"
/addmember user: @Player3 team: "Team Alpha"
```

### Step 2: Queue for Match
```
/queue team: "Team Alpha"
```
(Wait for opponent)

### Step 3: Private Match Channel
- Bot creates private channel
- Only captains can see/chat
- Match begins

### Step 4: Report Result
```
/win team: "Team Alpha"
```
- First captain reports
- Opponent confirms with same command
- MMR updates automatically
- Channel closes

### Step 5: Check Results
```
/rank team: "Team Alpha"
/history team: "Team Alpha"
/leaderboard
```

---

## ⚙️ Configuration

### Changing Rank Thresholds
Edit `src/utils/database.js`:
```javascript
const DEFAULT_RANKS = [
  { name: 'Bronze', minMMR: 0, color: '#CD7F32' },
  { name: 'Silver', minMMR: 500, color: '#C0C0C0' },
  // ... modify as needed
];
```

### Adjusting MMR Volatility
Edit `src/utils/mmr.js`:
```javascript
const K_FACTOR = 32; // Higher = bigger changes
```

---

## 🆘 Troubleshooting

### Command not working
- Ensure you have the required permissions
- Check that the bot has permission to respond in the channel
- Verify all required options are provided

### Team not found
- Check team name spelling (case-sensitive)
- Use `/leaderboard` to see all existing teams

### Can't queue
- Must be team captain to queue
- Team must not already be in queue or match

### MMR didn't update
- Both captains must use `/win` command
- Check that match completed successfully

---

## 📞 Quick Links

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Server Setup](../SETUP.md)
- [Full README](../README.md)
