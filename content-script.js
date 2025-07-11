// Content script for Twitter pages
class TwitterTrelloExporter {
  constructor() {
    this.selectedTweets = new Set();
    this.isSelectionMode = false;
    this.tweetEventListeners = new Map();
    this.init();
  }

  init() {
    this.createFloatingButton();
    this.setupEventListeners();
  }

  createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'twitter-trello-export-btn';
    button.innerHTML = '📋 Export to Trello';
    button.className = 'twitter-trello-floating-btn';
    
    button.addEventListener('click', () => {
      this.toggleSelectionMode();
    });

    document.body.appendChild(button);
  }

  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    
    if (this.isSelectionMode) {
      this.enterSelectionMode();
    } else {
      this.exitSelectionMode();
    }
  }

  enterSelectionMode() {
    document.body.classList.add('twitter-trello-selection-mode');
    this.highlightTweets();
    this.showSelectionOverlay();
    
    // Update button text
    const button = document.getElementById('twitter-trello-export-btn');
    button.innerHTML = '✕ Cancel Selection';
    button.style.backgroundColor = '#ff4444';
  }

  exitSelectionMode() {
    document.body.classList.remove('twitter-trello-selection-mode');
    this.removeHighlights();
    this.hideSelectionOverlay();
    this.selectedTweets.clear();
    
    // Reset button
    const button = document.getElementById('twitter-trello-export-btn');
    button.innerHTML = '📋 Export to Trello';
    button.style.backgroundColor = '#1da1f2';
  }

  highlightTweets() {
    const tweets = this.getTweetElements();
    
    tweets.forEach((tweet, index) => {
      tweet.classList.add('twitter-trello-selectable');
      tweet.dataset.tweetIndex = index;
      
      const clickHandler = (e) => {
        if (this.isSelectionMode) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.toggleTweetSelection(tweet);
        }
      };
      
      // Use capture phase to intercept clicks before other handlers
      tweet.addEventListener('click', clickHandler, { capture: true });
      
      // Also add to all interactive elements within the tweet
      const interactiveElements = tweet.querySelectorAll('a, button, [role="button"], [role="link"]');
      interactiveElements.forEach(element => {
        element.addEventListener('click', clickHandler, { capture: true });
      });
      
      this.tweetEventListeners.set(tweet, clickHandler);
      
      // Add visual selection overlay
      this.addSelectionOverlay(tweet);
    });
  }

  getTweetElements() {
    // Check if we're on bookmarks page and use appropriate selectors
    const isBookmarksPage = window.location.href.includes('/bookmarks');
    
    const selectors = [
      'article[data-testid="tweet"]',
      'div[data-testid="tweet"]', 
      'article[role="article"]',
      'div[data-testid="cellInnerDiv"] article',
      // Bookmarks page specific selectors
      ...(isBookmarksPage ? [
        'div[data-testid="cellInnerDiv"] div[data-testid="tweet"]',
        '[data-testid="bookmark"] article',
        'div[data-testid="primaryColumn"] article'
      ] : [])
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`TwitterTrelloExporter: Found ${elements.length} tweets using selector: ${selector}`);
        return elements;
      }
    }
    
    console.warn('TwitterTrelloExporter: No tweet elements found with known selectors');
    return [];
  }

  addSelectionOverlay(tweetElement) {
    // Create selection overlay for better visual feedback
    const overlay = document.createElement('div');
    overlay.className = 'tweet-selection-overlay';
    overlay.innerHTML = `
      <div class="selection-indicator">
        <div class="selection-icon">✓</div>
        <div class="selection-text">Click to select</div>
      </div>
    `;
    tweetElement.style.position = 'relative';
    tweetElement.appendChild(overlay);
  }
  
  toggleTweetSelection(tweetElement) {
    const index = tweetElement.dataset.tweetIndex;
    const overlay = tweetElement.querySelector('.tweet-selection-overlay');
    
    if (this.selectedTweets.has(index)) {
      this.selectedTweets.delete(index);
      tweetElement.classList.remove('twitter-trello-selected');
      
      // Update overlay to unselected state
      if (overlay) {
        const indicator = overlay.querySelector('.selection-indicator');
        const icon = overlay.querySelector('.selection-icon');
        const text = overlay.querySelector('.selection-text');
        
        indicator.classList.remove('selected');
        icon.textContent = '+';
        text.textContent = 'Click to select';
      }
      
      // Remove selection number if it exists
      const selectionNumber = tweetElement.querySelector('.selection-number');
      if (selectionNumber) {
        selectionNumber.remove();
      }
    } else {
      this.selectedTweets.add(index);
      tweetElement.classList.add('twitter-trello-selected');
      
      // Update overlay to selected state
      if (overlay) {
        const indicator = overlay.querySelector('.selection-indicator');
        const icon = overlay.querySelector('.selection-icon');
        const text = overlay.querySelector('.selection-text');
        
        indicator.classList.add('selected');
        icon.textContent = '✓';
        text.textContent = 'Selected';
      }
      
      // Add selection number badge
      const selectionNumber = document.createElement('div');
      selectionNumber.className = 'selection-number';
      selectionNumber.textContent = this.selectedTweets.size;
      tweetElement.appendChild(selectionNumber);
    }
    
    this.updateSelectionCounter();
    
    // Add selection animation
    tweetElement.classList.add('selection-animation');
    setTimeout(() => {
      tweetElement.classList.remove('selection-animation');
    }, 300);
  }

  extractTweetData(tweetElement) {
    try {
      // Extract tweet information from DOM
      const tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent || '';
      const authorName = tweetElement.querySelector('[data-testid="User-Name"]')?.textContent || '';
      const tweetTime = tweetElement.querySelector('time')?.getAttribute('datetime') || '';
      
      // Get tweet URL
      const timeLink = tweetElement.querySelector('time')?.closest('a');
      const tweetUrl = timeLink ? `https://twitter.com${timeLink.getAttribute('href')}` : '';
      
      // Get any media
      const images = Array.from(tweetElement.querySelectorAll('img[src*="media"]')).map(img => img.src);
      
      return {
        text: tweetText,
        author: authorName,
        timestamp: tweetTime,
        url: tweetUrl,
        images: images
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  showSelectionOverlay() {
    const isBookmarksPage = window.location.href.includes('/bookmarks');
    const pageContext = isBookmarksPage ? 'bookmarks' : 'tweets';
    
    const overlay = document.createElement('div');
    overlay.id = 'twitter-trello-selection-overlay';
    overlay.innerHTML = `
      <div class="selection-info">
        <div class="selection-status">
          <div id="selection-counter">0 ${pageContext} selected</div>
          <div class="selection-subtitle">Click ${pageContext} to add them to your Trello export list</div>
        </div>
      </div>
      <div class="selection-actions">
        <button class="cancel-selection-btn" id="cancel-selection-btn">Cancel</button>
        <button id="export-selected-btn" disabled>Export to Trello</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('export-selected-btn').addEventListener('click', () => {
      this.exportSelectedTweets();
    });
    
    document.getElementById('cancel-selection-btn').addEventListener('click', () => {
      this.exitSelectionMode();
    });
  }

  hideSelectionOverlay() {
    const overlay = document.getElementById('twitter-trello-selection-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  updateSelectionCounter() {
    const counter = document.getElementById('selection-counter');
    const exportBtn = document.getElementById('export-selected-btn');
    
    if (counter) {
      const count = this.selectedTweets.size;
      if (count === 0) {
        counter.textContent = 'No tweets selected';
      } else if (count === 1) {
        counter.textContent = '1 tweet selected';
      } else {
        counter.textContent = `${count} tweets selected`;
      }
    }
    
    if (exportBtn) {
      exportBtn.disabled = this.selectedTweets.size === 0;
      if (this.selectedTweets.size > 0) {
        exportBtn.textContent = `Export ${this.selectedTweets.size} Tweet${this.selectedTweets.size > 1 ? 's' : ''} to Trello`;
      } else {
        exportBtn.textContent = 'Export to Trello';
      }
    }
  }

  removeHighlights() {
    document.querySelectorAll('.twitter-trello-selectable').forEach(tweet => {
      tweet.classList.remove('twitter-trello-selectable', 'twitter-trello-selected');
      
      // Remove stored event listener
      const handler = this.tweetEventListeners.get(tweet);
      if (handler) {
        tweet.removeEventListener('click', handler, { capture: true });
        
        // Remove from interactive elements too
        const interactiveElements = tweet.querySelectorAll('a, button, [role="button"], [role="link"]');
        interactiveElements.forEach(element => {
          element.removeEventListener('click', handler, { capture: true });
        });
        
        this.tweetEventListeners.delete(tweet);
      }
      
      // Remove selection overlays and numbers
      const selectionOverlay = tweet.querySelector('.tweet-selection-overlay');
      if (selectionOverlay) {
        selectionOverlay.remove();
      }
      
      const selectionNumber = tweet.querySelector('.selection-number');
      if (selectionNumber) {
        selectionNumber.remove();
      }
    });
  }

  async exportSelectedTweets() {
    const tweets = [];
    const tweetElements = this.getTweetElements();
    
    // Extract data from selected tweets
    this.selectedTweets.forEach(index => {
      const tweetElement = tweetElements[index];
      const tweetData = this.extractTweetData(tweetElement);
      if (tweetData) {
        tweets.push(tweetData);
      }
    });
    
    if (tweets.length === 0) {
      alert('No tweets selected or unable to extract tweet data.');
      return;
    }
    
    // Send to background script for Trello API call
    chrome.runtime.sendMessage({
      action: 'exportToTrello',
      tweets: tweets
    }, (response) => {
      if (response.success) {
        alert(`Successfully exported ${tweets.length} tweets to Trello!`);
        this.exitSelectionMode();
      } else {
        alert(`Error exporting tweets: ${response.error}`);
      }
    });
  }

  setupEventListeners() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'startSelection') {
        this.toggleSelectionMode();
        sendResponse({success: true});
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TwitterTrelloExporter();
  });
} else {
  new TwitterTrelloExporter();
}