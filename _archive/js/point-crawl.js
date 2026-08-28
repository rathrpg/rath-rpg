// Point Crawl Adventure System for Rath RPG

const STORAGE_KEY = 'rath_pointcrawl_state';

let gameState = {
  apiKey: '',
  adventure: null,
  character: null,
  currentNodeId: null,
  visitedNodes: [],
  completedConnections: [],
  log: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadApiKey();
  attachEventListeners();
  updatePointsRemaining();
});

function attachEventListeners() {
  document.getElementById('test-key-btn').addEventListener('click', testApiKey);
  document.getElementById('generate-adventure-btn').addEventListener('click', generateAdventure);
  
  const loadSampleBtn = document.getElementById('load-sample-btn');
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', loadSampleAdventure);
  }
  
  document.getElementById('load-adventure-btn').addEventListener('click', () => {
    document.getElementById('adventure-file-input').click();
  });
  document.getElementById('adventure-file-input').addEventListener('change', loadAdventureFile);
  document.getElementById('start-adventure-btn').addEventListener('click', startAdventure);
  document.getElementById('back-to-menu-btn').addEventListener('click', backToMenu);
  document.getElementById('save-adventure-btn').addEventListener('click', saveAdventure);
  
  document.getElementById('toggle-character-panel').addEventListener('click', toggleCharacterPanel);
  document.getElementById('toggle-map-panel').addEventListener('click', toggleMapPanel);
  
  // Initialize stat array dropdowns
  initializeStatArrays();
}

