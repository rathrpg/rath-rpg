# Point Crawl → Rath Rules Integration TODO

## Changes Needed:

### 1. Character Creation (HIGH PRIORITY)
- [x] Update HTML to show proper Rath character creation UI
- [ ] Validate stat array is exactly [3,2,2,1,1,0] in any order  
- [ ] Add aptitude selection (2 aptitudes)
- [ ] Add equipment pack selection (Combat/Scout/Caster/Specialist)
- [ ] Calculate HP = 10 + CON (not 8 + CON)
- [ ] Calculate AC = 10 + DEX + armor bonus
- [ ] Calculate Inventory Slots = 10 + CON
- [ ] Store aptitudes with character

### 2. Skill Checks (HIGH PRIORITY)
- [ ] Change from 2d6 to **d20 + stat >= DC 12**
- [ ] Implement advantage system (2d20, take higher) when aptitude applies
- [ ] Map aptitudes to relevant checks:
  - melee → STR attacks
  - ranged → DEX attacks
  - stealth → DEX (sneaking)
  - perception → WIS (spotting)
  - persuasion → CHA (social)
  - magic → INT (spells)
  - survival → WIS (tracking, nature)
  - athletics → STR (climbing, swimming)

### 3. Combat (HIGH PRIORITY)
- [ ] Use d20 + STR for melee attacks
- [ ] Use d20 + DEX for ranged attacks
- [ ] Apply advantage when relevant aptitude applies
- [ ] Crits on natural 20
- [ ] Critical failures on natural 1

### 4. Equipment Packs
**Combat Pack:**
- Medium armor (+2 AC, 3 slots)
- Standard weapon (d8 damage, 2 slots)
- Shield (+1 AC, 1 slot)
- Torches
- Rations (UD8)
- 2d6+5 copper

**Scout Pack:**
- Light armor (+1 AC, 2 slots)
- Bow (d6 damage, 2 slots)
- Dagger (d6 damage, 1 slot)
- Rope 50ft
- Lantern
- Rations (UD8)
- 2d6+5 copper

**Caster Pack:**
- Staff (d6 damage, 1 slot)
- Candles
- Blank book
- Tinderbox
- Lantern
- Rations (UD8)
- 2d6+5 copper

**Specialist Pack:**
- Light armor (+1 AC, 2 slots)
- 2 daggers (d6 damage, 1 slot each)
- Lockpicks
- Rope 50ft
- Grappling hook
- Rations (UD8)
- 2d6+5 copper

### 5. Adventure Generator Prompt
- [ ] Update AI prompt to generate adventures using Rath rules
- [ ] Specify d20 + stat checks, DC 12 default
- [ ] Enemies should have proper Rath stats

## Implementation Priority:
1. Fix character creation stat validation
2. Fix skill checks (d20 instead of 2d6)
3. Implement advantage system
4. Update combat rolls
5. Add equipment packs properly
6. Update adventure generator prompt

## Notes:
- Keep the sample adventure for now (can update later to better match Rath)
- Focus on making the mechanics work correctly first
- Polish UI/text later
