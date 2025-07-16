# Twitter to Trello Extension

A Chrome extension that allows you to manually select and export Twitter/X tweets (including bookmarks) to Trello cards. Perfect for saving interesting tweets as actionable items in your Trello workflow.

https://www.youtube.com/watch?v=iZ_vpWOhWDw

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

1. **Download** this extension

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or go to Chrome menu → More tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the extension folder
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


## 📋 Privacy Policy

### Overview
Twitter to Trello Exporter is a Chrome browser extension that allows users to export tweets from Twitter/X to their Trello boards. This privacy policy explains how we handle your information.

### Information We Collect
The Extension accesses and processes the following information:

**From Twitter/X:**
- Tweet content (text, images, timestamps)
- Author information (usernames, display names)
- Tweet URLs and metadata
- **Note**: This data is only processed locally and is not stored by us

**User-Provided Information:**
- Trello API credentials (API key and token)
- Selected Trello board and list IDs
- **Storage**: Saved locally in your browser using Chrome's storage API

### How We Use Information
- **Tweet Data**: Processed locally to format and export to your chosen Trello board
- **Trello Credentials**: Used to authenticate API calls to create cards in your Trello account
- **No External Storage**: We do not store, transmit, or retain any of your data on external servers

### Data Sharing
We do not share, sell, or transmit your data to any third parties except:
- **Trello**: Your selected tweet data is sent directly to Trello's API to create cards
- **No Analytics**: We do not use analytics or tracking services

### Data Security
- All data processing happens locally in your browser
- Trello credentials are stored securely using Chrome's encrypted storage
- No data is transmitted to our servers or any third-party services other than Trello

### Your Rights
- **Access**: You can view your stored credentials in the extension popup
- **Deletion**: You can clear all stored data by removing the extension
- **Control**: You have full control over what tweets to export and when

### Contact
For questions about this privacy policy, please contact: shreyas314159@gmail.com

## ⚠️ Disclaimer

This extension is not affiliated with Twitter/X or Trello. Use responsibly and in accordance with their terms of service.

---
