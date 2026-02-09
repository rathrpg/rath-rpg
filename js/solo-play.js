/**
 * Rath RPG Solo Play - AI Game Master
 * Stores game state in localStorage
 */

// ============ Constants ============

const STORAGE_KEYS = {
  API_KEY: 'rath_api_key',
  API_PROVIDER: 'rath_api_provider',
  CHARACTER: 'rath_character',
  WORLD: 'rath_world',
  GAME_STATE: 'rath_game_state',
  CHAT_HISTORY: 'rath_chat_history'
};

const API_ENDPOINTS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions'
};

const MODELS = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o'
};

// ============ Configuration ============

const CONFIG = {
  MAX_HISTORY_TURNS: 10,  // Only keep last N exchanges in context
  MAX_OUTPUT_TOKENS: 800,  // Reduced from 1500 to save costs
  COMPRESS_HISTORY_AT: 30, // Compress old history after this many turns
  MAX_NPCS_IN_CONTEXT: 3,  // Only include this many NPCs per location
  MAX_EVENTS_IN_CONTEXT: 3 // Only include this many recent events
};

// ============ Game State ============

let gameState = {
  character: null,
  world: {
    locations: {},
    npcs: {},
    events: [],
    currentLocation: null,
    currentTimestamp: Date.now() // Track game time for world evolution
  },
  chatHistory: [],
  journal: {
    entries: [],
    lastUpdateTurn: 0
  },
  isPlaying: false,
  tokenUsage: {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0
  }
};

// ============ Rath RPG System Prompt ============

const SYSTEM_PROMPT = `You are a Game Master for Rath RPG, a rules-light fantasy roleplaying game. You run engaging, dangerous adventures while faithfully applying the game rules.

## Core Rules

**Tests:** d20 + stat >= DC (default DC 12). Natural 20 = critical success, Natural 1 = critical failure.

**Stats:** The ONLY source of numerical bonuses. Range 0-6 typically.
- STR: melee attacks, lifting, breaking
- DEX: ranged attacks, dodging, sneaking
- INT: magic, lore, reasoning
- WIS: perception, tracking, insight
- CON: poison/disease resistance, HP calculation
- CHA: persuasion, deception, intimidation

**IMPORTANT - No Other Bonuses Exist:**
- There are NO proficiency bonuses, skill bonuses, or expertise bonuses
- Keywords (like "Tracker", "Soldier", "Noble") are purely narrative flavor - they NEVER add numerical bonuses
- The ONLY number added to a d20 roll is the relevant stat

**Difficulty Scale:** Instead of adjusting DCs, Rath uses advantage/disadvantage:
- Impossible task: Cannot attempt
- Hard task: Roll with disadvantage
- Normal task: Straight roll vs DC 12
- Easy task: Roll with advantage

**Advantage/Disadvantage:** Roll 2d20, take higher (advantage) or lower (disadvantage). Multiple sources don't stack. Advantage and disadvantage cancel out.

**Aptitudes:** Grant advantage on specific actions OR special abilities. They NEVER grant flat numerical bonuses. Examples:
- "Wild Walker" = advantage to track/hunt/forage in wilderness (not +4)
- "Move Silently and Unseen" = advantage to sneak/hide (not +2)
- "Silver Tongue" = advantage on CHA to negotiate (not +3)

**Combat:**
- Initiative: Roll d6 each round. 1-3 enemies first, 4-6 players first.
- Attack: d20 + STR (melee) or DEX (ranged) vs target's AC
- Damage: Weapon die + STR for melee. Exploding dice (max = roll again, add).
- Critical (Natural 20): Target loses 1 AC until combat ends
- At 0 HP: CON test DC 12. Pass = 1d6 HP and fight. Fail = unconscious until danger passes.

**Rest:** Short (1 hr) = 1d6 + CON HP. Long (8 hr) = Full HP, abilities recharge.

**Distance:** Close (5-10ft melee), Near (20-30ft one move), Far (40-60ft running), Distant (60ft+)

## Your Role

1. **Describe the world vividly** - sights, sounds, smells, atmosphere
2. **Present meaningful choices** - not just combat, but exploration, social, moral dilemmas
3. **Be fair but dangerous** - the world is lethal, but give players agency
4. **Track NPCs and locations** - remember details, maintain consistency
5. **Roll dice when needed** - clearly state rolls, DCs, and results
6. **Apply character aptitudes** - reference the character's abilities when relevant

## Dice Rolling

When dice are needed, roll them and show results clearly:
- State what's being rolled and why
- Show the roll with ONLY the stat bonus: "d20 + 2 (WIS) = 15 vs DC 12"
- If they have advantage from an aptitude: "d20 + 2 (WIS) with advantage (Wild Walker) = 8, 17 → 17 vs DC 12"
- NEVER add bonuses for keywords, background, or expertise - only the stat
- Describe the outcome narratively

## Memory Updates

After each response, if anything significant happened, output a JSON block for memory storage:

\`\`\`memory
{
  "location_update": {
    "id": "location-id",
    "name": "Location Name",
    "description": "Updated description",
    "npcs": ["npc-ids"],
    "items": ["items here"],
    "notes": "Any changes"
  },
  "npc_update": {
    "id": "npc-id",
    "name": "NPC Name",
    "description": "Physical description",
    "personality": "Personality traits",
    "notes": "Relationship, events"
  },
  "event": "Brief description of significant event",
  "character_update": {
    "hp_change": -5,
    "item_gained": "rusty sword",
    "item_lost": null
  }
}
\`\`\`

Only include fields that changed. Omit the block if nothing significant happened.

## Starting a New Game

When starting fresh, create an interesting opening scenario:
1. Establish an evocative location
2. Give the player an immediate situation or hook
3. Present choices or things to interact with
4. Make it feel alive with sensory details`;

// ============ Initialization ============

document.addEventListener('DOMContentLoaded', () => {
  // Only initialize on the solo-play page
  if (!document.getElementById('solo-play-app')) {
    return;
  }

  loadSavedState();
  setupEventListeners();
  updateUI();
});

function loadSavedState() {
  // Load API settings
  const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
  const savedProvider = localStorage.getItem(STORAGE_KEYS.API_PROVIDER);

  if (savedKey) {
    document.getElementById('api-key').value = savedKey;
    document.getElementById('key-status').textContent = 'API key loaded';
    document.getElementById('key-status').className = 'success';
  }

  if (savedProvider) {
    document.getElementById('api-provider').value = savedProvider;
  }

  // Load character
  const savedCharacter = localStorage.getItem(STORAGE_KEYS.CHARACTER);
  if (savedCharacter) {
    gameState.character = JSON.parse(savedCharacter);
  }

  // Load world
  const savedWorld = localStorage.getItem(STORAGE_KEYS.WORLD);
  if (savedWorld) {
    gameState.world = JSON.parse(savedWorld);
  }

  // Load chat history
  const savedChat = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  if (savedChat) {
    gameState.chatHistory = JSON.parse(savedChat);
  }
  
  // Load token usage
  const savedTokens = localStorage.getItem('rath_token_usage');
  if (savedTokens) {
    gameState.tokenUsage = JSON.parse(savedTokens);
  }
  
  // Load journal
  const savedJournal = localStorage.getItem('rath_journal');
  if (savedJournal) {
    gameState.journal = JSON.parse(savedJournal);
  }
  
  // Ensure world has timestamp (for backwards compatibility)
  if (!gameState.world.currentTimestamp) {
    gameState.world.currentTimestamp = Date.now();
  }
  
  // Ensure journal exists (for backwards compatibility)
  if (!gameState.journal) {
    gameState.journal = { entries: [], lastUpdateTurn: 0 };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.CHARACTER, JSON.stringify(gameState.character));
  localStorage.setItem(STORAGE_KEYS.WORLD, JSON.stringify(gameState.world));
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(gameState.chatHistory));
  localStorage.setItem('rath_token_usage', JSON.stringify(gameState.tokenUsage));
  localStorage.setItem('rath_journal', JSON.stringify(gameState.journal));
}

