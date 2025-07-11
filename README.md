# Twitter to Trello Extension

A Chrome extension that allows you to manually select and export Twitter/X tweets (including bookmarks) to Trello cards. Perfect for saving interesting tweets as actionable items in your Trello workflow.

## ✨ Features

- 🐦 **Select tweets from any Twitter/X page** - Works on feeds, profiles, and bookmarks
- 📋 **Export to Trello** - Creates cards with tweet content, metadata, and links
- 🎨 **Beautiful selection UI** - Modern interface with visual feedback and animations
- 🔄 **Batch export** - Select multiple tweets and export them all at once
- ⚙️ **Easy setup** - Simple configuration through the extension popup

## 🚀 Installation

### Prerequisites

1. **Google Chrome** browser
2. **Trello account** and API credentials

### Step 1: Get Trello API Credentials

1. Go to [https://trello.com/app-key](https://trello.com/app-key)
2. Copy your **API Key**
3. Click the "Token" link to generate a **Token**
4. Copy the token (you'll need both the API Key and Token for setup)

### Step 2: Install the Extension

1. **Download or Clone** this repository:
   ```bash
   git clone https://github.com/yourusername/twitter-to-trello-extension.git
   cd twitter-to-trello-extension
   ```

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or go to Chrome menu → More tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `twitter-to-trello-extension` folder
   - The extension should now appear in your extensions list

### Step 3: Configure the Extension

1. **Click the extension icon** in your Chrome toolbar
2. **Enter your Trello credentials**:
   - Paste your API Key
   - Paste your Token
   - Click "Load My Boards"

3. **Select your target**:
   - Choose the Trello board where you want to create cards
   - Select the specific list within that board
   - Click "Save Configuration"

4. **Test the connection** (optional but recommended)

## 📖 How to Use

1. **Navigate to Twitter/X** (twitter.com or x.com)
2. **Click the floating "Export to Trello" button** (bottom right of the page)
3. **Select tweets** by clicking on them - you'll see visual indicators
4. **Click "Export to Trello"** in the selection overlay
5. **Check your Trello board** - new cards will be created with tweet content

### Works on:
- ✅ Twitter home feed
- ✅ User profiles
- ✅ Tweet threads
- ✅ **Bookmarks page** (the main use case!)
- ✅ Search results

## 🛠️ Development

### Project Structure

```
├── manifest.json          # Extension configuration
├── content-script.js      # Main UI logic for tweet selection
├── background.js          # Trello API integration
├── popup.html            # Extension popup interface
├── popup.js              # Popup configuration logic
├── styles.css            # Extension styling
└── icons/                # Extension icons
```

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on Twitter/X

### Architecture

- **Content Script**: Handles tweet selection UI and user interactions
- **Background Script**: Manages Trello API calls and data formatting
- **Popup**: Provides configuration interface for API setup

## 🔧 Troubleshooting

### Extension not working?
- Make sure you're on twitter.com or x.com
- Check that the extension is enabled in `chrome://extensions/`
- Refresh the Twitter page after installing

### Can't select tweets?
- Ensure you've clicked the "Export to Trello" button first to enter selection mode
- Try refreshing the page and starting over
- Check browser console for any error messages

### Trello export failing?
- Verify your API credentials are correct
- Make sure you've selected a valid board and list
- Check that your Trello token has the necessary permissions

### Tweets navigating instead of selecting?
- This extension uses advanced event handling to prevent navigation during selection
- If you're still having issues, try clicking directly on the tweet text rather than links/buttons

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit: `git commit -am 'Add some feature'`
5. Push: `git push origin feature-name`
6. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This extension is not affiliated with Twitter/X or Trello. Use responsibly and in accordance with their terms of service.

---

**Made with ❤️ for productivity enthusiasts who want to turn tweets into actionable Trello cards!**