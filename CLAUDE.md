# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This Chrome extension has no build process - it loads files directly. To test changes:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory
4. After making changes, click the refresh icon on the extension card

## Architecture Overview

This is a Chrome Manifest V3 extension that allows users to manually select and export Twitter/X tweets (including bookmarks) to Trello cards.

### Core Components

**content-script.js** - Main user interface logic
- `TwitterTrelloExporter` class handles tweet selection on Twitter/X pages
- Creates floating button and manages selection mode with visual overlays
- Uses capture-phase event listeners to prevent navigation during selection
- Supports both regular Twitter feeds and bookmarks page with different DOM selectors
- Manages selection state with visual indicators and animations

**background.js** - API integration and data processing  
- `TrelloAPI` class handles all Trello API communication
- Stores credentials in Chrome sync storage
- Formats tweet data into Trello card format with markdown descriptions
- Processes export requests from content script via message passing

**popup.js** - Configuration interface
- `TrelloConfigPopup` class manages setup workflow in extension popup
- Guides user through API key/token setup and board/list selection
- Tests API connections and validates credentials
- Saves configuration to Chrome sync storage

### Key Architecture Patterns

- **Message Passing**: Content script communicates with background script via `chrome.runtime.sendMessage()` for Trello exports
- **Storage**: All configuration persisted in `chrome.storage.sync` with keys: `trelloApiKey`, `trelloToken`, `boardId`, `todoListId`
- **Event Management**: Content script uses Map to track event listeners for proper cleanup and memory management
- **Selection System**: Tweets get overlay elements with selection indicators, numbered badges, and visual feedback animations

### Twitter/X DOM Handling

The extension works across Twitter's evolving DOM structure by:
- Testing multiple CSS selectors for tweet elements in priority order
- Detecting bookmarks page context for specialized selectors
- Using capture-phase event handling to intercept clicks before Twitter's navigation handlers

### Trello Integration Flow

1. User configures API credentials via popup interface
2. Content script allows user to select tweets with visual feedback
3. Background script receives selected tweet data and formats for Trello
4. Cards created in user's specified Trello board/list with tweet content, metadata, and links

The extension requires Trello API key/token from https://trello.com/app-key and user must select target board and list during setup.