function setupEventListeners() {
  // API key
  document.getElementById('save-key-btn').addEventListener('click', saveApiKey);
  document.getElementById('api-provider').addEventListener('change', (e) => {
    localStorage.setItem(STORAGE_KEYS.API_PROVIDER, e.target.value);
  });

  // Character
  document.getElementById('new-character-btn').addEventListener('click', showNewCharacterModal);
  document.getElementById('import-character-btn').addEventListener('click', showImportCharacterModal);
  document.getElementById('change-character-btn').addEventListener('click', () => {
    document.getElementById('character-display').style.display = 'none';
    document.getElementById('no-character').style.display = 'block';
  });

  // Game
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  document.getElementById('continue-game-btn').addEventListener('click', continueGame);
  document.getElementById('export-world-btn').addEventListener('click', exportWorld);
  document.getElementById('import-world-btn').addEventListener('click', showImportWorldModal);
  document.getElementById('back-to-setup-btn').addEventListener('click', backToSetup);

  // Chat
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('player-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // XP and Leveling (these buttons exist in game view, add listeners when available)
  const awardXpBtn = document.getElementById('award-xp-btn');
  if (awardXpBtn) {
    awardXpBtn.addEventListener('click', awardXP);
  }
  
  const levelUpBtn = document.getElementById('level-up-btn');
  if (levelUpBtn) {
    levelUpBtn.addEventListener('click', showLevelUpModal);
  }

  // Character panel toggle
  const togglePanelBtn = document.getElementById('toggle-character-panel');
  if (togglePanelBtn) {
    togglePanelBtn.addEventListener('click', toggleCharacterPanel);
  }

  // Journal panel toggle
  const toggleJournalBtn = document.getElementById('toggle-journal-panel');
  if (toggleJournalBtn) {
    toggleJournalBtn.addEventListener('click', toggleJournalPanel);
  }
}

function toggleCharacterPanel() {
  const panel = document.getElementById('character-panel');
  const btn = document.getElementById('toggle-character-panel');
  
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    btn.textContent = '📋 Hide';
    updateCharacterPanel(); // Refresh content when opening
  } else {
    panel.classList.add('collapsed');
    btn.textContent = '📋 Sheet';
  }
}

function toggleJournalPanel() {
  const panel = document.getElementById('journal-panel');
  const btn = document.getElementById('toggle-journal-panel');
  
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    btn.textContent = '📖 Hide';
    updateJournalPanel(); // Refresh content when opening
  } else {
    panel.classList.add('collapsed');
    btn.textContent = '📖 Journal';
  }
}

function updateCharacterPanel() {
  const content = document.getElementById('character-panel-content');
  if (!content || !gameState.character) return;
  
  const char = gameState.character;
  const slotsUsed = char.equipment?.length || 0;
  const slotsTotal = char.slots || (10 + (char.stats?.con || 0));
  const xp = char.xp || 0;
  const xpNeeded = char.level;
  const canLevelUp = xp >= xpNeeded;
  
  // Build aptitude descriptions
  const aptitudeDetails = char.aptitudes.map(name => {
    const apt = findAptitude(name);
    return apt ? `<div style="margin-bottom:0.75rem;"><strong>${apt.name}</strong><br><span style="font-size:0.875rem;color:#555;">${apt.description}</span></div>` : `<div>${name}</div>`;
  }).join('');
  
  content.innerHTML = `
    <h4 style="margin-top:0;">${char.name}</h4>
    
    <div style="font-size:0.875rem;color:#666;margin-bottom:0.75rem;">
      ${char.keywords.join(', ') || 'No keywords'}
    </div>
    
    <div class="stat-grid" style="margin-bottom:1rem;">
      <div class="stat-box"><span class="stat-name">STR</span><span class="stat-value">${char.stats.str}</span></div>
      <div class="stat-box"><span class="stat-name">DEX</span><span class="stat-value">${char.stats.dex}</span></div>
      <div class="stat-box"><span class="stat-name">INT</span><span class="stat-value">${char.stats.int}</span></div>
      <div class="stat-box"><span class="stat-name">WIS</span><span class="stat-value">${char.stats.wis}</span></div>
      <div class="stat-box"><span class="stat-name">CON</span><span class="stat-value">${char.stats.con}</span></div>
      <div class="stat-box"><span class="stat-name">CHA</span><span class="stat-value">${char.stats.cha}</span></div>
    </div>
    
    <div style="background:#fff;border:1px solid #ddd;border-radius:4px;padding:0.5rem;margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.25rem;">
        <span><strong>HP:</strong> ${char.hp}/${char.maxHp}</span>
        <span><strong>AC:</strong> ${char.ac}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.25rem;">
        <span><strong>Level:</strong> ${char.level}</span>
        <span><strong>XP:</strong> ${xp}/${xpNeeded}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;">
        <span><strong>Fortune:</strong> ${char.fortune}/3</span>
        <span><strong>Slots:</strong> ${slotsUsed}/${slotsTotal}</span>
      </div>
    </div>
    
    ${canLevelUp ? '<div style="background:#d4edda;border:1px solid #c3e6cb;border-radius:4px;padding:0.5rem;margin-bottom:1rem;font-size:0.875rem;color:#155724;text-align:center;">⬆️ Ready to level up!</div>' : ''}
    
    <div style="margin-bottom:1rem;">
      <strong style="font-size:0.875rem;display:block;margin-bottom:0.5rem;">Quick Actions:</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        <button onclick="quickShortRest()" style="padding:0.4rem;font-size:0.75rem;background:#4a90e2;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="Heal 1d6+CON, takes 1 hour">Short Rest</button>
        <button onclick="quickLongRest()" style="padding:0.4rem;font-size:0.75rem;background:#6b46c1;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="Full heal, 8 hours">Long Rest</button>
        <button onclick="quickSpendFortune()" style="padding:0.4rem;font-size:0.75rem;background:#f59e0b;color:#fff;border:none;border-radius:4px;cursor:pointer;${char.fortune <= 0 ? 'opacity:0.5;cursor:not-allowed;' : ''}" ${char.fortune <= 0 ? 'disabled' : ''} title="Spend 1 Fortune to reroll">Fortune (${char.fortune})</button>
        <button onclick="quickRollStat()" style="padding:0.4rem;font-size:0.75rem;background:#10b981;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="Roll d20 + stat">Roll Check</button>
      </div>
    </div>
    
    <div style="margin-bottom:1rem;">
      <strong style="font-size:0.875rem;">Aptitudes:</strong>
      <div style="margin-top:0.5rem;font-size:0.875rem;">
        ${aptitudeDetails || '<em style="color:#999;">None</em>'}
      </div>
    </div>
    
    <div style="margin-bottom:1rem;">
      <strong style="font-size:0.875rem;">Equipment:</strong>
      <div style="margin-top:0.5rem;font-size:0.875rem;">
        ${char.equipment.length > 0 
          ? char.equipment.map((item, idx) => `<div style="margin-bottom:0.25rem;display:flex;justify-content:space-between;align-items:center;">
              <span>• ${item}</span>
              <button onclick="quickUseItem(${idx})" style="padding:0.125rem 0.375rem;font-size:0.625rem;background:#6b7280;color:#fff;border:none;border-radius:3px;cursor:pointer;" title="Use/consume this item">Use</button>
            </div>`).join('') 
          : '<em style="color:#999;">None</em>'}
      </div>
    </div>
  `;
}

function updateUI() {
  // Update character display
  if (gameState.character) {
    document.getElementById('no-character').style.display = 'none';
    document.getElementById('character-display').style.display = 'block';
    document.getElementById('character-info').innerHTML = renderCharacter(gameState.character);
  }

  // Enable continue button if there's chat history
  document.getElementById('continue-game-btn').disabled = gameState.chatHistory.length === 0;
}

// ============ API Key Management ============

function saveApiKey() {
  const key = document.getElementById('api-key').value.trim();
  const status = document.getElementById('key-status');

  if (!key) {
    status.textContent = 'Please enter an API key';
    status.className = 'error';
    return;
  }

  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  status.textContent = 'API key saved';
  status.className = 'success';
}

function getApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

function getApiProvider() {
  return localStorage.getItem(STORAGE_KEYS.API_PROVIDER) || 'anthropic';
}

// ============ Character Management ============

function showNewCharacterModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  // Build aptitude options
  const skillOptions = Object.entries(RATH_DATA.skillAptitudes).map(([category, apts]) =>
    `<optgroup label="${category}">${apts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}</optgroup>`
  ).join('');

  const inherentOptions = Object.entries(RATH_DATA.inherentAptitudes).map(([category, apts]) =>
    `<optgroup label="${category}">${apts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}</optgroup>`
  ).join('');

  // Build gear pack options
  const packOptions = Object.keys(RATH_DATA.gearPacks).map(p => `<option value="${p}">${p}</option>`).join('');

  // Build quick start options
  const quickStartOptions = RATH_DATA.suggestedCombinations.map(c =>
    `<option value="${c.concept}">${c.concept} (${c.aptitudes.join(' + ')})</option>`
  ).join('');

  content.innerHTML = `
    <h3>Create New Character</h3>

    <div class="form-group">
      <label>Quick Start (optional):</label>
      <select id="char-quickstart" onchange="applyQuickStart()">
        <option value="">-- Custom Build --</option>
        ${quickStartOptions}
      </select>
    </div>

    <hr>

    <div class="form-group">
      <label>Name:</label>
      <input type="text" id="char-name" placeholder="Character name">
    </div>

    <div class="form-group">
      <label>Keywords (species, role, background):</label>
      <input type="text" id="char-keywords" placeholder="e.g., Human, Fighter, Soldier">
    </div>

    <div class="form-group">
      <label>Stats (standard array: 3, 2, 2, 1, 1, 0):</label>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>STR:</label>
        <input type="number" id="char-str" value="2" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
      <div class="form-group">
        <label>DEX:</label>
        <input type="number" id="char-dex" value="2" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
      <div class="form-group">
        <label>INT:</label>
        <input type="number" id="char-int" value="1" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>WIS:</label>
        <input type="number" id="char-wis" value="1" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
      <div class="form-group">
        <label>CON:</label>
        <input type="number" id="char-con" value="3" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
      <div class="form-group">
        <label>CHA:</label>
        <input type="number" id="char-cha" value="0" min="0" max="6" onchange="updateCharacterPreview()">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Aptitude 1:</label>
        <select id="char-apt1" onchange="updateCharacterPreview()">
          <option value="">-- Select --</option>
          <optgroup label="--- Skill Aptitudes ---"></optgroup>
          ${skillOptions}
          <optgroup label="--- Inherent Aptitudes ---"></optgroup>
          ${inherentOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Aptitude 2:</label>
        <select id="char-apt2" onchange="updateCharacterPreview()">
          <option value="">-- Select --</option>
          <optgroup label="--- Skill Aptitudes ---"></optgroup>
          ${skillOptions}
          <optgroup label="--- Inherent Aptitudes ---"></optgroup>
          ${inherentOptions}
        </select>
      </div>
    </div>

    <div id="aptitude-descriptions" class="aptitude-desc-box"></div>

    <div class="form-group">
      <label>Gear Pack:</label>
      <select id="char-gearpack" onchange="updateCharacterPreview()">
        ${packOptions}
      </select>
    </div>

    <div id="gear-contents" class="gear-contents-box"></div>

    <div id="char-preview" class="char-preview-box">
      <strong>Preview:</strong> HP: 13 | AC: 12 | Slots: 13
    </div>

    <div style="margin-top: 1rem;">
      <button class="primary" onclick="createCharacter()">Create Character</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;

  modal.style.display = 'flex';
  updateCharacterPreview();
}

function applyQuickStart() {
  const select = document.getElementById('char-quickstart');
  const concept = select.value;
  if (!concept) return;

  const combo = RATH_DATA.suggestedCombinations.find(c => c.concept === concept);
  if (!combo) return;

  // Set aptitudes
  document.getElementById('char-apt1').value = combo.aptitudes[0] || '';
  document.getElementById('char-apt2').value = combo.aptitudes[1] || '';

  // Set keywords
  document.getElementById('char-keywords').value = combo.keywords.join(', ');

  // Set appropriate gear pack
  if (['Fighter', 'Barbarian', 'Dwarf', 'Beastfolk'].includes(concept)) {
    document.getElementById('char-gearpack').value = 'Combat';
  } else if (['Thief', 'Assassin', 'Halfling', 'Goblin'].includes(concept)) {
    document.getElementById('char-gearpack').value = 'Specialist';
  } else if (['Ranger', 'Elf', 'Pixie'].includes(concept)) {
    document.getElementById('char-gearpack').value = 'Scout';
  } else if (['Cleric', 'Hedge Witch', 'Arcanist'].includes(concept)) {
    document.getElementById('char-gearpack').value = 'Caster';
  }

  updateCharacterPreview();
}

function updateCharacterPreview() {
  const con = parseInt(document.getElementById('char-con')?.value) || 0;
  const dex = parseInt(document.getElementById('char-dex')?.value) || 0;
  const apt1 = document.getElementById('char-apt1')?.value || '';
  const apt2 = document.getElementById('char-apt2')?.value || '';
  const gearPack = document.getElementById('char-gearpack')?.value || 'Combat';

  const aptitudes = [apt1, apt2].filter(a => a);

  // Calculate stats
  let hp = 10 + con;
  let ac = 10 + dex;
  let slots = 10 + con;

  if (aptitudes.includes('Resilient')) hp += 2;
  if (aptitudes.includes('Natural Armor')) ac = 12 + dex;
  if (aptitudes.includes('Small')) slots = Math.max(7, slots - 3);

  // Add gear pack AC
  const pack = RATH_DATA.gearPacks[gearPack];
  if (pack && !aptitudes.includes('Natural Armor')) {
    ac += pack.ac_bonus;
  }

  // Update preview
  const preview = document.getElementById('char-preview');
  if (preview) {
    preview.innerHTML = `<strong>Preview:</strong> HP: ${hp} | AC: ${ac} | Inventory Slots: ${slots}`;
  }

  // Update aptitude descriptions
  const descBox = document.getElementById('aptitude-descriptions');
  if (descBox) {
    const descs = aptitudes.map(name => {
      const apt = findAptitude(name);
      return apt ? `<strong>${apt.name}:</strong> ${apt.description}` : '';
    }).filter(d => d).join('<br><br>');
    descBox.innerHTML = descs || '<em>Select aptitudes to see descriptions</em>';
  }

  // Update gear contents
  const gearBox = document.getElementById('gear-contents');
  if (gearBox && pack) {
    gearBox.innerHTML = `<strong>${gearPack} Pack:</strong> ${pack.contents.join(', ')}`;
  }
}

function createCharacter() {
  const name = document.getElementById('char-name').value.trim();
  const keywords = document.getElementById('char-keywords').value.trim();
  const str = parseInt(document.getElementById('char-str').value) || 0;
  const dex = parseInt(document.getElementById('char-dex').value) || 0;
  const int = parseInt(document.getElementById('char-int').value) || 0;
  const wis = parseInt(document.getElementById('char-wis').value) || 0;
  const con = parseInt(document.getElementById('char-con').value) || 0;
  const cha = parseInt(document.getElementById('char-cha').value) || 0;
  const apt1 = document.getElementById('char-apt1').value;
  const apt2 = document.getElementById('char-apt2').value;
  const gearPack = document.getElementById('char-gearpack').value;

  if (!name) {
    alert('Please enter a character name');
    return;
  }

  // Build aptitude list
  const aptitudes = [apt1, apt2].filter(a => a);

  // Calculate derived stats
  let maxHp = 10 + con;
  let ac = 10 + dex;
  let slots = 10 + con;

  if (aptitudes.includes('Resilient')) maxHp += 2;
  if (aptitudes.includes('Natural Armor')) ac = 12 + dex;
  if (aptitudes.includes('Small')) slots = Math.max(7, slots - 3);

  // Build equipment list from gear pack
  const pack = RATH_DATA.gearPacks[gearPack];
  const equipment = pack ? [...pack.contents] : [];

  // Apply gear pack AC bonus (unless Natural Armor)
  if (pack && !aptitudes.includes('Natural Armor')) {
    ac += pack.ac_bonus;
  }

  gameState.character = {
    name,
    keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
    stats: { str, dex, int, wis, con, cha },
    hp: maxHp,
    maxHp,
    ac,
    slots,
    aptitudes,
    equipment,
    level: 1,
    xp: 0,
    fortune: 1
  };

  saveState();
  closeModal();
  updateUI();
}

function showImportCharacterModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Import Character</h3>
    <div class="form-group">
      <label>Paste character JSON:</label>
      <textarea id="import-char-json" placeholder='{"name": "Hero", "stats": {...}}'></textarea>
    </div>
    <div style="margin-top: 1rem;">
      <button class="primary" onclick="importCharacter()">Import</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;

  modal.style.display = 'flex';
}

function importCharacter() {
  const json = document.getElementById('import-char-json').value.trim();

  try {
    const char = JSON.parse(json);
    if (!char.name || !char.stats) {
      throw new Error('Invalid character format');
    }
    gameState.character = char;
    saveState();
    closeModal();
    updateUI();
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}

function renderCharacter(char) {
  const slotsUsed = char.equipment?.length || 0;
  const slotsTotal = char.slots || (10 + (char.stats?.con || 0));
  const xp = char.xp || 0;
  const xpNeeded = char.level;
  const canLevelUp = xp >= xpNeeded;
  
  return `
    <h4>${char.name}</h4>
    <p><strong>Keywords:</strong> ${char.keywords.join(', ') || 'None'}</p>
    <div class="stat-grid">
      <div class="stat-box"><span class="stat-name">STR</span><span class="stat-value">${char.stats.str}</span></div>
      <div class="stat-box"><span class="stat-name">DEX</span><span class="stat-value">${char.stats.dex}</span></div>
      <div class="stat-box"><span class="stat-name">INT</span><span class="stat-value">${char.stats.int}</span></div>
      <div class="stat-box"><span class="stat-name">WIS</span><span class="stat-value">${char.stats.wis}</span></div>
      <div class="stat-box"><span class="stat-name">CON</span><span class="stat-value">${char.stats.con}</span></div>
      <div class="stat-box"><span class="stat-name">CHA</span><span class="stat-value">${char.stats.cha}</span></div>
    </div>
    <p><strong>HP:</strong> ${char.hp}/${char.maxHp} | <strong>AC:</strong> ${char.ac} | <strong>Level:</strong> ${char.level} | <strong>XP:</strong> ${xp}/${xpNeeded} | <strong>Slots:</strong> ${slotsUsed}/${slotsTotal}</p>
    <p><strong>Aptitudes:</strong> ${char.aptitudes.join(', ') || 'None'}</p>
    <p><strong>Equipment:</strong> ${char.equipment.join(', ') || 'None'}</p>
    ${canLevelUp ? '<p style="color: #16a34a; font-weight: bold;">⬆️ Ready to level up!</p>' : ''}
  `;
}

// ============ World Management ============

function exportWorld() {
  const data = {
    character: gameState.character,
    world: gameState.world,
    chatHistory: gameState.chatHistory,
    journal: gameState.journal
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rath-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function showImportWorldModal() {
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <h3>Import World Save</h3>
    <div class="form-group">
      <label>Select save file:</label>
      <input type="file" id="import-world-file" accept=".json">
    </div>
    <div style="margin-top: 1rem;">
      <button class="primary" onclick="importWorld()">Import</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;

  modal.style.display = 'flex';
}

function importWorld() {
  const fileInput = document.getElementById('import-world-file');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.character) gameState.character = data.character;
      if (data.world) gameState.world = data.world;
      if (data.chatHistory) gameState.chatHistory = data.chatHistory;
      if (data.journal) gameState.journal = data.journal;
      else gameState.journal = { entries: [], lastUpdateTurn: 0 }; // Default if not present
      saveState();
      closeModal();
      updateUI();
      alert('World imported successfully!');
    } catch (err) {
      alert('Invalid save file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ============ Game Flow ============

function startNewGame() {
  if (!getApiKey()) {
    alert('Please enter and save your API key first');
    return;
  }

  if (!gameState.character) {
    alert('Please create or import a character first');
    return;
  }

  // Clear previous game state but keep character
  gameState.world = {
    locations: {},
    npcs: {},
    events: [],
    currentLocation: null
  };
  gameState.chatHistory = [];
  saveState();

  // Switch to game view
  document.getElementById('setup-section').style.display = 'none';
  document.getElementById('game-section').style.display = 'flex';
  document.getElementById('chat-messages').innerHTML = '';
  gameState.isPlaying = true;

  updateGameHeader();
  updateCharacterPanel(); // Initialize character panel

  // Send initial prompt to AI
  sendInitialPrompt();
}

function continueGame() {
  if (!getApiKey()) {
    alert('Please enter and save your API key first');
    return;
  }

  document.getElementById('setup-section').style.display = 'none';
  document.getElementById('game-section').style.display = 'flex';
  gameState.isPlaying = true;

  // Restore chat history
  const messagesDiv = document.getElementById('chat-messages');
  messagesDiv.innerHTML = '';
  gameState.chatHistory.forEach(msg => {
    appendMessage(msg.role, msg.content);
  });

  updateGameHeader();
  updateCharacterPanel(); // Initialize character panel
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function backToSetup() {
  document.getElementById('setup-section').style.display = 'block';
  document.getElementById('game-section').style.display = 'none';
  gameState.isPlaying = false;
  updateUI();
}

function updateGameHeader() {
  const location = gameState.world.currentLocation || 'Unknown Location';
  document.getElementById('current-location').textContent = location;

  if (gameState.character) {
    document.getElementById('character-status').textContent =
      `HP: ${gameState.character.hp}/${gameState.character.maxHp} | Fortune: ${gameState.character.fortune}`;
    
    // Show/hide level-up button
    const xp = gameState.character.xp || 0;
    const xpNeeded = gameState.character.level;
    const levelUpBtn = document.getElementById('level-up-btn');
    if (levelUpBtn) {
      levelUpBtn.style.display = xp >= xpNeeded ? 'inline-block' : 'none';
    }
    
    // Update character panel if visible
    const panel = document.getElementById('character-panel');
    if (panel && !panel.classList.contains('collapsed')) {
      updateCharacterPanel();
    }
  }
}

// ============ XP and Leveling ============

function awardXP() {
  if (!gameState.character) return;
  
  gameState.character.xp = (gameState.character.xp || 0) + 1;
  saveState();
  updateGameHeader();
  
  appendMessage('system', `✨ Awarded 1 XP! (${gameState.character.xp}/${gameState.character.level} towards next level)`);
  
  // Check if can level up
  if (gameState.character.xp >= gameState.character.level) {
    appendMessage('system', '⬆️ You have enough XP to level up! Click the Level Up button when ready.');
  }
}

function showLevelUpModal() {
  if (!gameState.character) return;
  
  const char = gameState.character;
  const xp = char.xp || 0;
  const xpCost = char.level;
  
  if (xp < xpCost) {
    alert(`Not enough XP. Need ${xpCost} XP to level up (you have ${xp}).`);
    return;
  }
  
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  
  // Build stat options
  const statOptions = ['str', 'dex', 'int', 'wis', 'con', 'cha'].map(stat => 
    `<option value="${stat}">${stat.toUpperCase()} (current: ${char.stats[stat]})</option>`
  ).join('');
  
  // Check if gains aptitude this level
  const newLevel = char.level + 1;
  const gainsAptitude = [3, 5, 7, 9].includes(newLevel);
  
  // Build aptitude options if applicable
  let aptitudeSection = '';
  if (gainsAptitude) {
    const skillOptions = Object.entries(RATH_DATA.skillAptitudes).map(([category, apts]) =>
      `<optgroup label="${category}">${apts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}</optgroup>`
    ).join('');
    
    const inherentOptions = Object.entries(RATH_DATA.inherentAptitudes).map(([category, apts]) =>
      `<optgroup label="${category}">${apts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}</optgroup>`
    ).join('');
    
    aptitudeSection = `
      <div class="form-group">
        <label><strong>Gain New Aptitude (Level ${newLevel}):</strong></label>
        <select id="levelup-aptitude">
          <option value="">-- Select Aptitude --</option>
          <optgroup label="--- Skill Aptitudes ---"></optgroup>
          ${skillOptions}
          <optgroup label="--- Inherent Aptitudes ---"></optgroup>
          ${inherentOptions}
        </select>
        <div id="levelup-apt-desc" style="margin-top:8px; font-size:13px; color:#666;"></div>
      </div>
    `;
  }
  
  content.innerHTML = `
    <h3>Level Up to Level ${newLevel}</h3>
    
    <p><strong>Cost:</strong> ${xpCost} XP (you have ${xp})</p>
    
    <div class="form-group">
      <label><strong>1. Roll for HP:</strong></label>
      <p style="font-size:13px; color:#666;">Roll ${newLevel}d8 + ${char.stats.con} (CON). If higher than current max (${char.maxHp}), that's your new max. Otherwise, add 1.</p>
      <button onclick="rollLevelUpHP()">Roll HP</button>
      <div id="hp-roll-result"></div>
    </div>
    
    <div class="form-group">
      <label><strong>2. Increase One Stat by 1:</strong></label>
      <select id="levelup-stat">
        <option value="">-- Select Stat --</option>
        ${statOptions}
      </select>
    </div>
    
    ${aptitudeSection}
    
    <div style="margin-top: 1rem;">
      <button class="primary" onclick="applyLevelUp()">Level Up!</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Add aptitude description listener if applicable
  if (gainsAptitude) {
    document.getElementById('levelup-aptitude').addEventListener('change', (e) => {
      const aptName = e.target.value;
      const descDiv = document.getElementById('levelup-apt-desc');
      if (aptName) {
        const apt = findAptitude(aptName);
        descDiv.textContent = apt ? apt.description : '';
      } else {
        descDiv.textContent = '';
      }
    });
  }
}

