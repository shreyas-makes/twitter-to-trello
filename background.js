// Background script for Trello API integration
class TrelloAPI {
    constructor() {
      this.apiKey = null;
      this.apiToken = null;
      this.boardId = null;
      this.todoListId = null;
      this.init();
    }
  
    async init() {
      // Load saved credentials
      const data = await chrome.storage.sync.get(['trelloApiKey', 'trelloToken', 'boardId', 'todoListId']);
      this.apiKey = data.trelloApiKey;
      this.apiToken = data.trelloToken;
      this.boardId = data.boardId;
      this.todoListId = data.todoListId;
    }
  
    async saveCredentials(apiKey, token, boardId, todoListId) {
      await chrome.storage.sync.set({
        trelloApiKey: apiKey,
        trelloToken: token,
        boardId: boardId,
        todoListId: todoListId
      });
      
      this.apiKey = apiKey;
      this.apiToken = token;
      this.boardId = boardId;
      this.todoListId = todoListId;
    }
  
    isConfigured() {
      return this.apiKey && this.apiToken && this.boardId && this.todoListId;
    }
  
    async makeApiCall(endpoint, method = 'GET', body = null) {
      const url = `https://api.trello.com/1/${endpoint}?key=${this.apiKey}&token=${this.apiToken}`;
      
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Trello API error:', error);
        throw error;
      }
    }
  
    async getBoards() {
      return await this.makeApiCall('members/me/boards');
    }
  
    async getLists(boardId) {
      return await this.makeApiCall(`boards/${boardId}/lists`);
    }
  
    async createCard(name, desc, listId) {
      return await this.makeApiCall('cards', 'POST', {
        name: name,
        desc: desc,
        idList: listId
      });
    }
  
    formatTweetForTrello(tweet) {
      const title = tweet.text.length > 100 
        ? tweet.text.substring(0, 97) + '...'
        : tweet.text;
      
      let description = `**Tweet by ${tweet.author}**\n\n`;
      description += `${tweet.text}\n\n`;
      
      if (tweet.url) {
        description += `**Original Tweet:** ${tweet.url}\n\n`;
      }
      
      if (tweet.timestamp) {
        description += `**Posted:** ${new Date(tweet.timestamp).toLocaleString()}\n\n`;
      }
      
      if (tweet.images && tweet.images.length > 0) {
        description += `**Media:**\n`;
        tweet.images.forEach(img => {
          description += `- ${img}\n`;
        });
      }
      
      description += `\n*Added via Twitter to Trello Extension*`;
      
      return {
        title: title,
        description: description
      };
    }
  
    async exportTweetsToTrello(tweets) {
      if (!this.isConfigured()) {
        throw new Error('Trello API not configured. Please set up your credentials first.');
      }
      
      const results = [];
      
      for (const tweet of tweets) {
        try {
          const cardData = this.formatTweetForTrello(tweet);
          const card = await this.createCard(
            cardData.title,
            cardData.description,
            this.todoListId
          );
          
          results.push({ success: true, card: card });
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('Error creating card for tweet:', error);
          results.push({ success: false, error: error.message });
        }
      }
      
      return results;
    }
  }
  
  // Initialize Trello API handler
  const trelloAPI = new TrelloAPI();
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'exportToTrello') {
      handleExportToTrello(request.tweets, sendResponse);
      return true; // Keep message channel open for async response
    }
    
    if (request.action === 'configureApi') {
      handleApiConfiguration(request.config, sendResponse);
      return true;
    }
    
    if (request.action === 'getBoards') {
      handleGetBoards(sendResponse);
      return true;
    }
    
    if (request.action === 'getLists') {
      handleGetLists(request.boardId, sendResponse);
      return true;
    }
  });
  
  async function handleExportToTrello(tweets, sendResponse) {
    try {
      if (!trelloAPI.isConfigured()) {
        sendResponse({
          success: false,
          error: 'Please configure your Trello API credentials first.'
        });
        return;
      }
      
      const results = await trelloAPI.exportTweetsToTrello(tweets);
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        sendResponse({
          success: true,
          message: `Successfully exported ${successCount} tweets to Trello!`
        });
      } else {
        sendResponse({
          success: false,
          error: `Exported ${successCount} tweets, but ${errorCount} failed.`
        });
      }
      
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  async function handleApiConfiguration(config, sendResponse) {
    try {
      await trelloAPI.saveCredentials(
        config.apiKey,
        config.token,
        config.boardId,
        config.todoListId
      );
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  async function handleGetBoards(sendResponse) {
    try {
      const boards = await trelloAPI.getBoards();
      sendResponse({ success: true, boards: boards });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  async function handleGetLists(boardId, sendResponse) {
    try {
      const lists = await trelloAPI.getLists(boardId);
      sendResponse({ success: true, lists: lists });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }