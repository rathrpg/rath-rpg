# Character Panel Feature - Implementation

## Overview

Added a collapsible character sheet panel that displays during gameplay, showing all character stats, aptitudes with descriptions, equipment, and HP/XP/Fortune in real-time.

## Features

### Toggle Button
- **"📋 Sheet"** button in game header
- Click to show/hide character panel
- Changes to **"📋 Hide"** when panel is visible
- Smooth slide-in/slide-out animation

### Character Panel Contents

**Stats Section:**
- Full 6-stat grid (STR, DEX, INT, WIS, CON, CHA)
- Visual stat boxes matching character creation

**Vital Stats:**
- HP: Current/Max
- AC (Armor Class)
- Level & XP progress
- Fortune points (current/3)
- Inventory slots used/total

**Level-Up Indicator:**
- Green banner when XP >= level
- "⬆️ Ready to level up!" message

**Aptitudes with Descriptions:**
- Lists all aptitudes
- Shows full description for each
- Pulled from RATH_DATA automatically

**Equipment List:**
- Bulleted list of all equipped items
- Shows "None" if empty
- Updates when items gained/lost

### Auto-Updates

The panel automatically refreshes when:
- HP changes (from damage, healing, memory updates)
- XP awarded
- Level up completed
- Fortune points spent
- Equipment gained or lost
- Panel is opened (always shows current state)

### Layout

**Desktop View:**
```
┌─────────────────────────────────────────┐
│ Header: Location | HP | 📋 Sheet | +XP  │
├──────────┬──────────────────────────────┤
│ Character│ Chat Messages                │
│ Panel    │                              │
│ (300px)  │                              │
│          │                              │
│ Stats    │ GM: You enter a dark cave... │
│ HP/XP    │                              │
│ Aptitudes│ Player: I light a torch      │
│ Equipment│                              │
│          │ GM: The torch flickers...    │
│          ├──────────────────────────────┤
│          │ Input: What do you do?       │
└──────────┴──────────────────────────────┘
```

**Panel Collapsed:**
```
┌─────────────────────────────────────────┐
│ Header: Location | HP | 📋 Sheet | +XP  │
├─────────────────────────────────────────┤
│ Chat Messages (full width)              │
│                                         │
│ GM: You enter a dark cave...            │
│                                         │
│ Player: I light a torch                 │
│                                         │
│ GM: The torch flickers...               │
├─────────────────────────────────────────┤
│ Input: What do you do?                  │
└─────────────────────────────────────────┘
```

## Technical Implementation

### HTML Structure (solo-play.md)

```html
<div id="game-layout">
  <div id="character-panel" class="collapsed">
    <div id="character-panel-content"></div>
  </div>
  
  <div id="game-main">
    <div id="chat-container">
      <div id="chat-messages"></div>
    </div>
    <div id="input-container">...</div>
  </div>
</div>
```

### CSS (solo-play.css)

Key styles:
- `#game-layout` — Flexbox container
- `#character-panel` — Fixed 300px width, slide animation
- `#character-panel.collapsed` — Negative margin to hide
- `transition: margin-left 0.3s ease` — Smooth animation

### JavaScript (solo-play.js)

**New Functions:**

1. **`toggleCharacterPanel()`**
   - Toggles `.collapsed` class
   - Updates button text
   - Refreshes panel content when opening

2. **`updateCharacterPanel()`**
   - Rebuilds panel HTML from `gameState.character`
   - Uses `findAptitude()` to get descriptions
   - Shows XP progress and level-up readiness
   - Called automatically by `updateGameHeader()`

**Modified Functions:**

- `updateGameHeader()` — Now updates panel if visible
- `startNewGame()` — Initializes panel
- `continueGame()` — Initializes panel

### Data Flow

```
Player action (e.g., takes damage)
  ↓
AI returns memory update
  ↓
processMemoryUpdate() modifies gameState.character
  ↓
sendToAI() calls updateGameHeader()
  ↓
updateGameHeader() calls updateCharacterPanel() if panel visible
  ↓
Character panel re-renders with new HP
```

## Usage

1. Start or continue a game
2. Click **"📋 Sheet"** button in header
3. Panel slides in from left
4. Character info displays with full details
5. Click **"📋 Hide"** to collapse panel
6. Panel auto-updates as game progresses

## Benefits

**For Players:**
- No need to remember stats
- See aptitude effects when needed
- Track HP/XP/Fortune in real-time
- Check equipment without leaving game
- Quick reference during combat

**For Development:**
- Clean separation of concerns
- Reuses existing `renderCharacter()` logic
- Automatic updates via existing update cycle
- No duplicate state tracking

## Future Enhancements

### Possible Additions

1. **Quick Actions**
   - Spend Fortune button
   - Use item button
   - Rest button (short/long)

2. **Stat Rolling in Panel**
   - Click stat to roll d20+stat
   - Show result in chat

3. **Persistent Visibility Preference**
   - Remember collapsed/expanded state
   - Auto-open on combat encounters

4. **Mobile View**
   - Make panel slide from bottom
   - Full-screen overlay on small screens

5. **NPC Quick Reference**
   - Toggle between character and NPC view
   - Show stats for current NPCs in scene

6. **Notes Section**
   - Player notes field
   - Quest tracker
   - Relationship tracker

## Testing Checklist

- [ ] Click "📋 Sheet" → Panel slides in
- [ ] Click "📋 Hide" → Panel slides out
- [ ] Panel shows correct stats
- [ ] Aptitudes display with descriptions
- [ ] HP updates when damaged
- [ ] XP display updates when awarded
- [ ] Level-up banner shows when ready
- [ ] Equipment list updates when items gained/lost
- [ ] Panel collapses on window resize (responsive)
- [ ] Animation is smooth (no jank)

## Files Modified

1. `/vault/Rath - Rules/Publishing/Website/docs/solo-play.md`
   - Added `#game-layout` wrapper
   - Added `#character-panel` structure
   - Added toggle button to header

2. `/vault/Rath - Rules/Publishing/Website/docs/stylesheets/solo-play.css`
   - Added layout styles for panel
   - Added collapsed state styles
   - Added transition animations

3. `/vault/Rath - Rules/Publishing/Website/docs/js/solo-play.js`
   - Added `toggleCharacterPanel()` function
   - Added `updateCharacterPanel()` function
   - Modified `setupEventListeners()`
   - Modified `updateGameHeader()`
   - Modified `startNewGame()` and `continueGame()`

## Notes

- Panel is collapsed by default (user must opt-in)
- Updates are throttled to game state changes (not constant polling)
- Uses existing character data structures (no duplication)
- Gracefully handles missing aptitudes (won't break if aptitude not found)