// Make these functions global so modal buttons can call them
window.rollLevelUpHP = function() {
  const char = gameState.character;
  const newLevel = char.level + 1;
  const numDice = newLevel;
  const con = char.stats.con;
  
  // Roll the dice
  const rolls = [];
  let total = con;
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * 8) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  const resultDiv = document.getElementById('hp-roll-result');
  let newMaxHP;
  
  if (total > char.maxHp) {
    newMaxHP = total;
    resultDiv.innerHTML = `<p style="color:#16a34a;"><strong>Rolled:</strong> ${rolls.join(' + ')} + ${con} (CON) = ${total} → <strong>New Max HP: ${newMaxHP}</strong></p>`;
  } else {
    newMaxHP = char.maxHp + 1;
    resultDiv.innerHTML = `<p style="color:#f59e0b;"><strong>Rolled:</strong> ${rolls.join(' + ')} + ${con} (CON) = ${total} (not higher than ${char.maxHp}) → <strong>New Max HP: ${newMaxHP}</strong> (+1)</p>`;
  }
  
  // Store for applyLevelUp
  window.levelUpData = { newMaxHP };
};

window.applyLevelUp = function() {
  const char = gameState.character;
  const newLevel = char.level + 1;
  const xpCost = char.level;
  
  // Validate HP was rolled
  if (!window.levelUpData?.newMaxHP) {
    alert('Please roll for HP first!');
    return;
  }
  
  // Validate stat selected
  const statSelect = document.getElementById('levelup-stat');
  const selectedStat = statSelect.value;
  if (!selectedStat) {
    alert('Please select a stat to increase!');
    return;
  }
  
  // Validate aptitude if required
  const gainsAptitude = [3, 5, 7, 9].includes(newLevel);
  let selectedAptitude = null;
  if (gainsAptitude) {
    const aptSelect = document.getElementById('levelup-aptitude');
    selectedAptitude = aptSelect.value;
    if (!selectedAptitude) {
      alert(`Level ${newLevel} gains an aptitude. Please select one!`);
      return;
    }
  }
  
  // Apply level up
  char.level = newLevel;
  char.xp -= xpCost;
  char.maxHp = window.levelUpData.newMaxHP;
  char.hp = char.maxHp; // Heal to full on level up
  char.stats[selectedStat] += 1;
  
  if (selectedAptitude) {
    char.aptitudes.push(selectedAptitude);
  }
  
  // Recalculate derived stats
  char.ac = 10 + char.stats.dex;
  if (char.aptitudes.includes('Natural Armor')) {
    char.ac = 12 + char.stats.dex;
  }
  char.slots = 10 + char.stats.con;
  if (char.aptitudes.includes('Small')) {
    char.slots = Math.max(7, char.slots - 3);
  }
  
  saveState();
  updateUI();
  updateGameHeader();
  closeModal();
  
  const message = `🎉 <strong>Level Up!</strong> ${char.name} is now level ${newLevel}!<br>
    HP: ${char.maxHp} | ${selectedStat.toUpperCase()} increased to ${char.stats[selectedStat]}${selectedAptitude ? `<br>Gained aptitude: ${selectedAptitude}` : ''}`;
  
  appendMessage('system', message);
  
  // Clean up
  window.levelUpData = null;
};

