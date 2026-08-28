# Point Crawl Adventures

<div id="point-crawl-app">
  <div id="setup-section">
    <h2>Point Crawl Mode</h2>
    <p>Generate complete adventures upfront. Navigate pre-built locations with choices, skill checks, and combat.</p>
    
    <div class="setup-group">
      <label>Anthropic API Key:</label>
      <input type="password" id="api-key-input" placeholder="sk-ant-...">
      <button id="test-key-btn">Test Key</button>
      <div id="key-status"></div>
      <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
        Don't have one? <a href="https://console.anthropic.com/settings/keys" target="_blank">Get an Anthropic API key</a> (Claude Sonnet/Haiku)
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
      <h3>Create Character</h3>
      <label>Name:</label>
      <input type="text" id="char-name" placeholder="Character name">
      
      <div style="margin-top: 1rem;">
        <label>Assign stat array (3, 2, 2, 1, 1, 0) to your six stats:</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-width: 400px;">
          <div><label>STR: <select class="stat-select" data-stat="str"></select></label></div>
          <div><label>DEX: <select class="stat-select" data-stat="dex"></select></label></div>
          <div><label>INT: <select class="stat-select" data-stat="int"></select></label></div>
          <div><label>WIS: <select class="stat-select" data-stat="wis"></select></label></div>
          <div><label>CON: <select class="stat-select" data-stat="con"></select></label></div>
          <div><label>CHA: <select class="stat-select" data-stat="cha"></select></label></div>
        </div>
        <div id="stat-array-status"></div>
      </div>

      <button id="start-adventure-btn">Start Adventure</button>
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
