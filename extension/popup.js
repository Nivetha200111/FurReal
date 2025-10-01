// Popup script for FurReal extension
document.addEventListener('DOMContentLoaded', async () => {
  const extensionToggle = document.getElementById('extensionToggle');
  const childModeToggle = document.getElementById('childModeToggle');
  const autoDetectToggle = document.getElementById('autoDetectToggle');
  const refreshBtn = document.getElementById('refreshBtn');
  
  const analyzedCount = document.getElementById('analyzedCount');
  const aiCount = document.getElementById('aiCount');
  const blockedCount = document.getElementById('blockedCount');
  
  // Load saved settings
  const settings = await chrome.storage.sync.get({
    extensionEnabled: true,
    childMode: false,
    autoDetect: true,
    analyzedCount: 0,
    aiCount: 0,
    blockedCount: 0
  });
  
  // Update UI with saved settings
  updateToggle(extensionToggle, settings.extensionEnabled);
  updateToggle(childModeToggle, settings.childMode);
  updateToggle(autoDetectToggle, settings.autoDetect);
  
  analyzedCount.textContent = settings.analyzedCount;
  aiCount.textContent = settings.aiCount;
  blockedCount.textContent = settings.blockedCount;
  
  // Toggle event listeners
  extensionToggle.addEventListener('click', async () => {
    const newState = !extensionToggle.classList.contains('active');
    updateToggle(extensionToggle, newState);
    await chrome.storage.sync.set({ extensionEnabled: newState });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('instagram.com')) {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleExtension', 
        enabled: newState 
      });
    }
  });
  
  childModeToggle.addEventListener('click', async () => {
    const newState = !childModeToggle.classList.contains('active');
    updateToggle(childModeToggle, newState);
    await chrome.storage.sync.set({ childMode: newState });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('instagram.com')) {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleChildMode', 
        enabled: newState 
      });
    }
  });
  
  autoDetectToggle.addEventListener('click', async () => {
    const newState = !autoDetectToggle.classList.contains('active');
    updateToggle(autoDetectToggle, newState);
    await chrome.storage.sync.set({ autoDetect: newState });
    
    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('instagram.com')) {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleAutoDetect', 
        enabled: newState 
      });
    }
  });
  
  refreshBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url?.includes('instagram.com')) {
      chrome.tabs.reload(tab.id);
    }
  });
  
  // Listen for updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStats') {
      analyzedCount.textContent = message.analyzedCount || 0;
      aiCount.textContent = message.aiCount || 0;
      blockedCount.textContent = message.blockedCount || 0;
    }
  });
  
  function updateToggle(toggle, active) {
    if (active) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }
});
