/* ============================================
   AI Prompt Toolkit — Content Script
   Handles injecting prompts into AI chat inputs
   ============================================ */

const PLATFORM_SELECTORS = {
  chatgpt: [
    '#prompt-textarea',
    'div[contenteditable="true"][id="prompt-textarea"]',
    'textarea[data-id="root"]',
    'div.ProseMirror[contenteditable="true"]'
  ],
  claude: [
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"][translate="no"]',
    'fieldset div[contenteditable="true"]'
  ],
  gemini: [
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"].textarea',
    'rich-textarea div[contenteditable="true"]',
    '.input-area div[contenteditable="true"]'
  ],
  perplexity: [
    'textarea[placeholder]',
    'textarea.grow',
    'div[contenteditable="true"]'
  ]
};

function detectPlatform() {
  const url = window.location.href;
  if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'chatgpt';
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('gemini.google.com')) return 'gemini';
  if (url.includes('perplexity.ai')) return 'perplexity';
  return null;
}

function findInputElement(platform) {
  const selectors = PLATFORM_SELECTORS[platform] || [];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return document.querySelector('div[contenteditable="true"]') ||
         document.querySelector('textarea');
}

function injectIntoContentEditable(el, text) {
  el.focus();
  el.innerHTML = '';
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (i > 0) el.appendChild(document.createElement('br'));
    if (line.length > 0) el.appendChild(document.createTextNode(line));
  });
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function injectIntoTextarea(el, text) {
  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype, 'value'
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(el, text);
  } else {
    el.value = text;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text
  }));
}

function injectPrompt(text, platform) {
  const el = findInputElement(platform);
  if (!el) return { success: false, error: 'Input element not found' };

  try {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      injectIntoTextarea(el, text);
    } else if (el.contentEditable === 'true') {
      injectIntoContentEditable(el, text);
    } else {
      return { success: false, error: 'Unknown input type' };
    }

    el.style.transition = 'box-shadow 300ms ease';
    el.style.boxShadow = '0 0 0 2px rgba(255, 107, 53, 0.5)';
    setTimeout(() => { el.style.boxShadow = ''; }, 600);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'INJECT_PROMPT') {
    const platform = msg.platform || detectPlatform();
    const result = injectPrompt(msg.prompt, platform);
    sendResponse(result);
  }
  if (msg.type === 'DETECT_PLATFORM') {
    sendResponse({ platform: detectPlatform() });
  }
  return true;
});

console.log('[AI Prompt Toolkit] Content script loaded on', detectPlatform());
