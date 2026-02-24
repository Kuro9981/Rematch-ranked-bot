# 🎮 Auto Queue System - Setup Guide

## 📋 Overview

The **Auto Queue System** is an automatic team matching system that:
- Keeps a continuous queue of teams waiting for matches
- Uses **exponential range growth** to balance matchmaking fairness and queue times
- Polls every **3 seconds** to find optimal matches
- Displays live queue status in a dedicated Discord channel

---

## ⚙️ How It Works

### The Exponential Range System

When a team joins the queue, it starts with a **±100 MMR range** for matching. Every minute, the range increases exponentially:

```
Range = 100 × 1.5^(minutes_waited)

Minute 0-1:  ±100 MMR
Minute 1-2:  ±150 MMR
Minute 2-3:  ±225 MMR
Minute 3-4:  ±338 MMR
Minute 4-5:  ±506 MMR
...
```

**Purpose**: 
- Teams get fair matches quickly at first
- If no match found, range expands to avoid infinite queue waits
- Guarantees a match within 5-7 minutes for any team

### Match Finding Process

**Every 3 seconds**, the system:
1. Checks each team in the queue
2. Calculates its current MMR range (based on wait time)
3. Finds the first compatible team within that range
4. Creates a match if two teams are found
5. Removes matched teams from queue
6. Updates the queue display

---

## 🛠️ Setup Instructions

### Step 1: Admin Sets Up Queue Channel

```
/queuesetup channel: #match-queue
```

This command:
- Designates a Discord channel for the queue
- Creates an initial queue status message
- Enables auto-polling for that guild

> **Required Permission**: Administrator

### Step 2: Teams Join the Queue

```
/autojoinqueue team: TeamName
```

Requirements:
- Must be the **team captain**
- Team must be created with `/createteam`
- Cannot join if already in queue

Teams can now wait for automatic matching!

### Step 3: Teams Leave the Queue (Optional)

```
/leavequeue team: TeamName
```

Requirements:
- Must be the team captain
- Team must currently be in queue

---

## 📊 Queue Display

The queue channel shows:

```
📋 Match Queue

1. Alpha Team - 1250 MMR (⏱️ 2m, 📊 ±150)
2. Beta Squad - 1200 MMR (⏱️ 0m, 📊 ±100)
3. Gamma Force - 3500 MMR (⏱️ 5m, 📊 ±2256)

⏳ Status: Finding matches...
👥 Teams in Queue: 3
🤖 System: Auto-polling every 3 seconds
```

**Legend**:
- `⏱️ Xm` = Minutes waited
- `📊 ±N` = Current MMR range for matching

---

## 🎯 Matching Example

**Queue State**:
- Team A: 1000 MMR (0 min wait) → Range: ±100
- Team B: 1050 MMR (0 min wait) → Range: ±100
- Team C: 2000 MMR (1.5 min wait) → Range: ±150

**3 seconds after polling**:
- Team A checks for match: Looks for 900-1100 MMR
- Finds Team B (1050 MMR) ✅ **MATCH!**
- Team C still waiting (no team in 1850-2150 range)
- Match channel created between A & B
- Both captains get DM notification

---

## 🔄 Complete User Flow

```
1. Admin: /queuesetup channel: #queue
   → Queue system activated

2. Captain (Team A): /autojoinqueue team: "Alpha"
   → Team added to queue, appears in channel

3. Captain (Team B): /autojoinqueue team: "Beta"
   → 3 seconds later...

4. [AUTO-MATCHED] 
   → Private match channel created
   → Both captains notified via DM
   → Queue updated in channel

5. Captains: /win
   → Confirm match result
   → MMR adjusted
   → Match channel deleted after 60s

6. Captain (Team C): /autojoinqueue team: "Gamma"
   → Waiting in queue with expanding range
   → Eventually matched with next available team
```

---

## 📈 Configuration

### Current Settings (in code)

| Setting | Value |
|---------|-------|
| Polling Interval | 3 seconds |
| Initial Range | ±100 MMR |
| Range Multiplier | 1.5 (exponential) |
| Range Formula | 100 × 1.5^(minutes) |

### To Customize

Edit `src/utils/queueMatcher.js`:

```javascript
// Change initial range (currently 100):
const range = YOUR_NUMBER * Math.pow(1.5, waitTimeMinutes);

// Change multiplier (currently 1.5):
const range = 100 * Math.pow(YOUR_MULTIPLIER, waitTimeMinutes);

// Change polling interval (currently 3000ms) in autoQueueManager.js:
}, 3000); // Change this value
```

---

## ⚠️ Important Notes

### Queue-Only Teams

Teams joined via `/autojoinqueue` are **separate** from the old `/queue` system:
- Use **either** `/autojoinqueue` **or** `/queue`, not both
- `/autojoinqueue` = automatic matching with exponential range
- `/queue` = manual matching (if still using old system)

### Dual Captain Confirmation

Matches created by autoqueue still require **both captains** to confirm via `/win` command (same as manual matches).

### Channel Permissions

The system needs permission to:
- Send messages in the queue channel
- Edit messages in the queue channel
- Create channels (private match channels)
- Send DMs to team captains

---

## 🐛 Troubleshooting

### Queue Channel Not Working
- Check that admin ran `/queuesetup`
- Verify bot has "Send Messages" permission in channel
- Restart bot

### Teams Not Matching
- Verify teams are in queue (check channel display)
- Check MMR difference isn't huge (use `/rank` to verify)
- Wait a bit - range expands over time

### Not Receiving DMs
- Check Discord DM privacy settings
- Bot needs permission to send DMs
- Try `/leavequeue` and rejoin

---

## 📝 Commands Reference

| Command | Usage | Permission |
|---------|-------|-----------|
| `/queuesetup` | Setup queue channel | Admin |
| `/autojoinqueue` | Join automatic queue | Captain |
| `/leavequeue` | Leave queue | Captain |
| `/rank` | Check team MMR | Any |
| `/win` | Confirm match result | Both Captains |

---

## 🎯 Best Practices

1. **Run one queue per server** - Multiple queues can cause confusion
2. **Verify team creation** - Use `/teaminfo` before joining queue
3. **Check range expansion** - Monitor queue during peak hours
4. **Give feedback** - Report matching issues or suggestions

---

**Need help?** Check bot logs or contact server admins!
