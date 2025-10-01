// Content script for PawPrint AI extension
console.log('PawPrint AI content script loaded');

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
  }
  
  checkForNewContent() {
    if (!this.settings.autoDetect) return;
    
    // Find Instagram reels and posts
    const reels = document.querySelectorAll('article[role="presentation"]');
    const videos = document.querySelectorAll('video');
    
    reels.forEach(reel => {
      this.analyzeReel(reel);
    });
    
    videos.forEach(video => {
      this.analyzeVideo(video);
    });
  }
  
  async analyzeReel(reelElement) {
    try {
      // Extract URL from reel
      const linkElement = reelElement.querySelector('a[href*="/reel/"]') || 
                         reelElement.querySelector('a[href*="/p/"]');
      
      if (!linkElement) return;
      
      const url = linkElement.href;
      
      // Skip if already analyzed
      if (this.analyzedUrls.has(url)) return;
      
      this.analyzedUrls.add(url);
      
      // Analyze the content
      const result = await this.analyzeContent(url, 'reel');
      
      if (result && result.summary) {
        this.handleAnalysisResult(reelElement, result, url);
      }
      
    } catch (error) {
      console.error('Error analyzing reel:', error);
    }
  }
  
  async analyzeVideo(videoElement) {
    try {
      // Find parent container that might be a reel
      let container = videoElement.closest('article[role="presentation"]');
      if (!container) return;
      
      // Extract URL
      const linkElement = container.querySelector('a[href*="/reel/"]') || 
                         container.querySelector('a[href*="/p/"]');
      
      if (!linkElement) return;
      
      const url = linkElement.href;
      
      // Skip if already analyzed
      if (this.analyzedUrls.has(url)) return;
      
      this.analyzedUrls.add(url);
      
      // Analyze the content
      const result = await this.analyzeContent(url, 'video');
      
      if (result && result.summary) {
        this.handleAnalysisResult(container, result, url);
      }
      
    } catch (error) {
      console.error('Error analyzing video:', error);
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
