# Quick Actions Feature - Implementation

## Overview

Added quick action buttons to the character panel for common in-game actions: short rest, long rest, spending fortune, rolling stat checks, and using items.

## Quick Actions Available

### 1. Short Rest Button
**What it does:**
- Heals 1d6 + CON HP
- Takes 1 hour in-game time
- Posts result to chat with dice breakdown

**Example output:**
```
⏸️ Short Rest (1 hour)
Rolled 1d6+2 (CON) = 4+2 = 6
Healed 6 HP (8 → 14/14)
```

### 2. Long Rest Button
**What it does:**
- Heals to full HP
- Regains 1 Fortune point
- Takes 8 hours in-game time
- All abilities recharge
- Posts summary to chat

**Example output:**
```
🛌 Long Rest (8 hours)
Fully healed (8 → 14)
All abilities recharged
Fortune: 2/3
```

### 3. Fortune Button
**What it does:**
- Spends 1 Fortune point
- Posts reminder to chat
- Button shows current Fortune count
- Disabled when Fortune = 0

**Example output:**
```
🍀 Spent 1 Fortune
Reroll your last check and take the higher result.
Fortune remaining: 1/3
```

**Visual state:**
- Active: Orange button, shows `Fortune (2)`
- Empty: Grayed out, disabled, shows `Fortune (0)`

### 4. Roll Check Button
**What it does:**
- Opens stat selection prompt
- Rolls d20 + chosen stat
- Shows result with color coding
- Detects crits (nat 20) and fails (nat 1)

**Prompt:**
```
Roll which stat?
1. STR (+2)
2. DEX (+3)
3. INT (+1)
4. WIS (+2)
5. CON (+3)
6. CHA (+0)

Enter 1-6:
```

**Example outputs:**

Success (≥12):
```
🎲 DEX Check
d20 + 3 (DEX) = 15 + 3 = 18 ✓
```

Critical Success (nat 20):
```
🎲 STR Check
d20 + 2 (STR) = 20 + 2 = 22 🎯 CRITICAL SUCCESS!
```

Critical Failure (nat 1):
```
🎲 INT Check
d20 + 1 (INT) = 1 + 1 = 2 💥 Critical Failure
```

### 5. Use Item Buttons
**What it does:**
- Each item gets a small "Use" button
- Detects consumables automatically
- Prompts for confirmation on consumables
- Removes consumed items from inventory
- Posts usage to chat

**Consumable detection:**
Items containing these words are treated as consumables:
- potion
- ration
- scroll
- torch
- arrow
- bolt
- charge

**Example flow:**

For consumables:
1. Click "Use" on "Healing Potion"
2. Popup: "Use/consume Healing Potion? This will remove it from your inventory."
3. If confirmed:
```
📦 Using: Healing Potion
Item consumed and removed from inventory.
```

For non-consumables:
```
📦 Using: Rope 50ft
Used item (describe effect).
```

## Button Layout

```
┌─────────────────────────────────┐
│ Quick Actions:                  │
├─────────────────┬───────────────┤
│ Short Rest      │ Long Rest     │
├─────────────────┼───────────────┤
│ Fortune (2)     │ Roll Check    │
└─────────────────┴───────────────┘
```

2x2 grid layout, evenly spaced buttons.

## Color Coding

- **Short Rest** → Blue (`#4a90e2`)
- **Long Rest** → Purple (`#6b46c1`)
- **Fortune** → Orange (`#f59e0b`)
- **Roll Check** → Green (`#10b981`)
- **Use Item** → Gray (`#6b7280`)

## Game Rules Applied

### Short Rest
- Rath rule: 1 hour, heal 1d6 + CON
- Correctly adds CON modifier
- Can't exceed max HP

### Long Rest
- Rath rule: 8 hours, full heal, abilities recharge
- Restores HP to max
- Adds 1 Fortune (max 3)
- Notes all abilities recharge

### Fortune
- Rath rule: Max 3 Fortune points
- Start each session with 1
- Gain 1 on nat 20
- Spend to reroll any check

### Stat Checks
- Rath rule: d20 + stat vs DC 12
- Shows stat bonus clearly
- Color codes results:
  - Green = success (≥12)
  - Red = failure (<12)
  - Orange = critical (nat 1 or 20)

## Auto-Updates

All actions automatically:
1. Update `gameState.character`
2. Save to localStorage
3. Call `updateGameHeader()` to refresh display
4. Post system message to chat
5. Refresh character panel if visible

## Technical Implementation

### Functions (global scope)

