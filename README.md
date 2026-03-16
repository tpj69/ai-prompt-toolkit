# AI Prompt Toolkit — Chrome Extension


A curated library of 25+ advanced thinking prompts that inject directly into ChatGPT, Claude, Gemini, and Perplexity with one click.

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `ai-prompt-toolkit` folder
5. Pin the extension icon in your toolbar

## Features

- Browse 25+ prompts across 6 categories
- One-click inject into ChatGPT, Claude, Gemini, Perplexity
- Search by name, content, or tags
- Favorite prompts for quick access
- Add your own custom prompts
- Falls back to clipboard copy on unsupported sites
- Keyboard shortcut: `/` to search, `Escape` to clear

## File Structure

```
ai-prompt-toolkit/
├── manifest.json     # Manifest V3 config
├── popup.html/css/js # Extension popup UI
├── content.js        # Platform injector
├── background.js     # Service worker
├── prompts.json      # 25-prompt library
└── icons/            # Extension icons
```

## License

MIT
