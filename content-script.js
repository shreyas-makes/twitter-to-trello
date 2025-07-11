// Content script for Twitter pages
class TwitterTrelloExporter {
  constructor() {
    this.selectedTweets = new Set();
    this.isSelectionMode = false;
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
      
      tweet.addEventListener('click', (e) => {
        if (this.isSelectionMode) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleTweetSelection(tweet);
        }
      });
    });
  }

  getTweetElements() {
    // Target tweet containers - this selector may need adjustment based on Twitter's current DOM
    return document.querySelectorAll('article[data-testid="tweet"]');
  }

  toggleTweetSelection(tweetElement) {
    const index = tweetElement.dataset.tweetIndex;
    
    if (this.selectedTweets.has(index)) {
      this.selectedTweets.delete(index);
      tweetElement.classList.remove('twitter-trello-selected');
      // Remove selection number if it exists
      const selectionNumber = tweetElement.querySelector('.selection-number');
      if (selectionNumber) {
        selectionNumber.remove();
      }
    } else {
      this.selectedTweets.add(index);
      tweetElement.classList.add('twitter-trello-selected');
      
      // Add selection number badge
      const selectionNumber = document.createElement('div');
      selectionNumber.className = 'selection-number';
      selectionNumber.textContent = this.selectedTweets.size;
      tweetElement.appendChild(selectionNumber);
    }
    
    this.updateSelectionCounter();
    
    // Add a subtle animation to show the action was registered
    tweetElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
      tweetElement.style.transform = '';
    }, 150);
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
    const overlay = document.createElement('div');
    overlay.id = 'twitter-trello-selection-overlay';
    overlay.innerHTML = `
      <div class="selection-info">
        <div class="selection-status">
          <div id="selection-counter">0 tweets selected</div>
          <div class="selection-subtitle">Click tweets to add them to your export list</div>
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
      tweet.removeEventListener('click', this.toggleTweetSelection);
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