# Solo Play Improvements - February 2026

## Changes Made

### 1. Token Cost Optimization (~50-60% cost reduction)

**Problem:** Entire chat history was sent every turn, causing exponential token growth.

**Solution:**
- **Sliding window**: Only last 10 turns (20 messages) sent as context
- **Reduced max_tokens**: From 1500 to 800 per response
- **Compressed context**: Limited NPCs (3 max) and events (3 max) per turn
- **Only current location**: Removed "all locations" from context

**Expected savings:**
- Turn 1: ~$0.012 per turn (unchanged)
- Turn 50: ~$0.035 per turn (was $0.072)
- **2-hour session: ~$4 instead of $7-8**

### 2. Rules Reinforcement System

**Problem:** AI forgets rules as conversation grows.

**Solution:**
- **Dynamic rules injection**: Analyzes player message and injects relevant rules
  - Combat action → combat rules reminder
  - Stealth action → skill test rules + character aptitude reminder
  - Magic action → magic rules reminder
- **Periodic reminders**: Every 5 turns, core rules re-injected
- **Character sheet always-on**: Stats displayed as "ONLY modifiers that exist"

### 3. Token Usage Tracking

**New feature:** Real-time cost tracking displayed in game header.

Shows:
- Total cost in dollars
- Token count
- Updates after every AI response

Format: `HP: 12/12 | Fortune: 1 | Cost: $1.234 (45.6k tokens)`

### 4. World Evolution System

**New feature:** Locations change over time when you're not there.

**How it works:**
- Every location gets a `lastVisit` timestamp when you leave
- When you return after 6+ hours (game time), context includes evolution hint
- AI sees: "The world has moved on while you were away: Tavern (8h), Village (12h)"
- AI can narrate changes: burned down, new NPCs arrived, quest failed, etc.

**Memory structure:**

```javascript
// Old events (before)
gameState.world.events = ["Found a sword", "Met Bob"];

// New events (now)
gameState.world.events = [
  { text: "Found a sword", timestamp: 1707423600000 },
  { text: "Met Bob", timestamp: 1707424200000 }
];

// Locations now track visits
gameState.world.locations['tavern'] = {
  name: "The Rusty Nail Tavern",
  description: "...",
  npcs: ["Bob", "Alice"],
  lastVisit: 1707420000000 // When you left
};
```

### 5. Configuration Constants

Easy tuning at top of file:

```javascript
const CONFIG = {
  MAX_HISTORY_TURNS: 10,  // Sliding window size
  MAX_OUTPUT_TOKENS: 800,  // Response length
  MAX_NPCS_IN_CONTEXT: 3,  // NPCs per location
  MAX_EVENTS_IN_CONTEXT: 3 // Recent events shown
};
```

## How Memory Works (Answering Your Question)

### Current System

The AI returns a memory block after each response:

````markdown
```memory
{
  "location_update": {
    "id": "tavern-1",
    "name": "The Rusty Nail",
    "description": "A smoky tavern...",
    "npcs": ["Bob the Barkeep", "Suspicious hooded figure"],
    "notes": "Loud music, smells of ale"
  },
  "npc_update": {
    "id": "bob-1",
    "name": "Bob the Barkeep",
    "personality": "Friendly but secretive",
    "notes": "Owes the character a favor"
  },
  "event": "Made a deal with Bob",
  "character_update": {
    "hp_change": -5,
    "item_gained": "rusty key"
  }
}
```
````

The `processMemoryUpdate()` function applies these changes to `gameState.world`.

### What Gets Sent Each Turn

The `buildContext()` function creates:

1. **Character sheet** (always) - Full stats, aptitudes, equipment
2. **Current location** (only where you are now)
3. **Recent events** (last 3 only)
4. **World evolution hints** (if returning to old locations)

### World Evolution Example

**Scenario:** You leave the tavern to explore a dungeon for 2 days game time.

**When you return:**

```javascript
// Context includes:
"Time since last visit: ~48 hours"
"The world has moved on while you were away: The Rusty Nail (48h)"
```

**AI might narrate:**

> "When you push open the tavern door, you freeze. The place is wrecked — tables overturned, broken glass everywhere. Bob is behind the bar with a black eye, sweeping up. He looks up at you with a mix of relief and fear.
> 
> 'Where the hell have you been? The hooded figure came back with friends two nights ago. They were looking for *you*.'"

The AI decides what changed based on:
- Time passed
- NPCs/factions you left behind
- Unresolved plot threads
- The danger level you left things at

## Economic Context Retention Strategies

### What I Implemented

1. **Sliding window** - Forget old messages, keep world state
2. **Semantic compression** - Events stored with timestamps, can be summarized
3. **Sparse context** - Only relevant NPCs/locations sent

### Future Improvements (Not Yet Implemented)

**Option A: Automatic History Compression**

Every 30 turns, call AI to summarize old history:

```javascript
// Compress turns 1-20 into a 200-word summary
const summary = await callAI("Summarize these events in 3-4 sentences: ...");
gameState.chatHistory = [
  { role: 'system', content: `Previous events: ${summary}` },
  ...gameState.chatHistory.slice(-20) // Keep recent turns
];
```

Cost: ~$0.10 once per 30 turns, saves $2-3 over the session.

**Option B: Embeddings-Based Retrieval**

Store full history locally, only retrieve relevant messages:

```javascript
// User says "What did Bob say about the key?"
const relevantMessages = searchHistory("Bob key"); // Local semantic search
// Send only those 3 messages + recent 10
```

Requires: Browser-based embedding model (slow) or external service.

**Option C: Extended Thinking Mode**

Use Claude's extended thinking to deeply process rules once:

```javascript
thinking: {
  type: "enabled",
  budget_tokens: 2000
}
```

Cost: ~$0.10/turn vs $0.03/turn
Benefit: Much better rules adherence, fewer mistakes

**My Recommendation:** Start with what I implemented. If you still have issues after 30-40 turns, add Option A (history compression).

## Usage

1. **Save the updated file** (already done)
2. **Clear browser cache** or hard refresh (Ctrl+Shift+R) to load new code
3. **Start a new game** to see token tracking
4. **Check cost display** in game header

## Testing Checklist

- [ ] Token counter appears in game header
- [ ] Cost updates after each AI response
- [ ] Only recent messages affect response quality (test by referencing turn 1 at turn 20)
- [ ] World evolution triggers when returning to old locations
- [ ] Character aptitudes trigger context-specific rules reminders
- [ ] Total cost for 2-hour session < $5

## Further Optimization Ideas

1. **Add "Reset Token Counter" button** - Let users track per-session costs
2. **Pre-compressed rules sections** - Load actual markdown from rules files
3. **Response validation** - Automatically detect rule violations (not implemented yet)
4. **Local state persistence** - Export/import with token count included

Let me know if you want any of these additions!
