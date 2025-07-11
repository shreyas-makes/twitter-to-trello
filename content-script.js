// Content script for Twitter pages
class TwitterTrelloExporter {
  constructor() {
    this.selectedTweets = new Set();
    this.isSelectionMode = false;
    this.tweetEventListeners = new Map();
    this.mutationObserver = null;
    this.init();
  }

  init() {
    this.createFloatingButton();
    this.setupEventListeners();
    this.setupMutationObserver();
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
    this.startObservingChanges();
    
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
    this.stopObservingChanges();
    
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
        <button id="export-selected-btn" disabled>Export to Trello</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('export-selected-btn').addEventListener('click', () => {
      this.exportSelectedTweets();
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
    try {
      chrome.runtime.sendMessage({
        action: 'exportToTrello',
        tweets: tweets
      }, (response) => {
        // Check if the extension context is still valid
        if (chrome.runtime.lastError) {
          console.error('Extension context error:', chrome.runtime.lastError.message);
          alert('Extension was reloaded. Please refresh this page and try again.');
          return;
        }
        
        if (response && response.success) {
          alert(`Successfully exported ${tweets.length} tweets to Trello!`);
          this.exitSelectionMode();
        } else {
          alert(`Error exporting tweets: ${response ? response.error : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error('Failed to send message to background script:', error);
      alert('Extension connection failed. Please refresh this page and try again.');
    }
  }

  setupEventListeners() {
    // Listen for messages from popup/background
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          if (request.action === 'startSelection') {
            this.toggleSelectionMode();
            sendResponse({success: true});
          }
        } catch (error) {
          console.error('Error handling runtime message:', error);
          sendResponse({success: false, error: error.message});
        }
      });
    } catch (error) {
      console.error('Failed to setup runtime message listener:', error);
    }
  }

  setupMutationObserver() {
    // Create observer to watch for DOM changes
    this.mutationObserver = new MutationObserver((mutations) => {
      if (!this.isSelectionMode) return;
      
      let shouldReattach = false;
      
      mutations.forEach((mutation) => {
        // Check if new nodes were added that might be tweets
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this could be a tweet or contain tweets
              if (node.matches && (
                node.matches('article[data-testid="tweet"]') ||
                node.matches('div[data-testid="tweet"]') ||
                node.matches('article[role="article"]') ||
                node.querySelector('article[data-testid="tweet"]') ||
                node.querySelector('div[data-testid="tweet"]')
              )) {
                shouldReattach = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldReattach) {
        console.log('TwitterTrelloExporter: DOM changed, re-attaching event listeners');
        // Small delay to ensure DOM is fully updated
        setTimeout(() => {
          this.reattachEventListeners();
        }, 100);
      }
    });
  }

  startObservingChanges() {
    if (this.mutationObserver) {
      // Observe the main content area where tweets are loaded
      const mainContent = document.querySelector('main') || 
                         document.querySelector('[data-testid="primaryColumn"]') || 
                         document.body;
      
      this.mutationObserver.observe(mainContent, {
        childList: true,
        subtree: true
      });
    }
  }

  stopObservingChanges() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  reattachEventListeners() {
    if (!this.isSelectionMode) return;
    
    // Get current tweets
    const tweets = this.getTweetElements();
    
    tweets.forEach((tweet, index) => {
      // Skip if already has event listener
      if (this.tweetEventListeners.has(tweet)) {
        return;
      }
      
      // Add selection classes and event listeners
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
      
      // Add visual selection overlay if not present
      if (!tweet.querySelector('.tweet-selection-overlay')) {
        this.addSelectionOverlay(tweet);
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