function loadSampleAdventure() {
  const status = document.getElementById('generation-status');
  status.textContent = 'Loading sample adventure...';
  status.className = '';
  
  const adventure = {
    "title": "The Cursed Barrow",
    "description": "An ancient burial mound radiates dark magic. Locals whisper of treasure and doom.",
    "starting_node": "entrance",
    "goal_nodes": ["throne_room"],
    "nodes": [
      {
        "id": "entrance",
        "title": "Barrow Entrance",
        "description": "Ancient stone doors stand half-open, covered in moss and strange runes. A cold wind whistles from within, carrying the scent of decay.",
        "first_visit_text": "Your torch flickers as you approach. The runes seem to shift in the firelight, forming warnings in forgotten tongues.",
        "loot": [],
        "combat": null,
        "choices": [
          {
            "text": "Force the doors open wider (STR check, DC 12)",
            "type": "skill_check",
            "stat": "str",
            "dc": 12,
            "success_node": "main_hall",
            "failure_node": "entrance_trap",
            "failure_damage": 3
          },
          {
            "text": "Examine the runes carefully (INT check, DC 12)",
            "type": "skill_check",
            "stat": "int",
            "dc": 12,
            "success_node": "secret_passage",
            "failure_node": "main_hall"
          },
          {
            "text": "Slip through the gap quietly",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "entrance_trap",
        "title": "Barrow Entrance - Trapped!",
        "description": "The doors slam shut behind you as ancient mechanisms grind to life. Stone blocks fall from above!",
        "loot": [],
        "combat": null,
        "choices": [
          {
            "text": "Press forward into the darkness",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "secret_passage",
        "title": "Hidden Passage",
        "description": "The runes revealed a hidden mechanism. A narrow passage opens, bypassing the main hall. Cobwebs hang thick here.",
        "first_visit_text": "This passage hasn't been used in centuries. The air is stale and heavy.",
        "loot": ["ancient coin", "dusty potion"],
        "combat": null,
        "choices": [
          {
            "text": "Continue through the secret way",
            "type": "navigate",
            "target_node": "treasury"
          },
          {
            "text": "Return to the main entrance",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "main_hall",
        "title": "Main Hall",
        "description": "A vast chamber with crumbling pillars. Faded murals depict ancient battles and burial rites. Three passages lead deeper: north, east, and west.",
        "loot": ["torch", "rusty shield"],
        "combat": null,
        "choices": [
          {
            "text": "Take the north passage (sounds of shuffling)",
            "type": "navigate",
            "target_node": "crypt"
          },
          {
            "text": "Take the east passage (cold air flows from here)",
            "type": "navigate",
            "target_node": "ice_chamber"
          },
          {
            "text": "Take the west passage (faint light visible)",
            "type": "navigate",
            "target_node": "treasury"
          }
        ]
      },
      {
        "id": "crypt",
        "title": "The Crypt",
        "description": "Stone sarcophagi line the walls. One lies open, empty. Bones litter the floor.",
        "loot": ["silver dagger", "burial shroud"],
        "combat": {
          "name": "Skeleton Warrior",
          "hp": 12,
          "ac": 13,
          "attack_bonus": 2,
          "damage": "1d6+1"
        },
        "choices": [
          {
            "text": "Continue north to the throne room",
            "type": "navigate",
            "target_node": "throne_room"
          },
          {
            "text": "Return to the main hall",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "ice_chamber",
        "title": "Frozen Chamber",
        "description": "Frost covers every surface. Your breath mists in the freezing air. An ice sculpture of a warrior dominates the center.",
        "first_visit_text": "The cold is unnatural, biting through your clothes instantly.",
        "loot": ["frost-touched spear"],
        "combat": null,
        "choices": [
          {
            "text": "Examine the ice sculpture (WIS check, DC 12)",
            "type": "skill_check",
            "stat": "wis",
            "dc": 12,
            "success_node": "ice_treasure",
            "failure_node": "ice_trap",
            "failure_damage": 4
          },
          {
            "text": "Leave this cursed place",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "ice_trap",
        "title": "Frozen Chamber - Ambush!",
        "description": "The sculpture shatters! Ice shards cut deep as a ghostly figure materializes.",
        "loot": [],
        "combat": {
          "name": "Ice Wraith",
          "hp": 10,
          "ac": 14,
          "attack_bonus": 3,
          "damage": "1d6+2"
        },
        "choices": [
          {
            "text": "Flee to the main hall",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "ice_treasure",
        "title": "Frozen Chamber - Hidden Cache",
        "description": "You noticed the trap mechanism! Behind the sculpture, a hidden alcove holds treasures preserved in ice.",
        "loot": ["enchanted amulet", "gold coins (20)"],
        "combat": null,
        "choices": [
          {
            "text": "Return to the main hall",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "treasury",
        "title": "Treasury",
        "description": "Gold and silver gleam in the torchlight. Most is tarnished, but still valuable. A locked iron chest sits in the corner.",
        "loot": ["gold coins (15)", "silver necklace"],
        "combat": null,
        "choices": [
          {
            "text": "Try to pick the lock (DEX check, DC 12)",
            "type": "skill_check",
            "stat": "dex",
            "dc": 12,
            "success_node": "chest_opened",
            "failure_node": "treasury"
          },
          {
            "text": "Smash the chest open (STR check, DC 12)",
            "type": "skill_check",
            "stat": "str",
            "dc": 12,
            "success_node": "chest_opened",
            "failure_node": "treasury"
          },
          {
            "text": "Leave the chest and return",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "chest_opened",
        "title": "Treasury - Chest Opened",
        "description": "The chest opens with a creak. Inside: a beautifully crafted sword and an old map.",
        "loot": ["fine longsword", "treasure map"],
        "combat": null,
        "choices": [
          {
            "text": "Return to the main hall",
            "type": "navigate",
            "target_node": "main_hall"
          }
        ]
      },
      {
        "id": "throne_room",
        "title": "Throne Room",
        "description": "A massive stone throne sits atop steps of black marble. Upon it rests a skeletal figure in rotting royal garb, crown still affixed to its skull.",
        "first_visit_text": "As you enter, the skeleton's eyes ignite with unholy green flame. It rises, ancient blade in hand.",
        "loot": [],
        "combat": {
          "name": "Barrow King",
          "hp": 18,
          "ac": 15,
          "attack_bonus": 4,
          "damage": "1d8+2"
        },
        "choices": [
          {
            "text": "Claim the crown and escape!",
            "type": "navigate",
            "target_node": "victory"
          }
        ]
      },
      {
        "id": "victory",
        "title": "Victory!",
        "description": "The Barrow King falls, dissolving into dust. You claim the cursed crown - worth a fortune to collectors. The barrow begins to collapse around you as ancient magic fades. You escape into the sunlight, wealthy but changed by what you've seen.",
        "loot": ["Cursed Crown (priceless)"],
        "combat": null,
        "choices": []
      }
    ],
    "connections": [
      {
        "from": "main_hall",
        "to": "crypt",
        "description": "A dark corridor filled with the sound of shuffling bones.",
        "random_encounter_chance": 0.3,
        "encounters": [
          {
            "type": "combat",
            "enemy": {
              "name": "Skeleton",
              "hp": 6,
              "ac": 12,
              "attack_bonus": 1,
              "damage": "1d6"
            }
          }
        ]
      },
      {
        "from": "main_hall",
        "to": "ice_chamber",
        "description": "The temperature drops as you walk. Frost forms on the walls.",
        "random_encounter_chance": 0.2,
        "encounters": []
      },
      {
        "from": "crypt",
        "to": "throne_room",
        "description": "Stone steps lead upward. The air grows heavy with dread.",
        "random_encounter_chance": 0,
        "encounters": []
      }
    ]
  };
  
  gameState.adventure = adventure;
  status.textContent = `✓ Loaded: ${adventure.title}`;
  status.className = 'success';
  document.getElementById('character-setup').style.display = 'block';
}

function loadApiKey() {
  const saved = localStorage.getItem('rath_pointcrawl_apikey');
  if (saved) {
    document.getElementById('api-key-input').value = saved;
    gameState.apiKey = saved;
  }
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key) {
    localStorage.setItem('rath_pointcrawl_apikey', key);
    gameState.apiKey = key;
  }
}

async function testApiKey() {
  const keyInput = document.getElementById('api-key-input');
  const status = document.getElementById('key-status');
  const key = keyInput.value.trim();
  
  if (!key) {
    status.textContent = 'Please enter an API key';
    status.className = 'error';
    return;
  }
  
  status.textContent = 'Testing...';
  status.className = '';
  
  try {
    // Test with OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.ok) {
      saveApiKey();
      status.textContent = '✓ API key valid';
      status.className = 'success';
    } else {
      status.textContent = '✗ Invalid API key';
      status.className = 'error';
    }
  } catch (err) {
    status.textContent = '✗ Connection error: ' + err.message;
    status.className = 'error';
  }
}

// Rath standard stat array
const STAT_ARRAY = [3, 2, 2, 1, 1, 0];

function initializeStatArrays() {
  const selects = document.querySelectorAll('.stat-select');
  
  // Populate each dropdown with the stat array
  selects.forEach(select => {
    STAT_ARRAY.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    
    // Add change listener
    select.addEventListener('change', updateStatArray);
  });
  
  updateStatArray();
}

function updateStatArray() {
  const selects = document.querySelectorAll('.stat-select');
  const selectedValues = [];
  
  // Collect all selected values
  selects.forEach(select => {
    if (select.value !== '') {
      selectedValues.push(parseInt(select.value));
    }
  });
  
  // Check if all values are assigned
  const status = document.getElementById('stat-array-status');
  const remaining = STAT_ARRAY.slice();
  
  selectedValues.forEach(val => {
    const idx = remaining.indexOf(val);
    if (idx !== -1) {
      remaining.splice(idx, 1);
    }
  });
  
  if (remaining.length === 0 && selectedValues.length === 6) {
    status.textContent = '✓ All stats assigned';
    status.style.color = 'green';
  } else if (selectedValues.length === 6) {
    status.textContent = '⚠ Invalid assignment (duplicate values)';
    status.style.color = 'red';
  } else {
    status.textContent = `Remaining values: ${remaining.join(', ')}`;
    status.style.color = 'black';
  }
}

async function generateAdventure() {
  const theme = document.getElementById('adventure-theme').value.trim();
  const status = document.getElementById('generation-status');
  const btn = document.getElementById('generate-adventure-btn');
  
  if (!gameState.apiKey) {
    status.textContent = 'Please set a valid API key first';
    status.className = 'error';
    return;
  }
  
  if (!theme) {
    status.textContent = 'Please enter an adventure theme';
    status.className = 'error';
    return;
  }
  
  btn.disabled = true;
  status.textContent = 'Generating adventure... (this may take 30-60 seconds)';
  status.className = '';
  
  // Update status during generation
  const originalStatus = status.textContent;
  
  try {
    const adventure = await callAdventureGenerator(theme, (msg) => {
      status.textContent = originalStatus + ' ' + msg;
    });
    gameState.adventure = adventure;
    status.textContent = `✓ Generated: ${adventure.title}`;
    status.className = 'success';
    document.getElementById('character-setup').style.display = 'block';
    
    // Enable save for later
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Adventure for Later';
    saveBtn.onclick = () => downloadAdventureJSON(adventure);
    document.getElementById('generation-status').appendChild(saveBtn);
    
  } catch (err) {
    status.textContent = `✗ Generation failed: ${err.message}`;
    status.className = 'error';
    btn.disabled = false;
  }
}

async function callAdventureGenerator(theme, statusCallback) {
  const prompt = `You are a game master creating a point-crawl adventure for the Rath RPG system.

Generate a complete adventure JSON with 8-12 interconnected location nodes. The adventure should:
- Have a clear goal/resolution
- Include varied challenges (combat, puzzles, social encounters)
- Offer meaningful choices with consequences
- Have multiple paths to the conclusion

Theme: ${theme}

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:

{
  "title": "Adventure Title",
  "description": "Brief premise",
  "starting_node": "entrance",
  "goal_nodes": ["finale"],
  "nodes": [
    {
      "id": "entrance",
      "title": "Location Name",
      "description": "Rich description (2-3 sentences)",
      "first_visit_text": "Additional flavor on first arrival",
      "loot": ["item1", "item2"],
      "combat": null,
      "choices": [
        {
          "text": "Action description",
          "type": "navigate",
          "target_node": "next_node"
        },
        {
          "text": "Skill check action",
          "type": "skill_check",
          "stat": "str",
          "dc": 12,
          "success_node": "success_room",
          "failure_node": "failure_room",
          "failure_damage": 2
        }
      ]
    }
  ],
  "connections": [
    {
      "from": "node1",
      "to": "node2",
      "description": "Path description",
      "random_encounter_chance": 0.3,
      "encounters": [
        {
          "type": "combat",
          "enemy": {"name": "Goblin", "hp": 8, "ac": 12, "attack_bonus": 2, "damage": "1d6"}
        }
      ]
    }
  ]
}

Combat encounters should be appropriate for level 1-2 characters. Include interesting environmental details and choices.`;

  // Try with retries using OpenRouter (browser-friendly)
  const models = [
    {name: 'anthropic/claude-3.5-sonnet', display: 'Sonnet 3.5'},
    {name: 'anthropic/claude-3-haiku', display: 'Haiku 3'}
  ];
  
  let lastError = null;
  
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (statusCallback) {
          statusCallback(`(${model.display}, attempt ${attempt})`);
        }
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gameState.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'Rath Point Crawl'
          },
          body: JSON.stringify({
            model: model.name,
            max_tokens: 8000,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`${model.display} (${response.status}): ${errorText.substring(0, 150)}`);
          console.error(`Attempt ${attempt} with ${model.display} failed:`, lastError);
          
          // Wait before retry
          if (attempt === 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          continue;
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Try to extract JSON if wrapped in markdown
        let jsonText = content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
        
        return JSON.parse(jsonText);
        
      } catch (err) {
        lastError = err;
        console.error(`Error with ${model.display} attempt ${attempt}:`, err);
        if (attempt === 1 && !err.message.includes('JSON')) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
  }
  
  // If we got here, all attempts failed
  throw new Error(`Generation failed after all retries. Last error: ${lastError?.message || 'Unknown'}. Please try again.`);
}

function loadAdventureFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const adventure = JSON.parse(e.target.result);
      gameState.adventure = adventure;
      document.getElementById('generation-status').textContent = `✓ Loaded: ${adventure.title}`;
      document.getElementById('generation-status').className = 'success';
      document.getElementById('character-setup').style.display = 'block';
    } catch (err) {
      alert('Invalid adventure file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function startAdventure() {
  const name = document.getElementById('char-name').value.trim();
  if (!name) {
    alert('Please enter a character name');
    return;
  }
  
  // Validate stat array assignment
  const selects = document.querySelectorAll('.stat-select');
  const selectedValues = [];
  const stats = {};
  
  selects.forEach(select => {
    const stat = select.dataset.stat;
    const val = select.value;
    if (!val || val === '') {
      alert('Please assign all stat values');
      return;
    }
    stats[stat] = parseInt(val);
    selectedValues.push(parseInt(val));
  });
  
  // Verify all values from stat array are used exactly once
  const sortedSelected = selectedValues.slice().sort((a, b) => a - b);
  const sortedArray = STAT_ARRAY.slice().sort((a, b) => a - b);
  
  if (JSON.stringify(sortedSelected) !== JSON.stringify(sortedArray)) {
    alert('Please assign each value from the stat array (3, 2, 2, 1, 1, 0) exactly once');
    return;
  }
  
  // Create character (Rath rules: 10 + CON inventory slots)
  const hp = 8 + stats.con;
  const maxSlots = 10 + stats.con;
  
  gameState.character = {
    name,
    stats,
    hp,
    maxHp: hp,
    ac: 10 + stats.dex,
    level: 1,
    xp: 0,
    inventory: ["leather armor", "rusty sword", "torch", "rations"],
    slots: 8, // leather armor (2) + sword (2) + torch (1) + rations (1) = 6
    maxSlots: maxSlots,
    fortune: 3
  };
  
  // Start at beginning
  gameState.currentNodeId = gameState.adventure.starting_node;
  gameState.visitedNodes = [gameState.currentNodeId];
  gameState.log = [];
  
  // Switch to game view
  document.getElementById('setup-section').style.display = 'none';
  document.getElementById('game-section').style.display = 'block';
  document.getElementById('adventure-title').textContent = gameState.adventure.title;
  
  renderCurrentLocation();
  updateCharacterPanel();
  updateMap();
}

function renderCurrentLocation() {
  const node = getCurrentNode();
  if (!node) return;
  
  document.getElementById('location-title').textContent = node.title;
  
  // Description
  let desc = node.description;
  if (!gameState.visitedNodes.includes(node.id) && node.first_visit_text) {
    desc += '<br><br>' + node.first_visit_text;
  }
  document.getElementById('location-description').innerHTML = desc;
  
  // Loot (clickable items)
  const lootDiv = document.getElementById('location-loot');
  if (node.loot && node.loot.length > 0) {
    lootDiv.innerHTML = '<strong>Items here:</strong><br>';
    node.loot.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'loot-btn';
      btn.textContent = `📦 ${item}`;
      btn.onclick = () => pickupItem(item, idx);
      lootDiv.appendChild(btn);
    });
    lootDiv.style.display = 'block';
  } else {
    lootDiv.style.display = 'none';
  }
  
  // Choices
  renderChoices(node);
  
  // Check for combat
  if (node.combat) {
    startCombat(node.combat);
  }
}

function renderChoices(node) {
  const choicesDiv = document.getElementById('location-choices');
  choicesDiv.innerHTML = '<h3>What do you do?</h3>';
  
  node.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.onclick = () => handleChoice(choice);
    choicesDiv.appendChild(btn);
  });
}

function handleChoice(choice) {
  switch (choice.type) {
    case 'navigate':
      navigateToNode(choice.target_node);
      break;
    case 'skill_check':
      performSkillCheck(choice);
      break;
    default:
      addLog(`Unknown choice type: ${choice.type}`);
  }
}

function performSkillCheck(choice) {
  const stat = gameState.character.stats[choice.stat];
  const dc = choice.dc || 12; // Default DC 12
  
  // Rath rules: d20 + stat vs DC
  const roll = rollD20();
  const total = roll + stat;
  
  const success = total >= dc;
  
  let logText = `<strong>Skill Check (${choice.stat.toUpperCase()}):</strong> d20 (${roll}) + ${stat} = ${total} vs DC ${dc}`;
  
  // Natural 20 is always a critical success
  if (roll === 20) {
    logText += ` <span style="color: gold;">NAT 20!</span>`;
  }
  // Natural 1 is always a critical failure
  else if (roll === 1) {
    logText += ` <span style="color: darkred;">NAT 1!</span>`;
  }
  
  addLog(logText);
  
  if (success) {
    addLog(`<span style="color: green;">✓ Success!</span>`);
    if (choice.success_node) {
      navigateToNode(choice.success_node);
    }
  } else {
    addLog(`<span style="color: red;">✗ Failure!</span>`);
    if (choice.failure_damage) {
      takeDamage(choice.failure_damage);
    }
    if (choice.failure_node) {
      navigateToNode(choice.failure_node);
    }
  }
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function rollDamage(dieSize, bonus = 0) {
  // Rath rules: Exploding dice (max = roll again and add)
  let total = bonus;
  let roll;
  do {
    roll = Math.floor(Math.random() * dieSize) + 1;
    total += roll;
  } while (roll === dieSize);
  return total;
}

function navigateToNode(nodeId) {
  const fromNode = getCurrentNode();
  const connection = gameState.adventure.connections.find(c => 
    c.from === fromNode.id && c.to === nodeId
  );
  
  if (connection && !gameState.completedConnections.includes(`${fromNode.id}->${nodeId}`)) {
    // Check for random encounter
    if (connection.random_encounter_chance && Math.random() < connection.random_encounter_chance) {
      if (connection.encounters && connection.encounters.length > 0) {
        const encounter = connection.encounters[Math.floor(Math.random() * connection.encounters.length)];
        if (encounter.type === 'combat') {
          addLog(`<strong>Random Encounter!</strong> ${encounter.enemy.name} appears!`);
          startCombat(encounter.enemy);
          // After combat, continue navigation
          gameState.pendingNavigation = nodeId;
          return;
        }
      }
    }
    gameState.completedConnections.push(`${fromNode.id}->${nodeId}`);
  }
  
  gameState.currentNodeId = nodeId;
  if (!gameState.visitedNodes.includes(nodeId)) {
    gameState.visitedNodes.push(nodeId);
  }
  
  renderCurrentLocation();
  updateMap();
}

function startCombat(enemy) {
  addLog(`<strong>Combat begins with ${enemy.name}!</strong>`);
  const combatArea = document.getElementById('combat-area');
  combatArea.style.display = 'block';
  combatArea.innerHTML = `
    <h3>Combat: ${enemy.name}</h3>
    <p>HP: <span id="enemy-hp">${enemy.hp}</span>/${enemy.hp} | AC: <span id="enemy-ac">${enemy.ac}</span></p>
    <button onclick="attackEnemy()">Attack</button>
    <button onclick="flee()">Flee</button>
  `;
  
  gameState.currentCombat = { 
    ...enemy, 
    currentHp: enemy.hp,
    currentAc: enemy.ac,
    baseAc: enemy.ac
  };
  
  // Rath rules: Roll initiative each round
  rollInitiative();
}

function rollInitiative() {
  const roll = Math.floor(Math.random() * 6) + 1;
  if (roll <= 3) {
    addLog(`<em>Initiative: ${roll} - Enemy acts first!</em>`);
    gameState.currentCombat.enemyFirst = true;
    // Enemy attacks immediately
    setTimeout(enemyAttack, 500);
  } else {
    addLog(`<em>Initiative: ${roll} - You act first!</em>`);
    gameState.currentCombat.enemyFirst = false;
  }
}

window.attackEnemy = function() {
  const enemy = gameState.currentCombat;
  if (!enemy) return;
  
  // Rath rules: d20 + STR vs enemy AC
  const pAtkRoll = rollD20();
  const pAtkBonus = gameState.character.stats.str;
  const pTotal = pAtkRoll + pAtkBonus;
  
  let logText = `<strong>Your attack:</strong> d20 (${pAtkRoll}) + ${pAtkBonus} = ${pTotal} vs AC ${enemy.currentAc}`;
  
  // Rath rules: Natural 20 = critical hit (enemy loses 1 AC)
  if (pAtkRoll === 20) {
    logText += ` <span style="color: gold;">CRITICAL HIT!</span>`;
    enemy.currentAc = Math.max(0, enemy.currentAc - 1);
    document.getElementById('enemy-ac').textContent = enemy.currentAc;
    addLog(logText);
    
    // Rath rules: Exploding damage (d6 + STR, exploding on max)
    const damage = rollDamage(6, gameState.character.stats.str);
    enemy.currentHp -= damage;
    addLog(`You deal ${damage} damage!`);
    
    if (enemy.currentHp <= 0) {
      enemyDefeated();
      return;
    }
  } else if (pTotal >= enemy.currentAc) {
    addLog(logText + ` - Hit!`);
    
    // Rath rules: d6 + STR, exploding on 6
    const damage = rollDamage(6, gameState.character.stats.str);
    enemy.currentHp -= damage;
    addLog(`You deal ${damage} damage!`);
    
    if (enemy.currentHp <= 0) {
      enemyDefeated();
      return;
    }
  } else {
    addLog(logText + ` - Miss!`);
  }
  
  document.getElementById('enemy-hp').textContent = Math.max(0, enemy.currentHp);
  
  // Enemy attacks back
  setTimeout(enemyAttack, 800);
};

function enemyAttack() {
  const enemy = gameState.currentCombat;
  if (!enemy || enemy.currentHp <= 0) return;
  
  // Rath rules: d20 + attack bonus vs player AC
  const eAtkRoll = rollD20();
  const eAtkBonus = enemy.attack_bonus || 0;
  const eTotal = eAtkRoll + eAtkBonus;
  
  let logText = `<strong>${enemy.name}'s attack:</strong> d20 (${eAtkRoll}) + ${eAtkBonus} = ${eTotal} vs AC ${gameState.character.ac}`;
  
  if (eAtkRoll === 20) {
    logText += ` <span style="color: gold;">CRITICAL HIT!</span>`;
    gameState.character.ac = Math.max(0, gameState.character.ac - 1);
    addLog(logText);
    
    // Parse damage die from enemy.damage (e.g., "1d6", "2d6", "1d6+2")
    const dmgMatch = enemy.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    const dice = parseInt(dmgMatch[1]);
    const dieSize = parseInt(dmgMatch[2]);
    const flatBonus = dmgMatch[3] ? parseInt(dmgMatch[3]) : 0;
    
    let damage = flatBonus;
    for (let i = 0; i < dice; i++) {
      damage += rollDamage(dieSize, 0);
    }
    
    takeDamage(damage);
    addLog(`${enemy.name} deals ${damage} damage!`);
  } else if (eTotal >= gameState.character.ac) {
    addLog(logText + ` - Hit!`);
    
    // Parse damage die from enemy.damage (e.g., "1d6", "2d6", "1d6+2")
    const dmgMatch = enemy.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    const dice = parseInt(dmgMatch[1]);
    const dieSize = parseInt(dmgMatch[2]);
    const flatBonus = dmgMatch[3] ? parseInt(dmgMatch[3]) : 0;
    
    let damage = flatBonus;
    for (let i = 0; i < dice; i++) {
      damage += rollDamage(dieSize, 0);
    }
    
    takeDamage(damage);
    addLog(`${enemy.name} deals ${damage} damage!`);
  } else {
    addLog(logText + ` - Miss!`);
  }
  
  // Rath rules: Roll initiative for next round
  if (gameState.currentCombat && gameState.character.hp > 0) {
    setTimeout(rollInitiative, 1000);
  }
}

function enemyDefeated() {
  const enemy = gameState.currentCombat;
  addLog(`<span style="color: green;">✓ ${enemy.name} defeated!</span>`);
  document.getElementById('combat-area').style.display = 'none';
  gameState.currentCombat = null;
  
  // Restore character AC to base (Rath rules: AC penalty ends after combat)
  gameState.character.ac = 10 + gameState.character.stats.dex;
  
  // If we have pending navigation, continue it
  if (gameState.pendingNavigation) {
    navigateToNode(gameState.pendingNavigation);
    gameState.pendingNavigation = null;
  }
}

window.flee = function() {
  addLog('You flee from combat!');
  document.getElementById('combat-area').style.display = 'none';
  gameState.currentCombat = null;
  gameState.pendingNavigation = null;
  
  // Rath rules: Restore AC to base after combat ends
  gameState.character.ac = 10 + gameState.character.stats.dex;
};

function takeDamage(amount) {
  gameState.character.hp = Math.max(0, gameState.character.hp - amount);
  updateCharacterPanel();
  
  if (gameState.character.hp === 0) {
    // Rath rules: CON test DC 12 at 0 HP
    addLog('<strong>You drop to 0 HP!</strong>');
    const conRoll = rollD20();
    const conBonus = gameState.character.stats.con;
    const total = conRoll + conBonus;
    
    addLog(`<strong>Death Save (CON):</strong> d20 (${conRoll}) + ${conBonus} = ${total} vs DC 12`);
    
    if (total >= 12) {
      // Success: Adrenaline rush! Gain 1d6 HP
      const recoveredHp = Math.floor(Math.random() * 6) + 1;
      gameState.character.hp = recoveredHp;
      addLog(`<span style="color: green;">✓ Adrenaline rush! You gain ${recoveredHp} HP and keep fighting!</span>`);
      updateCharacterPanel();
    } else {
      // Failure: Out of action
      addLog('<span style="color: red;">✗ You are knocked unconscious...</span>');
      addLog('<span style="color: darkred;">Your adventure ends here.</span>');
      
      // End combat
      document.getElementById('combat-area').style.display = 'none';
      gameState.currentCombat = null;
      
      setTimeout(() => {
        alert('Your character has fallen. You can restart or load a saved adventure.');
      }, 500);
    }
  }
}

function addLog(message) {
  gameState.log.push(message);
  const logArea = document.getElementById('log-area');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = message;
  logArea.appendChild(entry);
  logArea.scrollTop = logArea.scrollHeight;
}

function getCurrentNode() {
  return gameState.adventure.nodes.find(n => n.id === gameState.currentNodeId);
}

function updateCharacterPanel() {
  const char = gameState.character;
  const content = document.getElementById('character-panel-content');
  content.innerHTML = `
    <h3>${char.name}</h3>
    <p><strong>Level ${char.level}</strong> | XP: ${char.xp}</p>
    <p><strong>HP:</strong> ${char.hp}/${char.maxHp} | <strong>AC:</strong> ${char.ac}</p>
    <p><strong>Fortune:</strong> ${char.fortune}</p>
    
    <h4>Stats</h4>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
      <div>STR: ${char.stats.str}</div>
      <div>DEX: ${char.stats.dex}</div>
      <div>INT: ${char.stats.int}</div>
      <div>WIS: ${char.stats.wis}</div>
      <div>CON: ${char.stats.con}</div>
      <div>CHA: ${char.stats.cha}</div>
    </div>
    
    <h4>Inventory (${char.slots}/${char.maxSlots} slots)</h4>
    <div id="inventory-list" style="font-size: 0.9rem; max-height: 200px; overflow-y: auto;">
      ${char.inventory.map((item, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; border-bottom: 1px solid #eee;">
          <span>${item}</span>
          <button onclick="dropItem(${idx})" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;">Drop</button>
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('character-status').textContent = `HP: ${char.hp}/${char.maxHp}`;
}

// Simplified slot calculation (assume 1 slot per item for now)
function getItemSlots(item) {
  // Could be enhanced later to check for armor, weapons, etc.
  return 1;
}

window.pickupItem = function(item, lootIndex) {
  const char = gameState.character;
  const itemSlots = getItemSlots(item);
  
  // Check if there's room
  if (char.slots + itemSlots > char.maxSlots) {
    addLog(`<span style="color: orange;">⚠ Not enough inventory space! (${itemSlots} slot needed, ${char.maxSlots - char.slots} available)</span>`);
    return;
  }
  
  // Add to inventory
  char.inventory.push(item);
  char.slots += itemSlots;
  
  // Remove from location
  const node = getCurrentNode();
  node.loot.splice(lootIndex, 1);
  
  addLog(`✓ Picked up: ${item}`);
  
  // Refresh displays
  renderCurrentLocation();
  updateCharacterPanel();
};

window.dropItem = function(inventoryIndex) {
  const char = gameState.character;
  const item = char.inventory[inventoryIndex];
  const itemSlots = getItemSlots(item);
  
  // Remove from inventory
  char.inventory.splice(inventoryIndex, 1);
  char.slots -= itemSlots;
  
  // Add to current location
  const node = getCurrentNode();
  if (!node.loot) node.loot = [];
  node.loot.push(item);
  
  addLog(`Dropped: ${item}`);
  
  // Refresh displays
  renderCurrentLocation();
  updateCharacterPanel();
};

function updateMap() {
  const mapDiv = document.getElementById('map-visualization');
  const nodes = gameState.adventure.nodes;
  
  let html = '<div class="map-nodes">';
  nodes.forEach(node => {
    const visited = gameState.visitedNodes.includes(node.id);
    const current = node.id === gameState.currentNodeId;
    let className = 'map-node';
    if (current) className += ' current';
    else if (visited) className += ' visited';
    else className += ' unvisited';
    
    html += `<div class="${className}">${node.title}</div>`;
  });
  html += '</div>';
  
  mapDiv.innerHTML = html;
}

function toggleCharacterPanel() {
  const panel = document.getElementById('character-panel');
  const btn = document.getElementById('toggle-character-panel');
  
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    btn.textContent = '📋 Hide';
  } else {
    panel.classList.add('collapsed');
    btn.textContent = '📋 Character';
  }
}

function toggleMapPanel() {
  const panel = document.getElementById('map-panel');
  const btn = document.getElementById('toggle-map-panel');
  
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    btn.textContent = '🗺️ Hide';
  } else {
    panel.classList.add('collapsed');
    btn.textContent = '🗺️ Map';
  }
}

function saveAdventure() {
  const saveData = {
    adventure: gameState.adventure,
    character: gameState.character,
    currentNodeId: gameState.currentNodeId,
    visitedNodes: gameState.visitedNodes,
    completedConnections: gameState.completedConnections,
    log: gameState.log
  };
  
  downloadJSON(saveData, `${gameState.adventure.title.replace(/[^a-z0-9]/gi, '_')}_save.json`);
}

function downloadAdventureJSON(adventure) {
  downloadJSON(adventure, `${adventure.title.replace(/[^a-z0-9]/gi, '_')}_adventure.json`);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function backToMenu() {
  if (confirm('Return to menu? Unsaved progress will be lost.')) {
    document.getElementById('setup-section').style.display = 'block';
    document.getElementById('game-section').style.display = 'none';
    gameState.character = null;
    gameState.currentNodeId = null;
  }
}
