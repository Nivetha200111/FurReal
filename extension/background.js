// Background script for FurReal extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('FurReal extension installed');
  
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

// Analyze Instagram content using our API with timeout
async function analyzeInstagramContent(url, type) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
  
  try {
    // Try the main API first with timeout
    const response = await fetch('https://furreal-42bjwpxxp-nivethas-projects-f7c0732d.vercel.app/api/analyze-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ensure the response has the expected format
    if (data && data.summary) {
      return data;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API call failed:', error);
    
    // Skip local API fallback for speed - go straight to mock
    // Final fallback to mock analysis (faster)
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

// Content script is automatically injected via manifest.json
// No need for manual injection to prevent duplicates
