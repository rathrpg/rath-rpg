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

// ============ Game State ============

let gameState = {
  character: null,
  world: {
    locations: {},
    npcs: {},
    events: [],
    currentLocation: null
  },
  chatHistory: [],
  isPlaying: false
};

// ============ Rath RPG System Prompt ============

const SYSTEM_PROMPT = `You are a Game Master for Rath RPG, a rules-light fantasy roleplaying game. You run engaging, dangerous adventures while faithfully applying the game rules.

## Core Rules

**Tests:** d20 + stat >= DC (default DC 12). Natural 20 = critical success, Natural 1 = critical failure.

**Stats:** STR (melee, lifting), DEX (ranged, dodging, sneaking), INT (magic, lore), WIS (perception, tracking), CON (poison/sickness, HP), CHA (social)

**Advantage/Disadvantage:** Roll 2d20, take higher/lower. Multiple sources don't stack. They cancel each other out.

**Combat:**
- Initiative: Roll d6 each round. 1-3 enemies first, 4-6 players first.
- Attack: d20 + STR (melee) or DEX (ranged) vs target's AC
- Damage: Weapon die + STR for melee. Exploding dice (max = roll again, add).
- Natural 20: Target loses 1 AC until combat ends
- At 0 HP: CON test DC 12. Pass = 1d6 HP and fight. Fail = out until danger passes.

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
- Show the roll: "d20 + 2 (DEX) = 15 vs DC 12"
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
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.CHARACTER, JSON.stringify(gameState.character));
  localStorage.setItem(STORAGE_KEYS.WORLD, JSON.stringify(gameState.world));
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(gameState.chatHistory));
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

  content.innerHTML = `
    <h3>Create New Character</h3>
    <div class="form-group">
      <label>Name:</label>
      <input type="text" id="char-name" placeholder="Character name">
    </div>
    <div class="form-group">
      <label>Keywords (species, role, background):</label>
      <input type="text" id="char-keywords" placeholder="e.g., Human, Fighter, Soldier">
    </div>
    <div class="form-group">
      <label>Stats (use standard array: 3, 2, 2, 1, 1, 0):</label>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>STR:</label>
        <input type="number" id="char-str" value="2" min="0" max="6">
      </div>
      <div class="form-group">
        <label>DEX:</label>
        <input type="number" id="char-dex" value="2" min="0" max="6">
      </div>
      <div class="form-group">
        <label>INT:</label>
        <input type="number" id="char-int" value="1" min="0" max="6">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>WIS:</label>
        <input type="number" id="char-wis" value="1" min="0" max="6">
      </div>
      <div class="form-group">
        <label>CON:</label>
        <input type="number" id="char-con" value="3" min="0" max="6">
      </div>
      <div class="form-group">
        <label>CHA:</label>
        <input type="number" id="char-cha" value="0" min="0" max="6">
      </div>
    </div>
    <div class="form-group">
      <label>Aptitudes (comma separated):</label>
      <input type="text" id="char-aptitudes" placeholder="e.g., Cleave, Resilient">
    </div>
    <div class="form-group">
      <label>Equipment (comma separated):</label>
      <input type="text" id="char-equipment" placeholder="e.g., Sword, Shield, Medium Armor">
    </div>
    <div style="margin-top: 1rem;">
      <button class="primary" onclick="createCharacter()">Create</button>
      <button onclick="closeModal()">Cancel</button>
    </div>
  `;

  modal.style.display = 'flex';
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
  const aptitudes = document.getElementById('char-aptitudes').value.trim();
  const equipment = document.getElementById('char-equipment').value.trim();

  if (!name) {
    alert('Please enter a character name');
    return;
  }

  const maxHp = 10 + con;

  gameState.character = {
    name,
    keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
    stats: { str, dex, int, wis, con, cha },
    hp: maxHp,
    maxHp,
    ac: 10 + dex,
    aptitudes: aptitudes.split(',').map(a => a.trim()).filter(a => a),
    equipment: equipment.split(',').map(e => e.trim()).filter(e => e),
    level: 1,
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
    <p><strong>HP:</strong> ${char.hp}/${char.maxHp} | <strong>AC:</strong> ${char.ac} | <strong>Level:</strong> ${char.level}</p>
    <p><strong>Aptitudes:</strong> ${char.aptitudes.join(', ') || 'None'}</p>
    <p><strong>Equipment:</strong> ${char.equipment.join(', ') || 'None'}</p>
  `;
}

