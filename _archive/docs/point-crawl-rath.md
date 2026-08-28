# Point Crawl Adventures - Rath Rules

<div id="point-crawl-app">
  <div id="setup-section">
    <h2>Point Crawl Mode (Rath RPG Rules)</h2>
    <p>Generate complete adventures upfront. Navigate pre-built locations using official Rath RPG rules.</p>
    
    <div class="setup-group">
      <label>OpenRouter API Key (optional, for generating new adventures):</label>
      <input type="password" id="api-key-input" placeholder="sk-or-v1-...">
      <button id="test-key-btn">Test Key</button>
      <div id="key-status"></div>
      <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
        Don't have one? <a href="https://openrouter.ai/keys" target="_blank">Get a free OpenRouter key</a> (includes Claude access)
      </p>
    </div>

    <div class="setup-group">
      <h3>Create New Adventure</h3>
      <label>Adventure Theme/Premise:</label>
      <input type="text" id="adventure-theme" placeholder="e.g., 'A haunted barrow full of undead'" style="width: 400px;">
      <button id="generate-adventure-btn">Generate Adventure</button>
      <div id="generation-status"></div>
    </div>

    <div class="setup-group">
      <h3>Or Load Existing Adventure</h3>
      <button id="load-sample-btn">Try Sample: "The Cursed Barrow"</button>
      <button id="load-adventure-btn">Load Adventure JSON</button>
      <input type="file" id="adventure-file-input" accept=".json" style="display: none;">
    </div>

    <div class="setup-group" id="character-setup" style="display:none;">
      <h3>Create Character (Rath Rules)</h3>
      <label>Name:</label>
      <input type="text" id="char-name" placeholder="Character name">
      
      <div style="margin-top: 1rem;">
        <label>Assign stats using: <strong>3, 2, 2, 1, 1, 0</strong></label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-width: 400px; margin-top: 0.5rem;">
          <div><label>STR: <input type="number" class="stat-input" data-stat="str" min="0" max="6" value="2"></label></div>
          <div><label>DEX: <input type="number" class="stat-input" data-stat="dex" min="0" max="6" value="2"></label></div>
          <div><label>INT: <input type="number" class="stat-input" data-stat="int" min="0" max="6" value="1"></label></div>
          <div><label>WIS: <input type="number" class="stat-input" data-stat="wis" min="0" max="6" value="1"></label></div>
          <div><label>CON: <input type="number" class="stat-input" data-stat="con" min="0" max="6" value="3"></label></div>
          <div><label>CHA: <input type="number" class="stat-input" data-stat="cha" min="0" max="6" value="0"></label></div>
        </div>
        <div id="stats-check" style="margin-top: 0.5rem; font-weight: bold;">Checking...</div>
      </div>

      <div style="margin-top: 1rem;">
        <label><strong>Choose 2 Aptitudes</strong> (grant advantage = roll 2d20, take higher):</label>
        <select id="aptitude1" class="aptitude-select" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem;">
          <option value="">-- Choose First Aptitude --</option>
          <option value="melee">Melee Combat (advantage on melee attacks)</option>
          <option value="ranged">Ranged Combat (advantage on ranged attacks)</option>
          <option value="stealth">Stealth (advantage on sneaking, hiding)</option>
          <option value="perception">Perception (advantage on spotting, searching)</option>
          <option value="persuasion">Persuasion (advantage on social tests)</option>
          <option value="magic">Magic (advantage on spellcasting, arcane lore)</option>
          <option value="survival">Survival (advantage on tracking, nature)</option>
          <option value="athletics">Athletics (advantage on climbing, swimming, jumping)</option>
        </select>
        <select id="aptitude2" class="aptitude-select" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem;">
          <option value="">-- Choose Second Aptitude --</option>
          <option value="melee">Melee Combat (advantage on melee attacks)</option>
          <option value="ranged">Ranged Combat (advantage on ranged attacks)</option>
          <option value="stealth">Stealth (advantage on sneaking, hiding)</option>
          <option value="perception">Perception (advantage on spotting, searching)</option>
          <option value="persuasion">Persuasion (advantage on social tests)</option>
          <option value="magic">Magic (advantage on spellcasting, arcane lore)</option>
          <option value="survival">Survival (advantage on tracking, nature)</option>
          <option value="athletics">Athletics (advantage on climbing, swimming, jumping)</option>
        </select>
      </div>

      <div style="margin-top: 1rem;">
        <label><strong>Equipment Pack:</strong></label>
        <select id="equipment-pack" style="width: 100%; margin-top: 0.5rem; padding: 0.5rem;">
          <option value="combat">Combat Pack (medium armor +2 AC, weapon d8, shield +1 AC, torches)</option>
          <option value="scout">Scout Pack (light armor +1 AC, bow d6, dagger d6, rope, lantern)</option>
          <option value="caster">Caster Pack (staff d6, candles, spellbook, lantern)</option>
          <option value="specialist">Specialist Pack (light armor +1 AC, 2 daggers d6, lockpicks, rope)</option>
        </select>
      </div>

      <button id="start-adventure-btn" style="margin-top: 1rem; padding: 0.75rem 1.5rem; font-size: 1.1rem;">Start Adventure</button>
    </div>
  </div>

  <div id="game-section" style="display:none;">
    <div id="game-header">
      <div id="game-header-info">
        <span id="adventure-title"></span>
        <span id="character-status">HP: --/--</span>
      </div>
      <div id="game-header-actions">
        <button id="toggle-character-panel" title="Show/Hide Character Sheet">📋 Character</button>
        <button id="toggle-map-panel" title="Show/Hide Map">🗺️ Map</button>
        <button id="save-adventure-btn" title="Save Adventure to JSON">💾 Save</button>
        <button id="back-to-menu-btn">Menu</button>
      </div>
    </div>

    <div id="game-layout">
      <div id="character-panel" class="collapsed">
        <div id="character-panel-content"></div>
      </div>

      <div id="game-main">
        <div id="location-view">
          <h2 id="location-title"></h2>
          <div id="location-description"></div>
          <div id="location-loot"></div>
          <div id="location-choices"></div>
          <div id="combat-area" style="display:none;"></div>
        </div>
        <div id="log-area"></div>
      </div>

      <div id="map-panel" class="collapsed">
        <div id="map-panel-content">
          <h3>Adventure Map</h3>
          <div id="map-visualization"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<script src="../js/point-crawl.js"></script>
<link rel="stylesheet" href="../stylesheets/point-crawl.css">