**`window.quickShortRest()`**
- Rolls 1d6, adds CON
- Clamps healing to max HP
- Posts formatted message

**`window.quickLongRest()`**
- Sets HP to max
- Adds 1 Fortune (max 3)
- Posts summary

**`window.quickSpendFortune()`**
- Decrements Fortune
- Checks for zero first
- Posts reminder

**`window.quickRollStat()`**
- Prompts for stat selection
- Rolls d20 + stat
- Color codes based on result
- Detects crits

**`window.quickUseItem(itemIndex)`**
- Takes array index as parameter
- Detects consumables by keyword
- Prompts for confirmation
- Removes from equipment array if consumed

### Message Format

All quick actions use `appendMessage('system', ...)` so they appear as system messages (yellow/gold background, centered).

Format:
```
[emoji] <strong>Action Name</strong><br>
Details and results<br>
Current state
```

### Equipment "Use" Buttons

Generated inline in the equipment list:
```html
<div style="display:flex;justify-content:space-between;">
  <span>• Healing Potion</span>
  <button onclick="quickUseItem(0)">Use</button>
</div>
```

## Usage

### Player Workflow

**Short Rest:**
1. Click "Short Rest" in character panel
2. Healing automatically rolls and applies
3. See result in chat

**Long Rest:**
1. Click "Long Rest"
2. Full heal instantly
3. See summary in chat

**Spend Fortune:**
1. Roll fails or close call
2. Click "Fortune (2)" button
3. Fortune decremented
4. Manually reroll (or ask AI to reroll)

**Roll Check:**
1. Click "Roll Check"
2. Enter stat number (1-6)
3. See d20 result in chat
4. Tell AI the result if needed

**Use Item:**
1. Find item in equipment list
2. Click "Use" button next to it
3. If consumable, confirm
4. Tell AI what you're doing with it

## Benefits

### For Players
- **No need to remember mechanics** — buttons do the math
- **Faster gameplay** — one click instead of typing
- **Clear feedback** — dice breakdowns and color coding
- **Reduced errors** — no manual HP tracking mistakes

### For AI Integration
- System messages provide context
- AI sees "Player took a short rest, healed 6 HP"
- AI can respond appropriately
- Keeps game state in sync

## Future Enhancements

### Possible Additions

1. **Healing Potions**
   - Detect healing potions specifically
   - Auto-roll healing dice
   - Apply HP gain

2. **Aptitude Uses**
   - Buttons for limited-use aptitudes
   - "Use Berserker Rage (2/4 left)"
   - Track uses per rest

3. **Spell Slot Tracking**
   - For characters with Circle of Magic
   - Show burnt spells
   - Unburn on short rest

4. **Combat Actions**
   - Quick attack roll
   - Damage roll
   - Initiative roll

5. **Death Save Tracking**
   - At 0 HP, show death save button
   - Track successes/failures
   - Auto-stabilize at 3

6. **Custom Macros**
   - Let player define custom quick actions
   - "Roll Backstab" = d20+DEX with advantage, then 2d6+STR damage
   - Save macros per character

## Testing Checklist

- [ ] Short Rest heals correct amount (1d6+CON)
- [ ] Short Rest doesn't exceed max HP
- [ ] Long Rest fully heals and regains Fortune
- [ ] Fortune button disabled when Fortune = 0
- [ ] Fortune button re-enables after Long Rest
- [ ] Roll Check prompts for stat
- [ ] Roll Check shows color-coded result
- [ ] Roll Check detects nat 20 (crit)
- [ ] Roll Check detects nat 1 (fail)
- [ ] Use Item detects consumables correctly
- [ ] Use Item prompts for confirmation on consumables
- [ ] Use Item removes consumed items from inventory
- [ ] Character panel updates after each action
- [ ] All actions post to chat log

## Files Modified

1. `/vault/Rath - Rules/Publishing/Website/docs/js/solo-play.js`
   - Added "Quick Actions" section to `updateCharacterPanel()`
   - Added 5 global quick action functions
   - Equipment list now includes "Use" buttons

2. `/vault/Rath - Rules/Publishing/Website/docs/stylesheets/solo-play.css`
   - Already had roll result color classes
   - Button styling inherits from inline styles

## Notes

- All functions check `if (!gameState.character)` before proceeding
- Fortune button uses disabled state and opacity when unavailable
- Roll Check uses browser `prompt()` for simplicity (could be modal later)
- Consumable detection is heuristic (keyword-based)
- Non-consumables can still be "used" but aren't removed
- All actions respect max values (HP, Fortune)