// ============ Quick Action Functions ============

window.quickShortRest = function() {
  if (!gameState.character) return;
  
  const char = gameState.character;
  const con = char.stats.con;
  
  // Roll 1d6 + CON
  const roll = Math.floor(Math.random() * 6) + 1;
  const healing = roll + con;
  const oldHp = char.hp;
  
  char.hp = Math.min(char.maxHp, char.hp + healing);
  const actualHealing = char.hp - oldHp;
  
  saveState();
  updateGameHeader();
  
  appendMessage('system', `⏸️ <strong>Short Rest (1 hour)</strong><br>Rolled 1d6+${con} (CON) = ${roll}+${con} = ${healing}<br>Healed ${actualHealing} HP (${oldHp} → ${char.hp}/${char.maxHp})`);
};

window.quickLongRest = function() {
  if (!gameState.character) return;
  
  const char = gameState.character;
  const oldHp = char.hp;
  
  char.hp = char.maxHp;
  char.fortune = Math.min(3, char.fortune + 1); // Regain 1 fortune
  
  saveState();
  updateGameHeader();
  
  const healed = char.maxHp - oldHp;
  appendMessage('system', `🛌 <strong>Long Rest (8 hours)</strong><br>Fully healed (${oldHp} → ${char.hp})<br>All abilities recharged<br>Fortune: ${char.fortune}/3`);
};

window.quickSpendFortune = function() {
  if (!gameState.character || gameState.character.fortune <= 0) {
    appendMessage('system', '❌ No Fortune points available!');
    return;
  }
  
  const char = gameState.character;
  char.fortune -= 1;
  
  saveState();
  updateGameHeader();
  
  appendMessage('system', `🍀 <strong>Spent 1 Fortune</strong><br>Reroll your last check and take the higher result.<br>Fortune remaining: ${char.fortune}/3`);
};

window.quickRollStat = function() {
  if (!gameState.character) return;
  
  const char = gameState.character;
  const stats = ['STR', 'DEX', 'INT', 'WIS', 'CON', 'CHA'];
  
  // Simple modal for stat selection
  const statChoice = prompt(`Roll which stat?\n${stats.map((s, i) => `${i+1}. ${s} (+${char.stats[s.toLowerCase()]})`).join('\n')}\n\nEnter 1-6:`);
  
  if (!statChoice || statChoice < 1 || statChoice > 6) return;
  
  const statName = stats[parseInt(statChoice) - 1];
  const statValue = char.stats[statName.toLowerCase()];
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + statValue;
  
  const isCrit = roll === 20;
  const isFail = roll === 1;
  
  let resultClass = '';
  let resultMsg = '';
  
  if (isCrit) {
    resultClass = 'roll-crit';
    resultMsg = ' 🎯 <strong>CRITICAL SUCCESS!</strong>';
  } else if (isFail) {
    resultClass = 'roll-failure';
    resultMsg = ' 💥 <strong>Critical Failure</strong>';
  } else if (total >= 12) {
    resultClass = 'roll-success';
    resultMsg = ' ✓';
  }
  
  appendMessage('system', `🎲 <strong>${statName} Check</strong><br><span class="${resultClass}">d20 + ${statValue} (${statName}) = ${roll} + ${statValue} = ${total}${resultMsg}</span>`);
};

window.quickUseItem = function(itemIndex) {
  if (!gameState.character) return;
  
  const char = gameState.character;
  const item = char.equipment[itemIndex];
  
  if (!item) return;
  
  // Ask if they want to consume the item
  const consumable = ['potion', 'ration', 'scroll', 'torch', 'arrow', 'bolt', 'charge'].some(type => 
    item.toLowerCase().includes(type)
  );
  
  let message = `Using: <strong>${item}</strong>`;
  
  if (consumable) {
    const confirm = window.confirm(`Use/consume ${item}? This will remove it from your inventory.`);
    if (confirm) {
      char.equipment.splice(itemIndex, 1);
      message += '<br>Item consumed and removed from inventory.';
    } else {
      return; // Cancelled
    }
  } else {
    message += '<br>Used item (describe effect).';
  }
  
  saveState();
  updateGameHeader();
  appendMessage('system', `📦 ${message}`);
};