// ============ World Management ============

function exportWorld() {
  const data = {
    character: gameState.character,
    world: gameState.world,
    chatHistory: gameState.chatHistory
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
  }
}

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
  document.getElementById('chat-messages').scrollTop =
    document.getElementById('chat-messages').scrollHeight;
}

async function callAI(provider, userMessage, isInitial) {
  const apiKey = getApiKey();
  const endpoint = API_ENDPOINTS[provider];
  const model = MODELS[provider];

  // Build context
  const context = buildContext();
  const systemWithContext = SYSTEM_PROMPT + '\n\n## Current Context\n\n' + context;

  // Build messages
  let messages;
  if (provider === 'anthropic') {
    messages = gameState.chatHistory
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'gm' ? 'assistant' : 'user',
        content: m.content
      }));

    if (!isInitial) {
      messages.push({ role: 'user', content: userMessage });
    } else {
      messages = [{ role: 'user', content: userMessage }];
    }
  } else {
    // OpenAI format
    messages = [{ role: 'system', content: systemWithContext }];
    gameState.chatHistory
      .filter(m => m.role !== 'system')
      .forEach(m => {
        messages.push({
          role: m.role === 'gm' ? 'assistant' : 'user',
          content: m.content
        });
      });
    if (!isInitial) {
      messages.push({ role: 'user', content: userMessage });
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
      max_tokens: 1500,
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
      max_tokens: 1500,
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

  if (provider === 'anthropic') {
    return data.content[0].text;
  } else {
    return data.choices[0].message.content;
  }
}

function buildContext() {
  const parts = [];

  // Character
  if (gameState.character) {
    const c = gameState.character;
    parts.push(`**Character:** ${c.name} (${c.keywords.join(', ')})
Level ${c.level} | HP: ${c.hp}/${c.maxHp} | AC: ${c.ac} | Fortune: ${c.fortune}
Stats: STR ${c.stats.str}, DEX ${c.stats.dex}, INT ${c.stats.int}, WIS ${c.stats.wis}, CON ${c.stats.con}, CHA ${c.stats.cha}
Aptitudes: ${c.aptitudes.join(', ') || 'None'}
Equipment: ${c.equipment.join(', ') || 'None'}`);
  }

  // Current location
  if (gameState.world.currentLocation) {
    const locId = gameState.world.currentLocation;
    const loc = gameState.world.locations[locId];
    if (loc) {
      parts.push(`**Current Location:** ${loc.name}
${loc.description}
NPCs here: ${loc.npcs?.join(', ') || 'None'}
Items: ${loc.items?.join(', ') || 'None'}
Notes: ${loc.notes || 'None'}`);
    }
  }

  // Known NPCs
  const npcIds = Object.keys(gameState.world.npcs);
  if (npcIds.length > 0) {
    const npcList = npcIds.map(id => {
      const npc = gameState.world.npcs[id];
      return `- ${npc.name}: ${npc.description} (${npc.notes || 'no notes'})`;
    }).join('\n');
    parts.push(`**Known NPCs:**\n${npcList}`);
  }

  // Recent events
  const recentEvents = gameState.world.events.slice(-5);
  if (recentEvents.length > 0) {
    parts.push(`**Recent Events:**\n${recentEvents.map(e => '- ' + e).join('\n')}`);
  }

  return parts.join('\n\n');
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
  // Update location
  if (memory.location_update) {
    const loc = memory.location_update;
    gameState.world.locations[loc.id] = {
      ...gameState.world.locations[loc.id],
      ...loc
    };
    gameState.world.currentLocation = loc.id;
  }

  // Update NPC
  if (memory.npc_update) {
    const npc = memory.npc_update;
    gameState.world.npcs[npc.id] = {
      ...gameState.world.npcs[npc.id],
      ...npc
    };
  }

  // Add event
  if (memory.event) {
    gameState.world.events.push(memory.event);
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
  }
}

// ============ UI Helpers ============

function appendMessage(role, content) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  const id = 'msg-' + Date.now();
  messageDiv.id = id;
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `<div class="message-content">${formatMessage(content)}</div>`;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
