// Background script for Trello API integration
class TrelloAPI {
    constructor() {
      this.apiKey = null;
      this.apiToken = null;
      this.boardId = null;
      this.todoListId = null;
      this.initialized = false;
      this.initPromise = this.init();
    }
  
    async init() {
      // Load saved credentials
      const data = await chrome.storage.sync.get(['trelloApiKey', 'trelloToken', 'boardId', 'todoListId']);
      this.apiKey = data.trelloApiKey;
      this.apiToken = data.trelloToken;
      this.boardId = data.boardId;
      this.todoListId = data.todoListId;
      this.initialized = true;
    }

    async ensureInitialized() {
      if (!this.initialized) {
        await this.initPromise;
      }
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
        console.log(`Making Trello API call: ${method} ${endpoint}`, body ? { body } : '');
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Trello API error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log(`Trello API response for ${endpoint}:`, responseData);
        return responseData;
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

    async addAttachmentToCard(cardId, attachmentUrl, name = null) {
      const attachmentName = name || attachmentUrl.split('/').pop().split('?')[0];
      return await this.makeApiCall(`cards/${cardId}/attachments`, 'POST', {
        url: attachmentUrl,
        name: attachmentName
      });
    }

    async setCoverAttachment(cardId, attachmentId) {
      return await this.makeApiCall(`cards/${cardId}`, 'PUT', {
        idAttachmentCover: attachmentId
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
  
    async getExportedTweets() {
      const data = await chrome.storage.sync.get(['exportedTweets']);
      return new Set(data.exportedTweets || []);
    }

    async saveExportedTweet(tweetUrl) {
      const exportedTweets = await this.getExportedTweets();
      exportedTweets.add(tweetUrl);
      await chrome.storage.sync.set({ exportedTweets: Array.from(exportedTweets) });
    }

    async exportTweetsToTrello(tweets) {
      if (!this.isConfigured()) {
        throw new Error('Trello API not configured. Please set up your credentials first.');
      }
      
      console.log(`Starting Trello export for ${tweets.length} tweets...`);
      console.log('Using Trello config:', {
        boardId: this.boardId,
        listId: this.todoListId,
        hasApiKey: !!this.apiKey,
        hasToken: !!this.apiToken
      });
      
      // Check for already exported tweets
      const exportedTweets = await this.getExportedTweets();
      const tweetsToExport = [];
      const skippedTweets = [];
      
      for (const tweet of tweets) {
        if (tweet.url && exportedTweets.has(tweet.url)) {
          console.log(`Skipping already exported tweet: ${tweet.url}`);
          skippedTweets.push(tweet);
        } else {
          tweetsToExport.push(tweet);
        }
      }
      
      if (tweetsToExport.length === 0) {
        return {
          allSkipped: true,
          skippedCount: skippedTweets.length,
          message: 'All selected tweets have already been exported to Trello.'
        };
      }
      
      const results = [];
      
      for (let i = 0; i < tweetsToExport.length; i++) {
        const tweet = tweetsToExport[i];
        try {
          console.log(`Processing tweet ${i + 1}/${tweetsToExport.length}:`, tweet);
          
          const cardData = this.formatTweetForTrello(tweet);
          console.log('Formatted card data:', cardData);
          
          const card = await this.createCard(
            cardData.title,
            cardData.description,
            this.todoListId
          );
          
          console.log(`Successfully created card for tweet ${i + 1}:`, card);
          
          // Add image attachments if present
          if (tweet.images && tweet.images.length > 0) {
            try {
              console.log(`Adding ${tweet.images.length} image(s) to card...`);
              
              for (let j = 0; j < tweet.images.length; j++) {
                const imageUrl = tweet.images[j];
                console.log(`Attaching image ${j + 1}: ${imageUrl}`);
                
                const attachment = await this.addAttachmentToCard(
                  card.id, 
                  imageUrl, 
                  `Tweet Image ${j + 1}`
                );
                
                console.log(`Image ${j + 1} attached:`, attachment);
                
                // Set cover: skip profile images, use first non-profile image
                const isProfileImage = imageUrl.includes('profile_images');
                if (!isProfileImage && attachment.id) {
                  // Find if we already set a cover (to avoid overwriting)
                  const hasExistingCover = tweet.images.slice(0, j).some(url => !url.includes('profile_images'));
                  
                  if (!hasExistingCover) {
                    console.log(`Setting first non-profile image as card cover...`);
                    await this.setCoverAttachment(card.id, attachment.id);
                    console.log(`Card cover set successfully`);
                  }
                }
                
                // Small delay between attachments to avoid rate limiting
                if (j < tweet.images.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
            } catch (imageError) {
              console.error(`Error adding images to card:`, imageError);
              // Don't fail the entire operation if image attachment fails
            }
          }
          
          results.push({ success: true, card: card, tweet: tweet });
          
          // Track this tweet as exported
          if (tweet.url) {
            await this.saveExportedTweet(tweet.url);
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error creating card for tweet ${i + 1}:`, error);
          results.push({ success: false, error: error.message, tweet: tweet });
        }
      }
      
      console.log(`Trello export completed. Results:`, results);
      return {
        results: results,
        exportedCount: tweetsToExport.length,
        skippedCount: skippedTweets.length
      };
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
    
    if (request.action === 'getExportedTweets') {
      handleGetExportedTweets(sendResponse);
      return true;
    }
  });
  
  async function handleExportToTrello(tweets, sendResponse) {
    try {
      console.log(`Received export request for ${tweets.length} tweets:`, tweets);
      
      // Ensure API is fully initialized before checking configuration
      await trelloAPI.ensureInitialized();
      
      if (!trelloAPI.isConfigured()) {
        console.error('Trello API not configured');
        sendResponse({
          success: false,
          error: 'Please configure your Trello API credentials first.'
        });
        return;
      }
      
      console.log('Trello API is configured, starting export...');
      const exportResult = await trelloAPI.exportTweetsToTrello(tweets);
      console.log('Export results:', exportResult);
      
      // Handle case where all tweets were already exported
      if (exportResult.allSkipped) {
        sendResponse({
          success: false,
          error: exportResult.message
        });
        return;
      }
      
      const results = exportResult.results;
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error);
      const skippedCount = exportResult.skippedCount || 0;
      
      console.log(`Export summary: ${successCount} successful, ${errorCount} failed, ${skippedCount} skipped`);
      if (errors.length > 0) {
        console.error('Export errors:', errors);
      }
      
      let message = '';
      if (successCount > 0) {
        message += `Successfully exported ${successCount} tweet${successCount > 1 ? 's' : ''} to Trello!`;
      }
      if (skippedCount > 0) {
        if (message) message += ' ';
        message += `${skippedCount} tweet${skippedCount > 1 ? 's were' : ' was'} skipped (already exported).`;
      }
      
      if (errorCount === 0) {
        sendResponse({
          success: true,
          message: message
        });
      } else {
        sendResponse({
          success: false,
          error: `${message} However, ${errorCount} tweet${errorCount > 1 ? 's' : ''} failed. Errors: ${errors.join(', ')}`
        });
      }
      
    } catch (error) {
      console.error('Error in handleExportToTrello:', error);
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
      await trelloAPI.ensureInitialized();
      const boards = await trelloAPI.getBoards();
      sendResponse({ success: true, boards: boards });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  async function handleGetLists(boardId, sendResponse) {
    try {
      await trelloAPI.ensureInitialized();
      const lists = await trelloAPI.getLists(boardId);
      sendResponse({ success: true, lists: lists });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  async function handleGetExportedTweets(sendResponse) {
    try {
      await trelloAPI.ensureInitialized();
      const exportedTweets = await trelloAPI.getExportedTweets();
      sendResponse({ success: true, exportedTweets: Array.from(exportedTweets) });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }