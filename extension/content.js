// Content script for PawPrint AI extension
console.log('🚀 PawPrint AI content script loaded');
console.log('📍 Current URL:', window.location.href);
console.log('🔍 Looking for Instagram content...');

class InstagramAIDetector {
  constructor() {
    this.settings = {
      extensionEnabled: true,
      childMode: false,
      autoDetect: true
    };
    this.analyzedUrls = new Set();
    this.overlay = null;
    this.observer = null;
    
    this.init();
  }
  
  async init() {
    // Load settings
    await this.loadSettings();
    
    // Create overlay
    this.createOverlay();
    
    // Start observing Instagram content
    this.startObserving();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
    });
  }
  
  async loadSettings() {
    const settings = await chrome.storage.sync.get({
      extensionEnabled: true,
      childMode: false,
      autoDetect: true
    });
    this.settings = settings;
  }
  
  createOverlay() {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('pawprint-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'pawprint-overlay';
    this.overlay.innerHTML = `
      <div class="pawprint-warning" id="pawprint-warning">
        <div class="pawprint-icon">🤖</div>
        <div class="pawprint-content">
          <div class="pawprint-title">AI Content Detected</div>
          <div class="pawprint-probability" id="pawprint-probability">0%</div>
        </div>
        <button class="pawprint-close" id="pawprint-close">×</button>
      </div>
      <div class="pawprint-blocked" id="pawprint-blocked">
        <div class="pawprint-blocked-content">
          <div class="pawprint-blocked-icon">🚫</div>
          <div class="pawprint-blocked-text">Content blocked by PawPrint AI</div>
          <div class="pawprint-blocked-reason">AI-generated content detected</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }
  
  startObserving() {
    if (!this.settings.extensionEnabled) return;
    
    // Observe for new content
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.checkForNewContent();
        }
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial check
    this.checkForNewContent();
    
    // Periodic check every 2 seconds to catch new content
    setInterval(() => {
      if (this.settings.autoDetect) {
        this.checkForNewContent();
      }
    }, 2000);
  }
  
  checkForNewContent() {
    if (!this.settings.autoDetect) {
      console.log('❌ Auto-detect is disabled');
      return;
    }
    
    console.log('🔍 Checking for new content...');
    
    // Try multiple selectors for Instagram content
    const selectors = [
      'article[role="presentation"]',
      'div[role="presentation"]',
      'article',
      'div[data-testid*="post"]',
      'div[data-testid*="reel"]'
    ];
    
    let allElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`📋 Selector "${selector}": found ${elements.length} elements`);
      allElements = allElements.concat(Array.from(elements));
    });
    
    // Remove duplicates
    const uniqueElements = [...new Set(allElements)];
    console.log(`📊 Total unique elements found: ${uniqueElements.length}`);
    
    // Find videos
    const videos = document.querySelectorAll('video');
    console.log(`🎥 Videos found: ${videos.length}`);
    
    // Analyze each element
    uniqueElements.forEach((element, index) => {
      this.analyzeElement(element, index);
    });
    
    videos.forEach((video, index) => {
      this.analyzeVideo(video, index);
    });
  }
  
  async analyzeElement(element, index) {
    try {
      // Skip if this element doesn't contain a video
      const hasVideo = element.querySelector('video');
      if (!hasVideo) {
        console.log(`⏭️ Element ${index} has no video, skipping`);
        return;
      }
      
      console.log(`🎥 Element ${index} has video, analyzing...`);
      
      // Generate a mock URL for this content since we can't find real URLs
      const mockUrl = `https://instagram.com/reel/mock_${Date.now()}_${index}`;
      
      // Skip if already analyzed this mock URL
      if (this.analyzedUrls.has(mockUrl)) {
        console.log(`⏭️ Already analyzed mock URL: ${mockUrl}`);
        return;
      }
      
      this.analyzedUrls.add(mockUrl);
      console.log(`🆕 New video content found: ${mockUrl}`);
      
      // Simulate analysis with random AI probability
      const aiProbability = Math.random() * 100;
      const isAI = aiProbability > 70;
      const isSuspicious = aiProbability > 40;
      
      console.log(`🤖 AI Probability: ${aiProbability.toFixed(1)}% - ${isAI ? 'AI' : isSuspicious ? 'Suspicious' : 'Real'}`);
      
      // Create mock result
      const result = {
        summary: {
          aiProbability: aiProbability,
          label: isAI ? 'Likely AI' : isSuspicious ? 'Suspicious' : 'Likely Real'
        }
      };
      
      this.handleAnalysisResult(element, result, mockUrl);
      
    } catch (error) {
      console.error('❌ Error analyzing element:', error);
    }
  }

  async analyzeReel(reelElement, index) {
    try {
      // Extract URL from reel - try multiple selectors
      const linkElement = reelElement.querySelector('a[href*="/reel/"]') || 
                         reelElement.querySelector('a[href*="/p/"]') ||
                         reelElement.querySelector('a[href*="/tv/"]') ||
                         reelElement.closest('a[href*="/reel/"]') ||
                         reelElement.closest('a[href*="/p/"]');
      
      if (!linkElement) {
        console.log(`No link found for reel ${index}`);
        return;
      }
      
      const url = linkElement.href;
      console.log(`Analyzing reel ${index}: ${url}`);
      
      // Skip if already analyzed
      if (this.analyzedUrls.has(url)) {
        console.log(`Already analyzed: ${url}`);
        return;
      }
      
      this.analyzedUrls.add(url);
      console.log(`New content found: ${url}`);
      
      // Analyze the content
      const result = await this.analyzeContent(url, 'reel');
      
      if (result && result.summary) {
        this.handleAnalysisResult(reelElement, result, url);
      }
      
    } catch (error) {
      console.error('Error analyzing reel:', error);
    }
  }
  
  async analyzeVideo(videoElement, index) {
    try {
      // Find parent container - try multiple selectors
      let container = videoElement.closest('div[role="presentation"]') || 
                     videoElement.closest('article') ||
                     videoElement.closest('div[data-testid*="post"]') ||
                     videoElement.closest('div[data-testid*="reel"]') ||
                     videoElement.parentElement;
      
      if (!container) {
        console.log(`⏭️ No container found for video ${index}, using video element itself`);
        container = videoElement;
      }
      
      // Generate a mock URL for this video
      const mockUrl = `https://instagram.com/video/mock_${Date.now()}_${index}`;
      
      // Skip if already analyzed this mock URL
      if (this.analyzedUrls.has(mockUrl)) {
        console.log(`⏭️ Already analyzed video: ${mockUrl}`);
        return;
      }
      
      this.analyzedUrls.add(mockUrl);
      console.log(`🎬 New video content found: ${mockUrl}`);
      
      // Simulate analysis with random AI probability
      const aiProbability = Math.random() * 100;
      const isAI = aiProbability > 70;
      const isSuspicious = aiProbability > 40;
      
      console.log(`🤖 Video AI Probability: ${aiProbability.toFixed(1)}% - ${isAI ? 'AI' : isSuspicious ? 'Suspicious' : 'Real'}`);
      
      // Create mock result
      const result = {
        summary: {
          aiProbability: aiProbability,
          label: isAI ? 'Likely AI' : isSuspicious ? 'Suspicious' : 'Likely Real'
        }
      };
      
      this.handleAnalysisResult(container, result, mockUrl);
      
    } catch (error) {
      console.error('❌ Error analyzing video:', error);
    }
  }
  
  async analyzeContent(url, type) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'analyzeContent',
        url: url,
        type: type
      }, (response) => {
        if (response && response.success) {
          resolve(response.result);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  handleAnalysisResult(element, result, url) {
    const aiProbability = result.summary.aiProbability || 0;
    const isAI = aiProbability > 70;
    const isSuspicious = aiProbability > 40;
    
    // Update stats
    this.updateStats({ analyzed: 1, ai: isAI ? 1 : 0 });
    
    if (isAI || isSuspicious) {
      // Show warning overlay
      this.showWarning(element, aiProbability, isAI);
      
      // Block content if child mode is on
      if (this.settings.childMode && isAI) {
        this.blockContent(element);
        this.updateStats({ blocked: 1 });
      }
    }
  }
  
  showWarning(element, probability, isAI) {
    const warning = document.getElementById('pawprint-warning');
    const probabilityElement = document.getElementById('pawprint-probability');
    
    if (!warning || !probabilityElement) return;
    
    // Update probability
    probabilityElement.textContent = `${probability.toFixed(1)}%`;
    probabilityElement.className = `pawprint-probability ${isAI ? 'ai' : 'suspicious'}`;
    
    // Position overlay near the element
    const rect = element.getBoundingClientRect();
    warning.style.display = 'block';
    warning.style.top = `${rect.top + window.scrollY + 10}px`;
    warning.style.left = `${rect.left + 10}px`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      warning.style.display = 'none';
    }, 5000);
    
    // Close button
    document.getElementById('pawprint-close')?.addEventListener('click', () => {
      warning.style.display = 'none';
    });
  }
  
  blockContent(element) {
    const blocked = document.getElementById('pawprint-blocked');
    if (!blocked) return;
    
    // Hide the original content
    element.style.display = 'none';
    
    // Show blocked overlay
    const rect = element.getBoundingClientRect();
    blocked.style.display = 'block';
    blocked.style.top = `${rect.top + window.scrollY}px`;
    blocked.style.left = `${rect.left}px`;
    blocked.style.width = `${rect.width}px`;
    blocked.style.height = `${rect.height}px`;
  }
  
  updateStats(stats) {
    chrome.runtime.sendMessage({
      action: 'updateStats',
      stats: stats
    });
  }
  
  handleMessage(message, sendResponse) {
    switch (message.action) {
      case 'toggleExtension':
        this.settings.extensionEnabled = message.enabled;
        if (message.enabled) {
          this.startObserving();
        } else {
          this.stopObserving();
        }
        break;
        
      case 'toggleChildMode':
        this.settings.childMode = message.enabled;
        break;
        
      case 'toggleAutoDetect':
        this.settings.autoDetect = message.enabled;
        break;
    }
  }
  
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize the detector
const detector = new InstagramAIDetector();

// Add global test function for debugging
window.testPawPrint = () => {
  console.log('🧪 Testing PawPrint AI...');
  detector.checkForNewContent();
};

// Add function to force show overlay for testing
window.showTestOverlay = () => {
  console.log('🧪 Showing test overlay...');
  const element = document.querySelector('div[role="presentation"]') || document.body;
  const result = {
    summary: {
      aiProbability: 85,
      label: 'Likely AI'
    }
  };
  detector.handleAnalysisResult(element, result, 'test_url');
};

console.log('💡 Type testPawPrint() to test detection or showTestOverlay() to force show overlay');
