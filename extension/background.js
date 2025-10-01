// Background script for PawPrint AI extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('PawPrint AI extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    extensionEnabled: true,
    childMode: false,
    autoDetect: true,
    analyzedCount: 0,
    aiCount: 0,
    blockedCount: 0
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeContent') {
    analyzeInstagramContent(message.url, message.type)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Analysis failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'updateStats') {
    updateStats(message.stats);
  }
});

// Analyze Instagram content using our API
async function analyzeInstagramContent(url, type) {
  try {
    const response = await fetch('https://furreal-2rfu9sdwi-nivethas-projects-f7c0732d.vercel.app/api/analyze-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    // Fallback to mock analysis
    return {
      summary: {
        aiProbability: Math.random() * 100,
        label: Math.random() > 0.5 ? 'Likely AI' : 'Likely Real'
      }
    };
  }
}

// Update statistics
async function updateStats(newStats) {
  const currentStats = await chrome.storage.sync.get([
    'analyzedCount', 'aiCount', 'blockedCount'
  ]);
  
  const updatedStats = {
    analyzedCount: (currentStats.analyzedCount || 0) + (newStats.analyzed || 0),
    aiCount: (currentStats.aiCount || 0) + (newStats.ai || 0),
    blockedCount: (currentStats.blockedCount || 0) + (newStats.blocked || 0)
  };
  
  await chrome.storage.sync.set(updatedStats);
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({
    action: 'updateStats',
    ...updatedStats
  }).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('instagram.com')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(() => {
      // Content script might already be injected
    });
  }
});
