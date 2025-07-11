// Popup script for Trello configuration
class TrelloConfigPopup {
    constructor() {
      this.apiKey = '';
      this.token = '';
      this.boardId = '';
      this.listId = '';
      this.init();
    }
  
    async init() {
      await this.loadSavedConfig();
      this.updateUI();
      this.setupEventListeners();
    }
  
    async loadSavedConfig() {
      const data = await chrome.storage.sync.get(['trelloApiKey', 'trelloToken', 'boardId', 'todoListId']);
      this.apiKey = data.trelloApiKey || '';
      this.token = data.trelloToken || '';
      this.boardId = data.boardId || '';
      this.listId = data.todoListId || '';
    }
  
    updateUI() {
      const isConfigured = this.apiKey && this.token && this.boardId && this.listId;
      
      // Update status
      const statusEl = document.getElementById('status');
      if (isConfigured) {
        statusEl.className = 'status configured';
        statusEl.textContent = '✓ Configured and Ready';
        document.getElementById('setupForm').classList.add('hidden');
        document.getElementById('configuredView').classList.remove('hidden');
      } else {
        statusEl.className = 'status not-configured';
        statusEl.textContent = '⚠ Setup Required';
        document.getElementById('setupForm').classList.remove('hidden');
        document.getElementById('configuredView').classList.add('hidden');
      }
      
      // Fill form fields
      document.getElementById('apiKey').value = this.apiKey;
      document.getElementById('token').value = this.token;
    }
  
    setupEventListeners() {
      document.getElementById('loadBoards').addEventListener('click', () => this.loadBoards());
      document.getElementById('boardSelect').addEventListener('change', () => this.onBoardChange());
      document.getElementById('saveConfig').addEventListener('click', () => this.saveConfiguration());
      document.getElementById('reconfigure').addEventListener('click', () => this.reconfigure());
      document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
    }
  
    async loadBoards() {
      const apiKey = document.getElementById('apiKey').value.trim();
      const token = document.getElementById('token').value.trim();
      
      if (!apiKey || !token) {
        this.showMessage('Please enter both API Key and Token first.', 'error');
        return;
      }
      
      this.showMessage('Loading boards...', 'loading');
      
      try {
        // Test the credentials by making a direct API call
        const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const boards = await response.json();
        this.populateBoardSelect(boards);
        this.apiKey = apiKey;
        this.token = token;
        
        document.getElementById('boardGroup').classList.remove('hidden');
        this.showMessage('Boards loaded successfully!', 'success');
        
      } catch (error) {
        this.showMessage(`Error loading boards: ${error.message}`, 'error');
      }
    }
  
    populateBoardSelect(boards) {
      const select = document.getElementById('boardSelect');
      select.innerHTML = '<option value="">Choose a board...</option>';
      
      boards.forEach(board => {
        const option = document.createElement('option');
        option.value = board.id;
        option.textContent = board.name;
        select.appendChild(option);
      });
    }
  
    async onBoardChange() {
      const boardId = document.getElementById('boardSelect').value;
      
      if (!boardId) {
        document.getElementById('listGroup').classList.add('hidden');
        return;
      }
      
      this.showMessage('Loading lists...', 'loading');
      
      try {
        const response = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${this.apiKey}&token=${this.token}`);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const lists = await response.json();
        this.populateListSelect(lists);
        this.boardId = boardId;
        
        document.getElementById('listGroup').classList.remove('hidden');
        document.getElementById('saveConfig').classList.remove('hidden');
        this.showMessage('Lists loaded successfully!', 'success');
        
      } catch (error) {
        this.showMessage(`Error loading lists: ${error.message}`, 'error');
      }
    }
  
    populateListSelect(lists) {
      const select = document.getElementById('listSelect');
      select.innerHTML = '<option value="">Choose a list...</option>';
      
      lists.forEach(list => {
        const option = document.createElement('option');
        option.value = list.id;
        option.textContent = list.name;
        select.appendChild(option);
      });
    }
  
    async saveConfiguration() {
      const listId = document.getElementById('listSelect').value;
      
      if (!listId) {
        this.showMessage('Please select a list first.', 'error');
        return;
      }
      
      this.listId = listId;
      
      try {
        await chrome.storage.sync.set({
          trelloApiKey: this.apiKey,
          trelloToken: this.token,
          boardId: this.boardId,
          todoListId: this.listId
        });
        
        this.showMessage('Configuration saved successfully!', 'success');
        setTimeout(() => this.updateUI(), 1000);
        
      } catch (error) {
        this.showMessage(`Error saving configuration: ${error.message}`, 'error');
      }
    }
  
    reconfigure() {
      this.updateUI();
    }
  
    async testConnection() {
      if (!this.apiKey || !this.token) {
        this.showMessage('Please configure API credentials first.', 'error');
        return;
      }
      
      this.showMessage('Testing connection...', 'loading');
      
      try {
        const response = await fetch(`https://api.trello.com/1/members/me?key=${this.apiKey}&token=${this.token}`);
        
        if (!response.ok) {
          throw new Error(`Connection failed: ${response.status}`);
        }
        
        const user = await response.json();
        this.showMessage(`✓ Connected as ${user.fullName || user.username}`, 'success');
        
      } catch (error) {
        this.showMessage(`Connection test failed: ${error.message}`, 'error');
      }
    }
  
    showMessage(message, type) {
      const messagesEl = document.getElementById('messages');
      messagesEl.innerHTML = `<div class="${type}">${message}</div>`;
      
      if (type === 'success') {
        setTimeout(() => {
          messagesEl.innerHTML = '';
        }, 3000);
      }
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new TrelloConfigPopup();
  });