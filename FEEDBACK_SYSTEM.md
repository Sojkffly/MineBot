# 🧠 Feedback System - Emergent Learning Architecture

## Overview
The Minecraft bot now implements a **reward-based learning system** that enables it to:
- ✅ Track performance of each action
- ✅ Calculate success rates automatically
- ✅ Skip failed strategies and adapt dynamically
- ✅ Evolve behavior based on real gameplay results

---

## How It Works

### 1. **Action Reward Structure**
All 10 actions now return:
```javascript
{
  success: boolean,      // Did the action accomplish its goal?
  reward: number         // -1 (critical error) to +1 (success)
}
```

**Reward Scale:**
- `+1.0` = Action succeeded perfectly
- `+0.5` = Partial success / good progress
- `+0.3` = Minor success
- `-0.5` = Failed but recoverable
- `-1.0` = Critical error

### 2. **History Tracking**
Every action is recorded:
```javascript
state.actionHistory = [
  { action: "collect_wood", reward: 1.0, time: 1234567890, duration: 450 },
  { action: "collect_wood", reward: -0.5, time: 1234567900, duration: 380 },
  // ... up to 100 most recent actions
]
```

### 3. **Score Calculation**
```javascript
getActionScore(state, "collect_wood")
  = (1.0 + -0.5 + 1.0 + 1.0) / 4
  = 0.75 (75% effective)
```

### 4. **Action Skipping (The Learning Part)**
```javascript
shouldSkipAction(state, "mine_stone")
  if (average_score < -0.5 AND attempts >= 3) {
    return true  // Skip this action, use fallback
  }
```

**When an action is skipped:**
- Primary action is avoided
- Bot uses "explore" as fallback
- Logs warning with the poor score
- Next cycle tries a different subGoal

---

## Integration in Brain

### Before (Fixed Decisions)
```javascript
case "get_stone":
  return "mine_stone"  // Always mine, even if failing
```

### After (Adaptive Decisions)
```javascript
case "get_stone":
  if (shouldSkipAction(state, "mine_stone")) {
    logger.warning('mine_stone has poor score', { score: -0.3 })
    return "explore"  // Switch strategy dynamically
  }
  return "mine_stone"  // Only if score is good
```

---

## Console Dashboard

Every 6 seconds, the status panel now shows:

```
═══════════════════════════════════════
  📊 STATUS | PROGRESSION → GET_WOOD
───────────────────────────────────────
  ❤️  18/20 | 🍖 15/20 | 📍 (123, 64, -45)
  📦 Wood: 4 logs + 8 planks | Stone: 0 | Tool: 0 pick
  🛠️  Table: ❌ | 🌳 Wood: ✅ | 🗿 Stone: ❌
───────────────────────────────────────
  🏆 Best: collect_wood(0.9), explore(0.6), craft(0.8)
  💔 Worst: mine_stone(-0.7), place_table(-0.3)
═══════════════════════════════════════
```

**Key Insight:** You can literally **watch the bot learn** by seeing action scores improve/degrade.

---

## Action Reward Reference

| Action | Good Case | Bad Case |
|--------|-----------|----------|
| `collect_wood` | +1.0 (wood collected) | -0.5 (tree already mined) |
| `mine_stone` | +1.0 (stone mined) | -0.5 (no nearby stone) |
| `craft` | +1.0 (recipe success) | -1.0 (recipe not found) |
| `craft_table` | +1.0 (crafted) | -1.0 (recipe missing) |
| `craft_pickaxe` | +1.0 (crafted) | -1.0 (not enough materials) |
| `place_table` | +1.0 (placed) | -1.0 (critical fail) / -0.5 (no space) |
| `explore` | +0.5 (reached target) / +0.3 (progress) | -0.5 (max distance exceeded) |
| `unstuck` | +0.3 (escaped) | - (always has exit strategy) |
| `walk` | +0.1 (movement) | - (passive action) |
| `jump_up` | +0.2 (climbed) | - (fallback action) |

---

## Progression Stages

**Stage 1: Wood Age** (Entry → Get_Planks)
- Action: `collect_wood` (must not have score < -0.5)
- Action: `craft` (planks from logs)

**Stage 2: Stone Age** (Craft_Table → Place_Table → Get_Stone)
- Action: `craft_table` (must not fail)
- Action: `place_table` (base establishment)
- Action: `mine_stone` (stone mining)
- Action: `craft_pickaxe`

**Stage 3: Exploration** (Stone_Age_Complete)
- Action: `explore` (open-ended world exploration)

If any main-path action scores < -0.5, bot skips to `explore` and waits for environmental changes.

---

## Emergent Behaviors

As the bot learns:

1. **Early Game (First 20 actions):**
   - All scores near 0 (no history yet)
   - Bot follows default progression

2. **Mid Game (Actions 21-50):**
   - Some actions emerge as successful (score > +0.5)
   - Others marked as risky (score < -0.3)
   - Bot starts skipping bad strategies

3. **Late Game (50+ actions):**
   - Clear winners/losers established
   - Bot optimizes for most reliable path
   - Adapts if primary strategy fails

---

## Files Modified

1. **state.js**
   - Added: `actionHistory[]`, `actionScores{}`, `lastActionTime`

2. **brain.js**
   - Added: `getActionScore()`, `shouldSkipAction()`
   - Modified: `chooseAction()` now checks scores before returning actions
   - Enhanced: Status dashboard shows Best/Worst actions

3. **All 10 action files** (actions/*js)
   - Changed return type from `boolean` → `{success, reward}`
   - Consistent reward structure for learning

---

## Next Evolution

This infrastructure is ready for:
- 🔜 **Iron Age progression** (new actions, furnace mechanics)
- 🔜 **Mob avoidance** (damage tracking, flee mechanics)
- 🔜 **Food management** (hunger-based decisions)
- 🔜 **Machine learning export** (save learned weights, continue in new worlds)

---

## The Philosophy

> "90% of people stop here" — User feedback

The key difference between bots that evolve and those that don't:
- **Blind bots:** Execute fixed sequence forever
- **Reactive bots:** Change based on immediate obstacles
- **Learning bots:** Track causality (action → reward) and optimize 🎓

This system makes MineAI a **learning bot**.