// ============ Adventure Journal ============

function updateJournalPanel() {
  const content = document.getElementById('journal-panel-content');
  if (!content) return;
  
  const entries = gameState.journal?.entries || [];
  const turnCount = Math.floor(gameState.chatHistory.length / 2);
  const lastUpdate = gameState.journal?.lastUpdateTurn || 0;
  const newTurns = turnCount - lastUpdate;
  
  if (entries.length === 0) {
    content.innerHTML = `
      <div style="text-align:center;padding:2rem;color:#999;">
        <p>No journal entries yet.</p>
        <p style="font-size:0.875rem;margin-top:0.5rem;">Your adventure will be summarized here.</p>
      </div>
      <div style="padding:0 1rem 1rem 1rem;">
        <button onclick="generateJournalEntry()" style="width:100%;padding:0.75rem;background:#6b46c1;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.875rem;">
          📝 Update Journal
        </button>
      </div>
    `;
    return;
  }
  
  // Build entries list
  const entriesHtml = entries.map((entry, idx) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    return `
      <div style="margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #ddd;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <strong style="font-size:0.875rem;color:#6b46c1;">Entry ${idx + 1}</strong>
          <span style="font-size:0.75rem;color:#999;">${date}</span>
        </div>
        <div style="font-size:0.875rem;line-height:1.6;color:#333;white-space:pre-wrap;">${entry.text}</div>
      </div>
    `;
  }).join('');
  
  content.innerHTML = `
    <div style="padding:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h4 style="margin:0;">Adventure Journal</h4>
        <button onclick="exportJournal()" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#10b981;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="Export as markdown">
          💾 Export
        </button>
      </div>
      
      ${entriesHtml}
      
      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:4px;padding:0.75rem;margin-bottom:1rem;font-size:0.875rem;color:#4338ca;">
        ${newTurns > 0 
          ? `📌 ${newTurns} new turn${newTurns > 1 ? 's' : ''} since last journal update.` 
          : '✓ Journal is up to date.'}
      </div>
      
      <button onclick="generateJournalEntry()" style="width:100%;padding:0.75rem;background:#6b46c1;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.875rem;">
        📝 Update Journal
      </button>
    </div>
  `;
}

window.generateJournalEntry = async function() {
  if (!gameState.character || gameState.chatHistory.length < 2) {
    alert('Not enough adventure content yet. Play a few turns first!');
    return;
  }
  
  const btn = document.querySelector('#journal-panel-content button');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '✍️ Writing...';
  }
  
  try {
    // Get recent chat history since last journal update
    const lastUpdate = gameState.journal?.lastUpdateTurn || 0;
    const currentTurn = Math.floor(gameState.chatHistory.length / 2);
    const turnsToSummarize = currentTurn - lastUpdate;
    
    // Get the messages to summarize (last N turns)
    const messagesToSummarize = gameState.chatHistory.slice(lastUpdate * 2);
    
    // Build summary prompt
    const summaryPrompt = `You are writing an adventure journal entry for a fantasy RPG. Summarize the following events into a compelling narrative paragraph (3-5 sentences) written from the character's perspective. Focus on key events, discoveries, and character moments. Write in past tense, first person.

Character: ${gameState.character.name}

Recent events:
${messagesToSummarize.map(msg => {
  const role = msg.role === 'gm' ? 'GM' : 'Player';
  return `${role}: ${msg.content}`;
}).join('\n\n')}

Write a journal entry summarizing these events:`;
    
    // Call AI to generate summary
    const provider = getApiProvider();
    const summary = await callAI(provider, summaryPrompt, true);
    
    // Add entry to journal
    if (!gameState.journal) {
      gameState.journal = { entries: [], lastUpdateTurn: 0 };
    }
    
    gameState.journal.entries.push({
      text: summary,
      timestamp: Date.now(),
      turnRange: [lastUpdate + 1, currentTurn]
    });
    
    gameState.journal.lastUpdateTurn = currentTurn;
    
    saveState();
    updateJournalPanel();
    
    appendMessage('system', '📖 <strong>Journal Updated</strong><br>Your adventure has been recorded.');
    
  } catch (error) {
    alert('Failed to generate journal entry: ' + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📝 Update Journal';
    }
  }
};

window.exportJournal = function() {
  if (!gameState.journal?.entries || gameState.journal.entries.length === 0) {
    alert('No journal entries to export!');
    return;
  }
  
  const char = gameState.character;
  let markdown = `# ${char.name}'s Adventure Journal\n\n`;
  markdown += `**Character:** ${char.name} (${char.keywords.join(', ')})\n`;
  markdown += `**Level:** ${char.level} | **HP:** ${char.hp}/${char.maxHp}\n`;
  markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  
  gameState.journal.entries.forEach((entry, idx) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    markdown += `## Entry ${idx + 1} — ${date}\n\n`;
    markdown += `${entry.text}\n\n`;
    markdown += `---\n\n`;
  });
  
  // Download as file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${char.name}-journal-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  
  appendMessage('system', '💾 <strong>Journal Exported</strong><br>Saved as markdown file.');
};

// ============ Chat & AI ============

async function sendInitialPrompt() {
  const char = gameState.character;
  const initialMessage = `Begin a new adventure for this character:

**${char.name}**
Keywords: ${char.keywords.join(', ')}
Level ${char.level} | HP: ${char.hp}/${char.maxHp} | AC: ${char.ac}
STR ${char.stats.str}, DEX ${char.stats.dex}, INT ${char.stats.int}, WIS ${char.stats.wis}, CON ${char.stats.con}, CHA ${char.stats.cha}
Aptitudes: ${char.aptitudes.join(', ') || 'None'}
Equipment: ${char.equipment.join(', ') || 'None'}

Create an evocative opening scene and give them something interesting to engage with.`;

  appendMessage('system', 'Starting new adventure...');
  await sendToAI(initialMessage, true);
}

async function sendMessage() {
  const input = document.getElementById('player-input');
  const message = input.value.trim();

  if (!message) return;

  input.value = '';
  appendMessage('player', message);
  gameState.chatHistory.push({ role: 'player', content: message });
  saveState();

  await sendToAI(message, false);
}

async function sendToAI(message, isInitial = false) {
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;

  // Show loading
  const loadingId = appendMessage('gm', '<span class="loading"></span> Thinking...');

  try {
    const provider = getApiProvider();
    const response = await callAI(provider, message, isInitial);

    // Remove loading message
    document.getElementById(loadingId)?.remove();

    // Process response
    const { narrative, memory } = parseAIResponse(response);

    // Validate response for rule violations
    const warnings = validateAIResponse(narrative);
    if (warnings.length > 0) {
      console.warn('Rule violations detected:', warnings);
      // Optionally show warnings to user (commented out for now - can be annoying)
      // warnings.forEach(w => appendMessage('warning', w));
    }

    appendMessage('gm', narrative);
    gameState.chatHistory.push({ role: 'gm', content: narrative });

    // Process memory updates
    if (memory) {
      processMemoryUpdate(memory);
    }

    saveState();
    updateGameHeader();

  } catch (error) {
    document.getElementById(loadingId)?.remove();
    appendMessage('error', `Error: ${error.message}`);
  }

  sendBtn.disabled = false;
  const chatContainer = document.getElementById('chat-container');
  setTimeout(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 50);
}

