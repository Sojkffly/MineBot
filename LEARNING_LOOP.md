# 🧠 MineAI Learning Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEEDBACK SYSTEM FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1️⃣  DECISION PHASE
   ┌──────────────────────┐
   │  getEnvironment()    │ ← Sensors read world state
   │  (FOV, raycast,      │
   │   inventory, health) │
   └─────────────┬────────┘
                 ↓
   ┌──────────────────────────────────────┐
   │  chooseAction(bot, state, env)       │ ← Brain decides
   │  (Match on subGoal)                  │
   └─────────────┬────────────────────────┘
                 ↓
   ┌──────────────────────────────────────┐
   │  shouldSkipAction() ← NEW!            │
   │  Check: score < -0.5 AND tries >= 3? │
   │  ├─ YES → Use fallback (explore)     │
   │  └─ NO  → Execute planned action     │
   └─────────────┬────────────────────────┘
                 ↓
   Returns: "action_name" (string)

2️⃣  EXECUTION PHASE
   ┌──────────────────────────────────────┐
   │  actions[actionName].execute()       │ ← Action runs
   │  (10 modular action files)           │
   └─────────────┬────────────────────────┘
                 ↓
   Returns: { success: bool, reward: number }
            
   Reward Examples:
   ├─ collect_wood OK  → reward: +1.0
   ├─ collect_wood fail → reward: -0.5
   ├─ craft error      → reward: -1.0
   └─ explore progress → reward: +0.3

3️⃣  RECORDING PHASE (NEW LEARNING INFRASTRUCTURE)
   ┌─────────────────────────────────────────────┐
   │  Record to actionHistory:                   │
   │  ┌─────────────────────────────────────┐    │
   │  │ {                                   │    │
   │  │   action: "collect_wood",           │    │
   │  │   reward: +1.0,                     │    │
   │  │   time: 1234567890,                 │    │
   │  │   duration: 450ms                   │    │
   │  │ }                                   │    │
   │  │ [Keep last 100 entries]             │    │
   │  └─────────────────────────────────────┘    │
   └──────────────────┬────────────────────────┘
                      ↓
   ┌──────────────────────────────────────────┐
   │  Calculate Score:                        │
   │  getActionScore("collect_wood")          │
   │  = sum(rewards) / count                  │
   │  = (1.0 + (-0.5) + 1.0 + 1.0) / 4        │
   │  = 0.75 → 75% EFFECTIVE                  │
   └──────────────────┬────────────────────────┘
                      ↓
   ┌──────────────────────────────────────────┐
   │  Update actionScores:                    │
   │  state.actionScores["collect_wood"]=0.75 │
   └──────────────────────────────────────────┘

4️⃣  VISIBILITY PHASE (Every 6 seconds)
   ┌──────────────────────────────────────────┐
   │  Display Dashboard:                      │
   │                                          │
   │  ❤️  18/20 | 🍖 15/20 | 📍 (123, 64)     │
   │  🏆 Best: collect_wood(0.9),...          │
   │  💔 Worst: mine_stone(-0.7),... ← SKIP  │
   └──────────────────────────────────────────┘

5️⃣  ADAPTATION PHASE (NEXT CYCLE)
   ┌────────────────────────────────────────┐
   │  LEARNING IN ACTION:                   │
   │                                        │
   │  Next time chooseAction() is called:   │
   │                                        │
   │  if (shouldSkipAction(state, X)) {     │
   │    // Action X scored < -0.5           │
   │    // Been tried 3+ times              │
   │    logger.warning('X has poor score') │
   │    return "explore"  // Fallback!      │
   │  }                                      │
   │                                        │
   │  ✨ BOT ADAPTED TO FAILURE ✨          │
   └────────────────────────────────────────┘

```

---

## 📊 Score Evolution Example

```
Time      Action           Result           Score (avg)
──────────────────────────────────────────────────────
1         collect_wood     +1.0 ✅           +1.0
2         collect_wood     +1.0 ✅           +1.0
3         mine_stone       -0.5 ❌           -0.5
4         mine_stone       -0.5 ❌           -0.5
5         craft            +1.0 ✅           +1.0
6         collect_wood     +1.0 ✅           +0.93 ← Improving!
7         mine_stone       -0.5 ❌           -0.5  ← Consistent failure
8         explore          +0.3 ✅           +0.3
9         mine_stone       -0.5 ❌           -0.5  ← 3rd failure!
                                           ↓
                                   [SKIP TRIGGERED!]
                                   Bot switches to explore
10        explore          +0.5 ✅           +0.35 (fallback works)
```

---

## 🎯 Decision Tree in Action

```
START: Bot in "get_stone" phase

chooseAction() switches on subGoal:
   case "get_stone":
      ├─ Has pickaxe? NO
      ├─ Stone nearby? YES
      │  └─ shouldSkipAction("mine_stone")?
      │     ├─ Score = -0.5 (from history)
      │     ├─ Attempts = 5 (> 3)
      │     └─ ANSWER: YES → SKIP IT!
      │
      └─ Return "explore" (fallback)

RESULT: Instead of failing at mining again,
        bot explores for new stone deposits
```

---

## 💾 Data Structures

### actionHistory[] (Rolling Buffer)
```javascript
[
  { action: "collect_wood", reward: 1.0, time: 1000, duration: 450 },
  { action: "craft", reward: 1.0, time: 1500, duration: 200 },
  { action: "mine_stone", reward: -0.5, time: 2000, duration: 600 },
  // ... up to 100 entries
]
```

### actionScores{} (Live Metrics)
```javascript
{
  "collect_wood": 0.93,    // 14/15 successful
  "craft": 1.0,            // 8/8 successful
  "mine_stone": -0.5,      // 5 failures in a row ← SKIP ZONE
  "explore": 0.35,         // 7/20 successful (backup)
  "unstuck": 0.3,          // Utility action
}
```

---

## 🚀 Why This Matters

### Without Feedback System (Old):
```javascript
case "get_stone":
  return "mine_stone"  // Always, regardless of results
  // ❌ Fails repeatedly, bot stuck in loop
```

### With Feedback System (New):
```javascript
case "get_stone":
  if (shouldSkipAction(state, "mine_stone")) {
    return "explore"   // Dynamic adaptation!
  }
  return "mine_stone"
  // ✅ Learns from failure, finds new strategy
```

---

## 📈 Scaling to Real ML

This architecture is ready to integrate:
- **Neural Networks:** Export scores as reward signal to Q-learning
- **Genetic Algorithms:** Best action sequences become "traits"
- **Reinforcement Learning:** State → Action → Reward pipeline is built
- **Transfer Learning:** Save learned weights, load in new world

The foundation for **true artificial intelligence** in game-playing AI.
