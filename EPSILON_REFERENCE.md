# 📋 ε-Greedy Quick Reference

## Current Configuration

```javascript
EXPLORATION THRESHOLDS:
  0-20 actions   → ε = 0.30 (30% explore)
  20-50 actions  → ε = 0.20 (20% explore)
  50-100 actions → ε = 0.10 (10% explore)
  100+ actions   → ε = 0.05 (5% explore)
```

---

## Decision Flow

```
chooseAction(bot, state, env, actions)
  ├─ Calculate epsilon = getExplorationRate(state)
  ├─ Random roll (0-1)
  │
  ├─ IF roll < epsilon:
  │  ├─ 🧪 EXPLORATION MODE
  │  ├─ Pick random from Object.keys(actions)
  │  ├─ Log with 🧪 or 🔍 emoji
  │  └─ Return randomAction
  │
  └─ ELSE:
     ├─ 🎯 EXPLOITATION MODE
     ├─ Use subGoal switch (existing logic)
     ├─ Return recommended action
     └─ Log action choice
```

---

## Integration with Feedback System

```
CYCLE 1-20:
  ├─ 30% random exploration
  ├─ Lots of negative rewards
  ├─ actionHistory fills up
  └─ Scores still near 0

CYCLE 20-50:
  ├─ 20% random exploration
  ├─ Start seeing patterns
  ├─ shouldSkipAction() begins filtering
  └─ Best actions emerge

CYCLE 50-100:
  ├─ 10% random exploration
  ├─ Clear winners identified
  ├─ Negative scores filtered by shouldSkipAction()
  └─ More stable strategy

CYCLE 100+:
  ├─ 5% random exploration (occasional)
  ├─ Very stable behavior
  ├─ Occasional discovery (5% chance)
  └─ Mostly pattern following
```

---

## Console Output Examples

### 🧪 Exploration Triggered
```
🧪 [EXPLORER] Testando ação aleatória: walk_random
```

### 🎯 Exploitation (Using SubGoal)
```
▶️ COLLECT_WOOD
  (Normal subGoal-based decision)
```

### Dashboard Update
```
🧠 Learning: Actions=45 | Epsilon=20% | Mode=🔍 EXPLORING
🧠 Learning: Actions=87 | Epsilon=10% | Mode=🎯 EXPLOITING
🧠 Learning: Actions=156 | Epsilon=5% | Mode=🔍 EXPLORING
```

---

## Adjustment Guide

### To Increase Exploration
```javascript
if (actionCount < 20) return 0.5      // 50% instead of 30%
if (actionCount < 50) return 0.3      // 30% instead of 20%
if (actionCount < 100) return 0.2     // 20% instead of 10%
return 0.1                            // 10% instead of 5%

Result: Bot more curious, finds strategies faster,
        but takes longer to commit
```

### To Decrease Exploration
```javascript
if (actionCount < 50) return 0.1      // 10% instead of 20%
if (actionCount < 100) return 0.05    // 5% instead of 10%
return 0.01                           // 1% instead of 5%

Result: Bot more focused, reliable execution,
        might miss better strategies
```

---

## Files Modified

| File | Change |
|------|--------|
| brain.js | Added `getExplorationRate()` |
| brain.js | Modified `chooseAction()` to implement ε-greedy |
| brain.js | Pass `actions` parameter to `chooseAction()` |
| brain.js | Enhanced dashboard with epsilon display |

---

## What ε-Greedy Enables

```
Before Feedback System:
  └─ Fixed sequence: wood → planks → table → stone → pickaxe

After Feedback System:
  └─ Avoids failing actions, but follows fixed path

After ε-Greedy:
  └─ Learns AND discovers:
     ├─ Different mining locations
     ├─ Optimal resource gathering order
     ├─ Better pathfinding
     └─ Hybrid strategies
```

---

## Potential Issues & Fixes

### Issue: Bot gets stuck exploring
**Solution:** Increase shouldSkipAction() threshold
```javascript
// Current: score < -0.5 after 3 attempts
// More strict: score < -0.2 after 2 attempts
```

### Issue: Bot never explores
**Reason:** Epsilon too low, or always blocked by shouldSkipAction()
**Solution:** Check getExplorationRate() and logs

### Issue: Scores plateauing
**Meaning:** Bot found local optimum, stuck
**Solution:** Increase epsilon temporarily
```javascript
// Force exploration in stuck situations
if (isStuck) return 0.3  // Force exploration
```

---

## Monitoring Commands

```bash
# Check log for exploration events
grep "EXPLORER\|EXPLOITING" logs/bot_*.log | tail -20

# Extract action scores over time
grep "Action result" logs/bot_*.log | awk '{print $NF}'

# See exploration rate progression
grep "Epsilon=" logs/bot_*.log | tail -10
```

---

## Scenarios

### Scenario 1: Early Learning (10 actions)
```
Mode: 🧪 Heavy exploration (30%)
Why: Bot has no knowledge yet
Goal: Discover what actions exist
```

### Scenario 2: Mid Learning (50 actions)
```
Mode: 🎯 Balanced (20% explore, 80% exploit)
Why: Bot knows some answers
Goal: Validate best practices, discover outliers
```

### Scenario 3: Mature (150 actions)
```
Mode: 🎯 Mostly exploitation (95%)
Why: Bot mastered the game
Goal: Execute known strategies, occasional innovation
```

---

## Future Enhancements

### Contextual ε
```javascript
// Explore more when uncertain, less when confident
const uncertainty = calculateUncertainty(state, action)
return 0.05 + (uncertainty * 0.2)  // Dynamic epsilon
```

### Adaptive ε
```javascript
// Increase epsilon when score improves slowly
if (recentImprovement < 0.01) {
    return Math.min(epsilon * 1.5, 0.3)  // Boost exploration
}
```

### Action-Specific ε
```javascript
// Different exploration rates per action
const actionEpsilon = {
    "collect_wood": 0.05,      // High confidence
    "mine_stone": 0.20,        // Uncertain
    "craft_table": 0.02,       // Very confident
}
```

---

## Summary

**ε-Greedy Formula:**
- Select random action with probability ε
- Select best action with probability (1 - ε)
- Epsilon decreases as bot learns

**In MineAI:**
- Starts at 30%, curves down to 5%
- Integrated with feedback system's shouldSkipAction()
- Visible in console dashboard

**Result:**
- Active learning (exploration) + passive learning (feedback)
- Emergent strategy discovery
- Continuous improvement over time

🚀 **This is adaptative AI!**