async function callAI(provider, userMessage, isInitial) {
  const apiKey = getApiKey();
  const endpoint = API_ENDPOINTS[provider];
  const model = MODELS[provider];

  // Add dynamic rules based on user action
  const rulesContext = buildDynamicRulesContext(userMessage);
  const enhancedMessage = isInitial ? userMessage : rulesContext + 'Player action: ' + userMessage;

  // Build context
  const context = buildContext();
  
  // Add periodic rules reminder every 5 turns
  const turnCount = Math.floor(gameState.chatHistory.length / 2);
  const rulesReminder = (turnCount > 0 && turnCount % 5 === 0) 
    ? '\n\n**RULES REMINDER:** Tests = d20 + stat (0-6) vs DC 12. Stats are the ONLY source of bonuses. Aptitudes grant advantage (2d20 take higher), never +numbers. Keywords are narrative flavor only.'
    : '';
  
  const systemWithContext = SYSTEM_PROMPT + '\n\n## Current Context\n\n' + context + rulesReminder;

  // SLIDING WINDOW: Only keep recent history
  const maxHistoryMessages = CONFIG.MAX_HISTORY_TURNS * 2; // *2 because each turn is user+assistant
  const recentHistory = gameState.chatHistory.slice(-maxHistoryMessages);

  // Build messages
  let messages;
  if (provider === 'anthropic') {
    messages = recentHistory
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'gm' ? 'assistant' : 'user',
        content: m.content
      }));

    if (!isInitial) {
      messages.push({ role: 'user', content: enhancedMessage });
    } else {
      messages = [{ role: 'user', content: enhancedMessage }];
    }
  } else {
    // OpenAI format
    messages = [{ role: 'system', content: systemWithContext }];
    recentHistory
      .filter(m => m.role !== 'system')
      .forEach(m => {
        messages.push({
          role: m.role === 'gm' ? 'assistant' : 'user',
          content: m.content
        });
      });
    if (!isInitial) {
      messages.push({ role: 'user', content: enhancedMessage });
    }
  }

  // Make API call
  let body, headers;

  if (provider === 'anthropic') {
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    body = JSON.stringify({
      model,
      max_tokens: CONFIG.MAX_OUTPUT_TOKENS, // Reduced from 1500
      system: systemWithContext,
      messages
    });
  } else {
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    body = JSON.stringify({
      model,
      max_tokens: CONFIG.MAX_OUTPUT_TOKENS, // Reduced from 1500
      messages
    });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();

  // Track token usage
  if (provider === 'anthropic' && data.usage) {
    gameState.tokenUsage.inputTokens += data.usage.input_tokens || 0;
    gameState.tokenUsage.outputTokens += data.usage.output_tokens || 0;
    // Anthropic pricing: $3/M input, $15/M output (for Claude Sonnet)
    const inputCost = (data.usage.input_tokens || 0) * 3 / 1000000;
    const outputCost = (data.usage.output_tokens || 0) * 15 / 1000000;
    gameState.tokenUsage.estimatedCost += inputCost + outputCost;
    updateTokenDisplay();
  } else if (provider === 'openai' && data.usage) {
    gameState.tokenUsage.inputTokens += data.usage.prompt_tokens || 0;
    gameState.tokenUsage.outputTokens += data.usage.completion_tokens || 0;
    // OpenAI pricing varies by model, using GPT-4o estimate: $2.50/M input, $10/M output
    const inputCost = (data.usage.prompt_tokens || 0) * 2.5 / 1000000;
    const outputCost = (data.usage.completion_tokens || 0) * 10 / 1000000;
    gameState.tokenUsage.estimatedCost += inputCost + outputCost;
    updateTokenDisplay();
  }

  if (provider === 'anthropic') {
    return data.content[0].text;
  } else {
    return data.choices[0].message.content;
  }
}

function updateTokenDisplay() {
  const statusElem = document.getElementById('character-status');
  if (statusElem && gameState.character) {
    const cost = gameState.tokenUsage.estimatedCost.toFixed(3);
    const tokens = gameState.tokenUsage.inputTokens + gameState.tokenUsage.outputTokens;
    statusElem.textContent = 
      `HP: ${gameState.character.hp}/${gameState.character.maxHp} | Fortune: ${gameState.character.fortune} | Cost: $${cost} (${(tokens/1000).toFixed(1)}k tokens)`;
  }
}

function buildContext() {
  const parts = [];

  // Character (ALWAYS include - this is the stat reference)
  if (gameState.character) {
    const c = gameState.character;
    parts.push(`**ACTIVE CHARACTER:**
${c.name} | L${c.level} | HP ${c.hp}/${c.maxHp} | AC ${c.ac} | Fortune ${c.fortune}
STR +${c.stats.str}, DEX +${c.stats.dex}, INT +${c.stats.int}, WIS +${c.stats.wis}, CON +${c.stats.con}, CHA +${c.stats.cha}
Aptitudes: ${c.aptitudes.join(', ') || 'None'}
Equipment: ${c.equipment.join(', ') || 'None'}

These are the ONLY modifiers that exist for this character. No proficiency, skill bonuses, or expertise exist.`);
  }

  // Current location ONLY (not all locations)
  if (gameState.world.currentLocation) {
    const locId = gameState.world.currentLocation;
    const loc = gameState.world.locations[locId];
    if (loc) {
      // Limit NPCs to prevent bloat
      const npcList = Array.isArray(loc.npcs) 
        ? loc.npcs.slice(0, CONFIG.MAX_NPCS_IN_CONTEXT)
        : [];
      const npcs = npcList.length > 0 ? npcList.join(', ') : 'None';
      
      parts.push(`**Current Location:** ${loc.name}
${loc.description}
NPCs here: ${npcs}${loc.npcs?.length > CONFIG.MAX_NPCS_IN_CONTEXT ? ' (and others)' : ''}
Notes: ${loc.notes || 'None'}`);
      
      // Include world evolution hint if location has changed
      if (loc.lastVisit && loc.lastVisit < gameState.world.currentTimestamp - 3600000) {
        const hoursPassed = Math.floor((gameState.world.currentTimestamp - loc.lastVisit) / 3600000);
        parts.push(`Time since last visit: ~${hoursPassed} hours`);
      }
    }
  }

  // Recent events ONLY (not entire history)
  const recentEvents = gameState.world.events.slice(-CONFIG.MAX_EVENTS_IN_CONTEXT);
  if (recentEvents.length > 0) {
    const eventList = recentEvents.map(e => {
      // Handle both old format (string) and new format (object with timestamp)
      return typeof e === 'string' ? `- ${e}` : `- ${e.text}`;
    }).join('\n');
    parts.push(`**Recent Events:**\n${eventList}`);
  }
  
  // Check for world evolution
  const evolutionHint = evolveWorld();
  if (evolutionHint) {
    parts.push(`**World State:** ${evolutionHint}`);
  }

  return parts.join('\n\n');
}

// Helper: Find aptitude definition from RATH_DATA
function findAptitude(name) {
  // Search skill aptitudes
  for (const category in RATH_DATA.skillAptitudes) {
    const apt = RATH_DATA.skillAptitudes[category].find(a => a.name === name);
    if (apt) return apt;
  }
  // Search inherent aptitudes
  for (const category in RATH_DATA.inherentAptitudes) {
    const apt = RATH_DATA.inherentAptitudes[category].find(a => a.name === name);
    if (apt) return apt;
  }
  return null;
}

// Build dynamic rules reminders based on player action
function buildDynamicRulesContext(userMessage) {
  const rules = [];
  const lower = userMessage.toLowerCase();
  
  // Combat reminders
  if (lower.match(/attack|hit|strike|shoot|fight|stab|slash/)) {
    rules.push(`**COMBAT REMINDER:** Attack = d20 + STR (melee) or DEX (ranged) vs target AC. Damage = weapon die + STR for melee. Natural 20 = target loses 1 AC until combat ends. NO other bonuses exist.`);
  }
  
  // Skill test reminders
  if (lower.match(/sneak|hide|track|pick|unlock|climb|swim|jump|search/)) {
    rules.push(`**SKILL REMINDER:** Test = d20 + relevant stat vs DC 12. Aptitudes grant ADVANTAGE (roll 2d20, take higher), never numerical bonuses. Keywords are purely narrative flavor.`);
  }
  
  // Magic reminders
  if (lower.match(/cast|spell|magic|scroll/)) {
    rules.push(`**MAGIC REMINDER:** Hedge Magic = DC 12 INT test, always works if passed, utility only. Chartomancer = scroll-dependent, INT test DC 12 to preserve scroll after casting.`);
  }
  
  // Smart aptitude detection - match player intent to aptitude triggers
  if (gameState.character?.aptitudes) {
    const relevantAptitudes = [];
    
    // Build keyword → aptitude mapping
    const aptitudeMap = [
      { keywords: ['track', 'hunt', 'forage', 'navigate', 'wilderness', 'survive'], aptNames: ['Wild Walker'] },
      { keywords: ['sneak', 'hide', 'quiet', 'undetected', 'stealth'], aptNames: ['Move Silently and Unseen'] },
      { keywords: ['lock', 'pick', 'trap', 'disable', 'break', 'enter'], aptNames: ['Break and Enter'] },
      { keywords: ['attack', 'stab', 'backstab', 'ambush', 'surprise'], aptNames: ['Backstab', 'Dagger Master'] },
      { keywords: ['attack', 'kill', 'defeat', 'slay'], aptNames: ['Cleave'] },
      { keywords: ['persuade', 'convince', 'negotiate', 'talk', 'diplomacy'], aptNames: ['Silver Tongue'] },
      { keywords: ['heal', 'tend', 'cure', 'medicine'], aptNames: ['Heal'] },
      { keywords: ['rage', 'fury', 'berserk', 'angry'], aptNames: ['Berserker'] },
      { keywords: ['aim', 'target', 'shoot', 'archery'], aptNames: ['Marksman', 'Hawkeye'] },
      { keywords: ['secret', 'trap', 'hidden', 'construction'], aptNames: ['Dungeon Sense'] },
      { keywords: ['undead', 'zombie', 'skeleton', 'ghost'], aptNames: ['Turn Undead'] }
    ];
    
    // Check which aptitudes might apply
    for (const mapping of aptitudeMap) {
      const triggered = mapping.keywords.some(kw => lower.includes(kw));
      if (triggered) {
        for (const aptName of mapping.aptNames) {
          if (gameState.character.aptitudes.includes(aptName)) {
            const apt = findAptitude(aptName);
            if (apt && !relevantAptitudes.find(a => a.name === aptName)) {
              relevantAptitudes.push(apt);
            }
          }
        }
      }
    }
    
    // Add relevant aptitudes to context
    if (relevantAptitudes.length > 0) {
      const aptText = relevantAptitudes.map(apt => 
        `**${apt.name}:** ${apt.description}`
      ).join('\n\n');
      rules.push(`**RELEVANT APTITUDES:**\n\n${aptText}`);
    }
  }
  
  return rules.length > 0 ? rules.join('\n\n') + '\n\n---\n\n' : '';
}

