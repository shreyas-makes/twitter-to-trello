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
- **MutationObserver**: Monitors DOM changes and re-attaches event listeners when Twitter dynamically loads new content
- **Error Handling**: Comprehensive error handling for extension context invalidation scenarios

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
- **Selection System**: Tweets get overlay elements with selection indicators, numbered badges, and visual feedback animations. Uses Map-based storage with direct element references to maintain selection order and handle unlimited selections
- **Dynamic DOM Handling**: MutationObserver automatically reattaches event listeners when Twitter's SPA updates content

### Twitter/X DOM Handling

The extension works across Twitter's evolving DOM structure by:
- Testing multiple CSS selectors for tweet elements in priority order
- Detecting bookmarks page context for specialized selectors  
- Using capture-phase event handling to intercept clicks before Twitter's navigation handlers
- **Critical**: MutationObserver monitors for new tweet elements and reattaches selection handlers automatically

### Common Issues & Solutions

**Extension Context Invalidated**: When the extension is reloaded while running, `chrome.runtime` APIs fail. The extension now handles this gracefully with try/catch blocks and user-friendly error messages directing users to refresh the page.

**Event Listeners Lost**: Twitter's SPA dynamically replaces DOM elements, causing event listeners to detach. The MutationObserver system (`setupMutationObserver()`, `reattachEventListeners()`) automatically detects new content and reattaches handlers.

**Bookmarks Page Selection**: Uses specialized DOM selectors and prevents navigation with capture-phase event handling to ensure tweets can be selected instead of navigated to.

### Tweet Selection System Details

**Selection Storage**: Uses `Map<Element, SelectionInfo>` instead of indices to store direct references to tweet elements with selection order metadata. This prevents index misalignment when DOM changes and supports unlimited selections.

**Selection Numbering**: Each selected tweet displays its selection order (1st, 2nd, 3rd, etc.) rather than total count. Numbers are automatically renumbered when tweets are deselected to maintain sequential order.

**Export Prevention**: `isExporting` flag prevents multiple simultaneous export operations and shows "Exporting..." UI state during processing.

**Element Validation**: Before export, uses `document.contains()` to verify selected elements still exist in DOM, gracefully handling cases where Twitter has updated content.

### Trello Integration Flow

1. User configures API credentials via popup interface
2. Content script allows user to select tweets with visual feedback
3. Background script receives selected tweet data and formats for Trello
4. Cards created in user's specified Trello board/list with tweet content, metadata, and links

The extension requires Trello API key/token from https://trello.com/app-key and user must select target board and list during setup.