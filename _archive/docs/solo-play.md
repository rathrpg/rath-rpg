# Solo Play

Play Rath RPG with an AI Game Master. Your world state is saved locally in your browser.

---

<div id="solo-play-app">
  <div id="setup-section">
    <h2>Setup</h2>

    <div class="setup-group">
      <label for="api-provider">AI Provider:</label>
      <select id="api-provider">
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="openai">OpenAI (GPT-4)</option>
      </select>
    </div>

    <div class="setup-group">
      <label for="api-key">API Key:</label>
      <input type="password" id="api-key" placeholder="Enter your API key">
      <button id="save-key-btn">Save Key</button>
    </div>

    <div id="key-status"></div>

    <hr>

    <h3>Character</h3>
    <div id="character-section">
      <div id="no-character">
        <p>No character loaded.</p>
        <button id="new-character-btn">Create New Character</button>
        <button id="import-character-btn">Import Character</button>
      </div>
      <div id="character-display" style="display:none;">
        <div id="character-info"></div>
        <button id="change-character-btn">Change Character</button>
      </div>
    </div>

    <hr>

    <h3>Game</h3>
    <div class="setup-group">
      <button id="new-game-btn">New Game</button>
      <button id="continue-game-btn" disabled>Continue Game</button>
      <button id="export-world-btn">Export World</button>
      <button id="import-world-btn">Import World</button>
    </div>
  </div>

  <div id="game-section" style="display:none;">
    <div id="game-header">
      <div id="game-header-info">
        <span id="current-location">Unknown Location</span>
        <span id="character-status">HP: --/--</span>
      </div>
      <div id="game-header-actions">
        <button id="toggle-character-panel" title="Show/Hide Character Sheet">📋 Character</button>
        <button id="toggle-journal-panel" title="Show/Hide Adventure Journal">📖 Journal</button>
        <button id="award-xp-btn" title="Award 1 XP for this session">+XP</button>
        <button id="level-up-btn" style="display:none;" title="Spend XP to level up">Level Up</button>
        <button id="back-to-setup-btn">Menu</button>
      </div>
    </div>

    <div id="game-layout">
      <div id="character-panel" class="collapsed">
        <div id="character-panel-content"></div>
      </div>

      <div id="game-main">
        <div id="chat-container">
          <div id="chat-messages"></div>
        </div>

        <div id="input-container">
          <textarea id="player-input" placeholder="What do you do?" rows="2"></textarea>
          <button id="send-btn">Send</button>
        </div>
      </div>

      <div id="journal-panel" class="collapsed">
        <div id="journal-panel-content">
          <div style="text-align:center;padding:2rem;color:#999;">
            <p>No journal entries yet.</p>
            <p style="font-size:0.875rem;margin-top:0.5rem;">Click "Update Journal" to generate a summary of your adventure.</p>
          </div>
        </div>
      </div>
    </div>

    <div id="world-panel" style="display:none;">
      <h4>World Notes</h4>
      <div id="world-notes"></div>
    </div>
  </div>
</div>

<div id="modal-overlay" style="display:none;">
  <div id="modal">
    <div id="modal-content"></div>
  </div>
</div>

