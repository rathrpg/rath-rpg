# Adventure Journal Feature

## Overview

The Adventure Journal creates an artifact of play — a narrative summary of your adventure that can be exported and kept as a memento. Uses AI to transform gameplay into cohesive story entries.

## Features

### Journal Panel

**Location:** Right side of game screen (slides in from right)  
**Toggle:** **"📖 Journal"** button in game header  
**Width:** 400px (slightly wider than character panel)  
**Background:** Parchment-like color (#fefaf5)

### Journal Entries

Each entry contains:
- **Entry number** (Entry 1, Entry 2, etc.)
- **Date** (when the entry was created)
- **Narrative text** (AI-generated summary in character's voice)
- **Turn range** (which turns were summarized)

### Controls

**"📝 Update Journal" button**
- Generates new entry from recent gameplay
- Uses AI to summarize events since last entry
- Written in first-person, past tense
- 3-5 sentences focusing on key moments

**"💾 Export" button**
- Downloads journal as markdown file
- Includes character info in header
- All entries with dates
- Formatted for reading

## How It Works

### Automatic Tracking

The system tracks:
- **Last update turn** — Which turn the journal was last updated
- **New turns** — How many turns since last update
- Badge shows "5 new turns since last journal update"

### AI Summary Generation

When you click "Update Journal":

1. **Gather context** — Collects all chat messages since last update
2. **Generate prompt** — Asks AI to write journal entry from character's perspective
3. **Call AI** — Uses your configured provider (Anthropic/OpenAI)
4. **Store entry** — Saves summary with timestamp and turn range
5. **Update display** — Shows new entry in panel

**Prompt template:**
```
You are writing an adventure journal entry for a fantasy RPG. 
Summarize the following events into a compelling narrative 
paragraph (3-5 sentences) written from the character's perspective. 
Focus on key events, discoveries, and character moments. 
Write in past tense, first person.

Character: [name]

Recent events:
[chat history since last update]

Write a journal entry summarizing these events:
```

### Export Format

**Markdown structure:**
```markdown
# Grimthorn's Adventure Journal

**Character:** Grimthorn (Dwarf, Fighter, Mercenary)
**Level:** 3 | **HP:** 22/28
**Exported:** 2/8/2026, 10:30:15 PM

---

## Entry 1 — 2/8/2026

We descended into the goblin caves today, and what we found 
was far worse than expected. The entrance was trapped, but 
Whisper's keen eyes spotted the tripwire before disaster struck. 
Deep in the tunnels, we encountered a hobgoblin chieftain who 
spoke of dark rituals and a "coming darkness." Though we 
defeated him, his final words haunt me still.

---

## Entry 2 — 2/8/2026

...
```

## Usage

### During Play

1. **Play several turns** (at least 2-3 exchanges)
2. **Click "📖 Journal"** to open panel
3. **Click "📝 Update Journal"** to generate entry
4. **Wait** while AI writes summary (~5-10 seconds)
5. **Read** your adventure in narrative form

### Export for Safekeeping

1. **Open journal panel**
2. **Click "💾 Export"**
3. **File downloads** as `CharacterName-journal-timestamp.md`
4. **Save anywhere** — it's yours to keep

## Future Enhancements

### Planned Features

1. **Auto-summarize after N turns**
   - Prompt: "10 new turns since last journal. Update now?"
   - Optional auto-update every 10-15 turns

2. **Session markers**
   - "--- Session 1 —"
   - "--- Session 2 —"
   - Track which session each entry is from

3. **Manual entries**
   - "Add Custom Entry" button
   - Write your own thoughts/notes
   - Mixed AI + player commentary

4. **Illustrations** (long-term vision)
   - AI-generated scene illustrations
   - Map snapshots
   - Character portraits
   - Combat sketches

5. **Rich export formats**
   - **PDF** — Styled like a leather-bound journal
   - **ePub** — Read on e-readers
   - **HTML** — Web page version with images

6. **Shared adventures**
   - Export public URL
   - Share your adventure online
   - Gallery of completed adventures

7. **Timeline view**
   - Visual timeline of major events
   - Click to expand entry
   - See character progression

8. **NPC relationships**
   - Track who you met and when
   - "First met Soren in Entry 3"
   - Relationship status changes

## Token Cost

**Per journal entry:**
- Input: ~500-1500 tokens (recent chat history)
- Output: ~150-250 tokens (3-5 sentence summary)
- **Cost: ~$0.01-0.02 per entry** (Anthropic Claude Sonnet)

**Recommendation:** Update journal every 10-20 turns to balance cost vs. detail.

## Data Structure

```javascript
gameState.journal = {
  entries: [
    {
      text: "We descended into the goblin caves...",
      timestamp: 1707436800000,
      turnRange: [1, 10]
    },
    {
      text: "The hobgoblin chieftain fell...",
      timestamp: 1707440400000,
      turnRange: [11, 20]
    }
  ],
  lastUpdateTurn: 20
}
```

Stored in localStorage as `rath_journal`, included in world exports.

## Technical Implementation

### New UI Elements

**HTML (solo-play.md):**
- `#journal-panel` — Right-side panel
- `#journal-panel-content` — Scrollable content area
- `#toggle-journal-panel` — Toggle button in header

**CSS (solo-play.css):**
- Panel slides from right (margin-right transition)
- Parchment background (#fefaf5)
- Entry styling with borders and dates

**JavaScript (solo-play.js):**
- `callJournalAI()` — Dedicated AI function for journal summaries
- `toggleJournalPanel()` — Show/hide
- `updateJournalPanel()` — Render entries
- `generateJournalEntry()` — Call AI to create summary
- `exportJournal()` — Download markdown

### Integration Points

**Save/Load:**
- Added to `saveState()` / `loadSavedState()`
- Included in `exportWorld()` / `importWorld()`

**AI Integration:**
- Uses dedicated `callJournalAI()` function (separate from game master AI)
- Simpler context focused on creative writing
- Same provider as main gameplay (Anthropic/OpenAI)
- Max 500 tokens per summary
- Generates summaries in character's voice

## User Workflow

### First-Time User

1. Start new game
2. Play for a while (5-10 turns)
3. Notice "📖 Journal" button
4. Click to open
5. See "Update Journal" button
6. Click to generate first entry
7. Read narrative summary of adventure
8. Export to keep

### Returning User

1. Continue existing game
2. Journal already has entries
3. See "X new turns since last update" badge
4. Click "Update Journal" when ready
5. New entry added to growing chronicle
6. Export periodically to backup progress

## Design Philosophy

**Goals:**
- Make adventures feel **meaningful and memorable**
- Create an **artifact** players can keep
- Transform gameplay into **readable narrative**
- Low friction — one button to generate

**Non-goals:**
- Not a replacement for chat log
- Not a rules reference
- Not real-time — updates manually
- Not exhaustive — focuses on highlights

## Benefits

**For Players:**
- **Keepsake** of your adventure
- **Share** with friends
- **Remember** past adventures
- **Narrative** instead of raw logs

**For Solo Play:**
- Makes solo adventures feel more **complete**
- Creates sense of **progression**
- Easy to **resume** after long breaks
- **Export and forget** — your adventure is safe

## Testing Checklist

- [x] Journal panel toggles on/off
- [x] "Update Journal" generates AI summary
- [x] Summary is in first person, past tense
- [x] Entry appears in panel with date
- [x] Multiple entries stack chronologically
- [x] "New turns" badge shows correct count
- [x] Export downloads markdown file
- [x] Exported markdown is readable
- [x] Journal saves to localStorage
- [x] Journal loads on page refresh
- [x] Journal included in world export/import
- [x] Empty journal shows placeholder text
- [x] AI failures show error message
- [x] Button disables during generation
- [x] Two-row header layout (info row + actions row)
- [x] Dedicated `callJournalAI()` function for summaries

## Files Modified

1. `/vault/Rath - Rules/Publishing/Website/docs/solo-play.md`
   - Added `#journal-panel` structure
   - Added toggle button to header

2. `/vault/Rath - Rules/Publishing/Website/docs/stylesheets/solo-play.css`
   - Added journal panel styles
   - Parchment background color
   - Right-side slide animation

3. `/vault/Rath - Rules/Publishing/Website/docs/js/solo-play.js`
   - Added `journal` to `gameState`
   - Added toggle and update functions
   - Added AI summary generation
   - Added markdown export
   - Integrated with save/load system

## Example Journal Entry

**Input (chat history):**
```
GM: You enter a dark cave. The air is cold and damp.
Player: I light a torch and look around.
GM: Your torch reveals ancient carvings on the walls.
Player: I examine the carvings. What do they depict?
GM: They show a battle between dragons and wizards.
Player: I make a sketch of the carvings in my journal.
```

**Output (journal entry):**
```
Today I ventured into a cave that reeked of ancient secrets. 
The cold air and damp walls spoke of centuries undisturbed, 
but it was the carvings that truly caught my attention. 
Dragons and wizards locked in eternal battle, frozen in 
stone — I couldn't help but sketch them. What war did these 
walls witness?
```

Notice how it:
- Uses first person ("I ventured")
- Past tense ("caught my attention")
- Character voice (reflective, curious)
- Captures mood and key details
- Ends with character's question

This is the magic of the journal — raw gameplay becomes story.
