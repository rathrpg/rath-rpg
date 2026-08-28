# Aptitudes & Leveling System - Implementation Notes

## How Aptitudes Work Now

### Old System (Broken)
- Listed character aptitudes in context
- Told AI "aptitudes grant advantage"
- **Hoped AI remembered what each aptitude does**
- **No mechanical enforcement**

Result: AI forgot aptitude effects after a few turns, didn't apply them correctly.

### New System (Fixed)

**1. Smart Aptitude Detection**

The system now detects when your action might trigger an aptitude and injects the **full aptitude description** into context for that turn:

```javascript
// When you say "I track the wolf through the forest"
// And you have Wild Walker aptitude
// AI receives:

**RELEVANT APTITUDES:**

**Wild Walker:** Advantage to track, hunt, forage, navigate in natural wilderness
```

**Keyword Mapping:**

The system maintains a mapping of action keywords → aptitudes:

| Your Action Contains | Relevant Aptitudes Checked |
|---------------------|---------------------------|
| track, hunt, forage, navigate | Wild Walker |
| sneak, hide, stealth | Move Silently and Unseen |
| lock, pick, trap, disable | Break and Enter |
| attack, backstab, ambush | Backstab, Dagger Master |
| attack, kill | Cleave |
| persuade, negotiate, talk | Silver Tongue |
| heal, tend, cure | Heal |
| rage, fury, berserk | Berserker |
| aim, shoot, archery | Marksman, Hawkeye |
| secret, trap, hidden | Dungeon Sense |
| undead, zombie, skeleton | Turn Undead |

**2. Response Validation**

After every AI response, the system checks for common rule violations:

- ❌ Illegal bonuses (proficiency, skill, expertise)
- ❌ Missing stat labels on rolls (d20+2 without saying what stat)
- ❌ Non-standard DCs (should be 10/12/15/18/20)
- ❌ STR bonus on ranged damage (only melee gets STR)
- ❌ Advantage stacking

Violations are logged to console. You can enable user warnings by uncommenting the line in `sendToAI()`.

**Example Caught Violation:**

```
AI says: "Roll d20 + 5 proficiency bonus"
System logs: 🚫 Illegal bonus detected: "+5 proficiency" - Only stats grant bonuses
```

**3. Always-On Aptitude Reference**

All character aptitudes are listed in context every turn with the character sheet, reminding the AI what the character can do.

## XP and Leveling System

### Implementation

**1. XP Tracking**

- Characters start with `xp: 0` at level 1
- "+XP" button in game header awards 1 XP
- XP displays in character sheet: `XP: 2/3` (have/needed)

**2. Level Up Button**

- Appears when `XP >= current level`
- Opens modal with level-up workflow

**3. Level Up Process (Following Rath Rules)**

**Step 1: Roll HP**
- Roll `(new level)d8 + CON`
- If higher than current max → new max HP
- If equal or lower → add 1 to max HP
- Button shows result with dice breakdown

**Step 2: Increase Stat**
- Choose one stat to increase by +1
- Dropdown shows all stats with current values

**Step 3: Gain Aptitude (at levels 3, 5, 7, 9)**
- If leveling to 3/5/7/9, select new aptitude
- Dropdown shows all skill and inherent aptitudes
- Shows description when selected

**Step 4: Apply**
- Spends XP (cost = old level)
- Increases level
- Sets new max HP and heals to full
- Increases chosen stat
- Adds new aptitude if applicable
- Recalculates AC, inventory slots
- Saves and displays confirmation

### UI Elements

**Setup Screen:**
- Character display shows XP: X/Y

**Game Screen:**
- "+XP" button (always visible)
- "Level Up" button (only when ready)
- Character status shows level

**Level Up Modal:**
- HP rolling with dice visualization
- Stat selection dropdown
- Aptitude selection (when applicable)
- Validation prevents skipping steps

## Testing Checklist

### Aptitude Detection
- [ ] Say "I track the wolf" with Wild Walker → AI receives aptitude description
- [ ] Say "I sneak past the guard" with Move Silently → AI receives aptitude description
- [ ] Say "I pick the lock" without Break and Enter → No aptitude reminder
- [ ] Attack with Backstab while hidden → AI receives Backstab description

### Response Validation
- [ ] AI adds proficiency bonus → Logged to console
- [ ] AI rolls "d20+3" without stat label → Warning logged
- [ ] AI uses DC 14 → Warning about non-standard DC

### XP and Leveling
- [ ] Click "+XP" → XP increases, displayed in header
- [ ] Reach required XP → Level Up button appears
- [ ] Click Level Up → Modal opens
- [ ] Roll HP → Shows dice breakdown
- [ ] Select stat → Increases by 1
- [ ] Level 2→3 → Requires aptitude selection
- [ ] Apply level up → Character updated, XP spent, confirmation shown
- [ ] Level up applies AC/slots recalculation

## Files Changed

1. `/vault/Rath - Rules/Publishing/Website/docs/js/solo-play.js`
   - Added `findAptitude()` helper
   - Rewrote `buildDynamicRulesContext()` with keyword mapping
   - Added `validateAIResponse()` function
   - Added validation to `sendToAI()`
   - Added `awardXP()` function
   - Added `showLevelUpModal()` function
   - Added `rollLevelUpHP()` and `applyLevelUp()` global functions
   - Updated `renderCharacter()` to show XP
   - Updated `updateGameHeader()` to toggle level-up button
   - Added XP to character creation

2. `/vault/Rath - Rules/Publishing/Website/docs/solo-play.md`
   - Added "+XP" button to game header
   - Added "Level Up" button to game header

## Known Limitations

1. **Aptitude detection is keyword-based** - If you phrase an action in an unusual way, it might not detect the aptitude. Solution: Add more keywords to the mapping.

2. **Validation is heuristic** - It catches common mistakes but not all possible violations. More validation rules can be added.

3. **No multi-class or variant advancement** - Follows standard Rath progression only.

4. **XP is manual** - You have to click "+XP" after each session. Could be automated to award XP based on time played or challenges overcome.

## Future Improvements

1. **Auto-XP** - Award XP automatically based on:
   - Combat encounters won
   - Challenges overcome
   - Time played (1 XP per 2 hours?)

2. **Aptitude Suggestions** - When leveling up, suggest aptitudes based on play style:
   - If you sneak a lot → suggest stealth aptitudes
   - If you fight a lot → suggest combat aptitudes

3. **Validation Warnings in UI** - Instead of just console logging, show warnings to user:
   ```
   ⚠️ AI may have applied proficiency bonus incorrectly
   ```

4. **Extended Thinking for Rules** - Use Claude's extended thinking mode when combat starts or complex situations arise to ensure rules are followed carefully.

5. **Rule Correction Prompts** - If validation detects an error, automatically send a correction:
   ```
   "Actually, in Rath there are no proficiency bonuses. Please recalculate using only the stat bonus."
   ```

Let me know if you want any of these additions!