// Validate AI response for rule violations
function validateAIResponse(response) {
  const warnings = [];
  
  // Check for illegal bonuses (proficiency, skill, expertise)
  const illegalBonus = response.match(/\+\d+\s+(proficiency|skill|expertise|background)/gi);
  if (illegalBonus) {
    illegalBonus.forEach(match => 
      warnings.push(`🚫 Illegal bonus detected: "${match}" - Only stats grant bonuses`)
    );
  }
  
  // Check for missing stat labels in roll notation
  const rolls = response.match(/d20\s*\+\s*\d+/gi);
  if (rolls) {
    rolls.forEach(roll => {
      const context = response.substring(
        Math.max(0, response.indexOf(roll) - 30),
        Math.min(response.length, response.indexOf(roll) + 30)
      );
      const hasStatLabel = context.match(/(STR|DEX|INT|WIS|CON|CHA)/i);
      
      if (!hasStatLabel) {
        warnings.push(`⚠️ Roll "${roll}" is missing stat label (STR/DEX/INT/WIS/CON/CHA)`);
      }
    });
  }
  
  // Check for wrong default DC (should be 12 unless specified otherwise)
  const dcMatches = response.match(/DC\s+(\d+)/gi);
  if (dcMatches) {
    dcMatches.forEach(match => {
      const dc = parseInt(match.match(/\d+/)[0]);
      // Valid DCs in Rath: 10 (easy), 12 (standard), 15 (hard), 18 (very hard), 20 (nearly impossible)
      if (![10, 12, 15, 18, 20].includes(dc)) {
        warnings.push(`⚠️ Non-standard DC: ${match} (Rath uses DC 10/12/15/18/20)`);
      }
    });
  }
  
  // Check for flat damage bonuses on non-melee attacks
  const rangedDamage = response.match(/(bow|crossbow|arrow|shoot|ranged).*?(\d+d\d+)\s*\+\s*\d+/gi);
  if (rangedDamage) {
    warnings.push(`⚠️ Ranged attacks should not add STR to damage (only melee does)`);
  }
  
  // Check for advantage stacking
  const advantageStacking = response.match(/advantage.*?advantage/gi);
  if (advantageStacking && advantageStacking.length > 1) {
    warnings.push(`⚠️ Multiple "advantage" mentions - advantage doesn't stack in Rath`);
  }
  
  return warnings;
}

function parseAIResponse(response) {
  // Extract memory block if present
  const memoryMatch = response.match(/```memory\s*([\s\S]*?)\s*```/);
  let memory = null;
  let narrative = response;

  if (memoryMatch) {
    try {
      memory = JSON.parse(memoryMatch[1]);
      narrative = response.replace(/```memory[\s\S]*?```/, '').trim();
    } catch (e) {
      console.warn('Failed to parse memory block:', e);
    }
  }

  return { narrative, memory };
}

function processMemoryUpdate(memory) {
  // Update location with timestamp
  if (memory.location_update) {
    const loc = memory.location_update;
    const prevLocation = gameState.world.currentLocation;
    
    // Store when we last visited the previous location
    if (prevLocation && prevLocation !== loc.id && gameState.world.locations[prevLocation]) {
      gameState.world.locations[prevLocation].lastVisit = gameState.world.currentTimestamp;
    }
    
    gameState.world.locations[loc.id] = {
      ...gameState.world.locations[loc.id],
      ...loc,
      lastVisit: gameState.world.currentTimestamp
    };
    gameState.world.currentLocation = loc.id;
    
    // Update game timestamp (simulate time passing)
    gameState.world.currentTimestamp = Date.now();
  }

  // Update NPC
  if (memory.npc_update) {
    const npc = memory.npc_update;
    gameState.world.npcs[npc.id] = {
      ...gameState.world.npcs[npc.id],
      ...npc,
      lastSeen: gameState.world.currentTimestamp
    };
  }

  // Add event with timestamp
  if (memory.event) {
    gameState.world.events.push({
      text: memory.event,
      timestamp: gameState.world.currentTimestamp
    });
    
    // Trim old events to prevent bloat (keep last 20)
    if (gameState.world.events.length > 20) {
      gameState.world.events = gameState.world.events.slice(-20);
    }
  }

  // Update character
  if (memory.character_update && gameState.character) {
    const update = memory.character_update;
    if (update.hp_change) {
      gameState.character.hp = Math.max(0,
        Math.min(gameState.character.maxHp,
          gameState.character.hp + update.hp_change));
    }
    if (update.item_gained) {
      gameState.character.equipment.push(update.item_gained);
    }
    if (update.item_lost) {
      const idx = gameState.character.equipment.indexOf(update.item_lost);
      if (idx > -1) gameState.character.equipment.splice(idx, 1);
    }
    if (update.fortune_change) {
      gameState.character.fortune = Math.max(0, 
        Math.min(3, gameState.character.fortune + update.fortune_change));
    }
  }
}

// World evolution: Update locations when returning after time has passed
function evolveWorld() {
  const currentTime = gameState.world.currentTimestamp;
  const evolvedLocations = [];
  
  Object.entries(gameState.world.locations).forEach(([id, loc]) => {
    if (!loc.lastVisit) return;
    if (id === gameState.world.currentLocation) return; // Don't evolve current location
    
    const hoursSinceVisit = (currentTime - loc.lastVisit) / 3600000;
    
    // If more than 6 hours have passed, location might have changed
    if (hoursSinceVisit > 6) {
      evolvedLocations.push({
        id,
        name: loc.name,
        hoursPassed: Math.floor(hoursSinceVisit)
      });
    }
  });
  
  // If any locations have evolved, add hint to context
  if (evolvedLocations.length > 0 && gameState.chatHistory.length > 0) {
    // This will be picked up by buildContext on next turn
    return `The world has moved on while you were away: ${evolvedLocations.map(l => `${l.name} (${l.hoursPassed}h)`).join(', ')}.`;
  }
  
  return null;
}

// ============ UI Helpers ============

function appendMessage(role, content) {
  const messagesDiv = document.getElementById('chat-messages');
  const chatContainer = document.getElementById('chat-container');
  const messageDiv = document.createElement('div');
  const id = 'msg-' + Date.now();
  messageDiv.id = id;
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `<div class="message-content">${formatMessage(content)}</div>`;
  messagesDiv.appendChild(messageDiv);
  // Scroll the container, not the messages div
  setTimeout(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 50);
  return id;
}

function formatMessage(content) {
  // Basic markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// Close modal when clicking overlay
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
});
