/* ============================================
   AI Prompt Toolkit — Popup Logic
   ============================================ */

const CATEGORY_NAMES = {
  thinking_frameworks: 'Thinking',
  critique_analysis: 'Critique',
  research_learning: 'Research',
  strategy_planning: 'Strategy',
  claude_optimized: 'Claude',
  advanced_patterns: 'Advanced'
};

let allPrompts = [];
let favorites = new Set();
let customPrompts = [];
let activeCategory = 'all';
let showFavsOnly = false;
let searchQuery = '';
let detectedPlatform = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadPromptLibrary();
  await loadFavorites();
  await loadCustomPrompts();
  detectPlatform();
  bindEvents();
  renderPrompts();
});

// ---- Data Loading ----
async function loadPromptLibrary() {
  try {
    const res = await fetch(chrome.runtime.getURL('prompts.json'));
    allPrompts = await res.json();
  } catch (e) {
    console.error('Failed to load prompts:', e);
    allPrompts = [];
  }
}

async function loadFavorites() {
  try {
    const data = await chrome.storage.local.get('favorites');
    favorites = new Set(data.favorites || []);
  } catch (e) {
    favorites = new Set();
  }
}

async function saveFavorites() {
  await chrome.storage.local.set({ favorites: [...favorites] });
}

async function loadCustomPrompts() {
  try {
    const data = await chrome.storage.local.get('customPrompts');
    customPrompts = data.customPrompts || [];
  } catch (e) {
    customPrompts = [];
  }
}

async function saveCustomPrompts() {
  await chrome.storage.local.set({ customPrompts });
}

// ---- Platform Detection ----
function detectPlatform() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const url = tabs[0].url || '';
    const bar = document.getElementById('platform-bar');
    const name = document.getElementById('platform-name');

    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
      detectedPlatform = 'chatgpt';
      name.textContent = 'ChatGPT — ready to inject';
      bar.classList.add('connected');
    } else if (url.includes('claude.ai')) {
      detectedPlatform = 'claude';
      name.textContent = 'Claude — ready to inject';
      bar.classList.add('connected');
    } else if (url.includes('gemini.google.com')) {
      detectedPlatform = 'gemini';
      name.textContent = 'Gemini — ready to inject';
      bar.classList.add('connected');
    } else if (url.includes('perplexity.ai')) {
      detectedPlatform = 'perplexity';
      name.textContent = 'Perplexity — ready to inject';
      bar.classList.add('connected');
    } else {
      detectedPlatform = null;
      name.textContent = 'No AI platform detected — copy mode';
    }
  });
}

// ---- Event Binding ----
function bindEvents() {
  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderPrompts();
  });

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchQuery = '';
      searchInput.blur();
      renderPrompts();
    }
  });

  // Category tabs
  document.getElementById('category-tabs').addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab')) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.cat;
    renderPrompts();
  });

  // Favorites toggle
  document.getElementById('btn-toggle-favs').addEventListener('click', (e) => {
    showFavsOnly = !showFavsOnly;
    e.currentTarget.classList.toggle('active', showFavsOnly);
    renderPrompts();
  });

  // Add custom prompt
  document.getElementById('btn-add-custom').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('hidden');
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('modal-save').addEventListener('click', async () => {
    const name = document.getElementById('custom-name').value.trim();
    const category = document.getElementById('custom-category').value;
    const prompt = document.getElementById('custom-prompt').value.trim();

    if (!name || !prompt) return;

    const newPrompt = {
      id: 'custom-' + Date.now(),
      category,
      name,
      prompt,
      tags: ['custom']
    };

    customPrompts.push(newPrompt);
    await saveCustomPrompts();
    closeModal();
    renderPrompts();
    showToast('Custom prompt saved!');
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('custom-name').value = '';
  document.getElementById('custom-prompt').value = '';
}

// ---- Filtering ----
function getFilteredPrompts() {
  const combined = [...allPrompts, ...customPrompts];
  return combined.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (showFavsOnly && !favorites.has(p.id)) return false;
    if (searchQuery) {
      const haystack = (p.name + ' ' + p.prompt + ' ' + (p.tags || []).join(' ')).toLowerCase();
      return haystack.includes(searchQuery);
    }
    return true;
  });
}

// ---- Rendering ----
function renderPrompts() {
  const list = document.getElementById('prompt-list');
  const empty = document.getElementById('empty-state');
  const filtered = getFilteredPrompts();

  if (filtered.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  list.innerHTML = filtered.map((p, i) => `
    <div class="prompt-card" data-id="${p.id}" style="animation-delay: ${i * 30}ms">
      <div class="prompt-card-top">
        <span class="prompt-card-name">${escapeHtml(p.name)}</span>
        <div class="prompt-card-actions">
          <button class="card-btn fav-btn ${favorites.has(p.id) ? 'fav-active' : ''}" data-id="${p.id}" title="Favorite">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="${favorites.has(p.id) ? 'currentColor' : 'none'}">
              <path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.4l-3.7 1.8.7-4.1-3-2.9 4.2-.6L8 2z" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </button>
          <button class="card-btn copy-btn" data-id="${p.id}" title="Copy to clipboard">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M3 11V3.5A.5.5 0 0 1 3.5 3H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="card-btn inject-btn" data-id="${p.id}" title="${detectedPlatform ? 'Inject into ' + detectedPlatform : 'Copy to clipboard'}">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h7M7 5l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3v10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="prompt-card-preview">${escapeHtml(p.prompt)}</div>
      <div class="prompt-card-footer">
        <span class="category-label cat-${p.category}">${CATEGORY_NAMES[p.category] || p.category}</span>
        ${(p.tags || []).slice(0, 2).map(t => `<span class="prompt-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  // Bind card actions
  list.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });

  list.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyPrompt(btn.dataset.id);
    });
  });

  list.querySelectorAll('.inject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      injectPrompt(btn.dataset.id);
    });
  });

  // Click card to expand/inject
  list.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      injectPrompt(card.dataset.id);
    });
  });
}

// ---- Actions ----
function toggleFavorite(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  saveFavorites();
  renderPrompts();
}

function findPrompt(id) {
  return [...allPrompts, ...customPrompts].find(p => p.id === id);
}

function copyPrompt(id) {
  const p = findPrompt(id);
  if (!p) return;
  navigator.clipboard.writeText(p.prompt).then(() => {
    showToast('Copied to clipboard!');
  });
}

function injectPrompt(id) {
  const p = findPrompt(id);
  if (!p) return;

  if (!detectedPlatform) {
    copyPrompt(id);
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'INJECT_PROMPT',
      prompt: p.prompt,
      platform: detectedPlatform
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded — fallback to copy
        copyPrompt(id);
        return;
      }
      if (response && response.success) {
        showToast('Injected into ' + detectedPlatform + '!');
      } else {
        copyPrompt(id);
      }
    });
  });
}

// ---- Toast ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  msgEl.textContent = msg;
  toast.classList.remove('hidden', 'fade-out');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.classList.add('hidden'), 200);
  }, 1800);
}

// ---- Util ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
