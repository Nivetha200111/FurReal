// Content script for FurReal extension
// Prevent multiple executions
if (window.pawPrintScriptLoaded) {
  console.log('⚠️ FurReal script already loaded, skipping...');
  // Exit early without using return
} else {
  window.pawPrintScriptLoaded = true;
  console.log('🚀 FurReal content script loaded');
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
    this.intervalId = null;
    this.maxAnalyzedUrls = 100; // Limit memory usage
    this.debounceTimer = null;
    this.resultCache = new Map();
    this.cacheTtlMs = 5 * 60 * 1000; // 5 min cache
    
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
          <div class="pawprint-blocked-text">Content blocked by FurReal</div>
          <div class="pawprint-blocked-reason">AI-generated content detected</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }
  
  startObserving() {
    if (!this.settings.extensionEnabled) return;
    
    // Throttle function to prevent excessive calls
    let lastCheck = 0;
    const checkThrottle = 2000; // 2 seconds minimum between checks (faster response)
    
    const throttledCheck = () => {
      const now = Date.now();
      if (now - lastCheck > checkThrottle) {
        lastCheck = now;
        this.checkForNewContent();
      }
    };
    
    // Observe for new content with throttling and better filtering
    this.observer = new MutationObserver((mutations) => {
      // Count significant changes to avoid excessive processing
      let significantChanges = 0;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const hasRelevantContent = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            
            // Check if it's a relevant Instagram content element
            return node.tagName === 'ARTICLE' || 
                   node.getAttribute('role') === 'presentation' ||
                   node.getAttribute('data-testid')?.includes('post') ||
                   node.getAttribute('data-testid')?.includes('reel') ||
                   node.querySelector?.('video');
          });
          
          if (hasRelevantContent) {
            significantChanges++;
          }
        }
      });
      
      // Debounce checks to handle bursts of DOM changes smoothly
      if (significantChanges > 0) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          throttledCheck();
        }, 400);
      }
    });
    
    // More targeted observation - only observe main content areas
    const mainContent = document.querySelector('main') || document.body;
    this.observer.observe(mainContent, {
      childList: true,
      subtree: true
    });
    
    // Initial check
    this.checkForNewContent();
    
    // Periodic check every 15 seconds (more responsive than 30s)
    this.intervalId = setInterval(() => {
      if (this.settings.autoDetect) {
        throttledCheck();
      }
    }, 15000);
  }
  
  checkForNewContent() {
    if (!this.settings.autoDetect) {
      console.log('❌ Auto-detect is disabled');
      return;
    }
    
    const startTime = performance.now();
    console.log('🔍 Checking for new content...');
    
    // Try multiple Instagram selectors to find video content
    const selectors = [
      'article[role="presentation"]',
      'div[role="presentation"]',
      'article',
      'div[data-testid*="post"]',
      'div[data-testid*="reel"]',
      'div[data-testid*="video"]',
      'div[class*="video"]',
      'div[class*="reel"]',
      'div[class*="post"]'
    ];
    
    let allElements = [];
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        allElements = allElements.concat(Array.from(elements));
      } catch (e) {
        // Skip invalid selectors
      }
    });
    
    // Remove duplicates and filter for elements with videos
    const uniqueElements = [...new Set(allElements)];
    const elementsWithVideos = uniqueElements.filter(el => {
      // Check if element contains a video
      const hasVideo = el.querySelector('video');
      if (hasVideo) {
        console.log(`🎥 Found video in element:`, el.tagName, el.className);
        return true;
      }
      return false;
    });
    
    const finalElements = elementsWithVideos;
    
    console.log(`📊 Elements with videos found: ${finalElements.length}`);
    
    // Debug: Show what elements we found
    if (finalElements.length === 0) {
      console.log('🔍 Debug: No videos found. Checking all video elements...');
      const allVideos = document.querySelectorAll('video');
      console.log(`📹 Total video elements on page: ${allVideos.length}`);
      
      if (allVideos.length > 0) {
        console.log('🎬 Video elements found:', allVideos);
        // Process videos directly if no containers found
        allVideos.forEach((video, index) => {
          this.analyzeVideo(video, index);
        });
        return;
      }
    }
    
    // Limit processing to prevent performance issues
    const maxElements = 3; // Process max 3 elements at a time (faster)
    const elementsToProcess = Array.from(finalElements).slice(0, maxElements);
    
    // Analyze each element
    elementsToProcess.forEach((element, index) => {
      this.analyzeElement(element, index);
    });
    
    // Performance monitoring
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`⏱️ Content check completed in ${duration.toFixed(2)}ms`);
    
    // Warn if check takes too long
    if (duration > 100) {
      console.warn(`⚠️ Slow content check detected: ${duration.toFixed(2)}ms`);
    }
  }
  
  // Lightweight, <1s heuristic to provide immediate UI feedback
  computeQuickScore(element, url, opts = {}) {
    const text = (element?.innerText || '') + ' ' + (document.title || '') + ' ' + (url || '');
    const lower = text.toLowerCase();
    const aiHints = ['ai', 'ai-generated', 'ai generated', 'gen ai', 'gpt', 'diffusion', 'stable diffusion', 'midjourney', 'runway', 'sora', 'generated', 'not real'];
    const cgiHints = ['3d', 'cgi', 'animation', 'animated', 'pixar', 'disney', 'render', 'blender', 'vfx'];
    const liveHints = ['official', 'official clip', 'trailer', 'episode', 'season', 'series', 'movie', 'scene', 'hbo', 'max', 'warner', 'warner bros', 'dc', 'marvel', 'netflix', 'prime video', 'disney+', 'apple tv', 'paramount', 'peacock', 'peacemaker'];
    const memeHints = ['meme', 'funny', 'sped up', 'fast', 'repost', 'clip', 'clips', 'compilation', 'edit', 'capcut', 'trend', 'shorts', 'tiktok'];
    let score = 0.2; // start conservative
    const hasAIHint = aiHints.some(k => lower.includes(k));
    const hasCGIHint = cgiHints.some(k => lower.includes(k));
    const hasLiveHint = liveHints.some(k => lower.includes(k));
    const hasMemeHint = memeHints.some(k => lower.includes(k));
    const fastPlayback = typeof opts.playbackRate === 'number' && opts.playbackRate > 1.1;
    
    if (hasAIHint) score += 0.6; // strong push if explicitly AI
    if (hasCGIHint) score -= 0.12; // mild reduction for clearly CGI/animated
    if (hasLiveHint && !hasAIHint) score -= 0.25; // cinematic/live-action context
    if ((hasMemeHint || fastPlayback) && !hasAIHint) score -= 0.2; // human-edited meme/fast-forward
    if (hasAIHint) score = Math.max(score, 0.7); // ensure high immediate signal when self-declared AI
    
    // Slight extra reduction when both CGI and live hints (typical studio trailers)
    if (!hasAIHint && hasCGIHint && hasLiveHint) score -= 0.05;
    
    score = Math.min(0.95, Math.max(0.05, score));
    return { probabilityPct: score * 100, hasCGIHint, hasAIHint, hasLiveHint, hasMemeHint, fastPlayback };
  }
  
  getCachedResult(url) {
    const hit = this.resultCache.get(url);
    if (!hit) return null;
    if (Date.now() - hit.ts > this.cacheTtlMs) {
      this.resultCache.delete(url);
      return null;
    }
    return hit.data;
  }
  
  setCachedResult(url, data) {
    this.resultCache.set(url, { ts: Date.now(), data });
  }
  
  adjustWithHints(apiProbabilityPct, quick) {
    let p = apiProbabilityPct;
    if (quick?.hasAIHint) {
      // If uploader/self-caption suggests AI, don't suppress; give slight boost cap 99
      p = Math.max(p, Math.min(99, apiProbabilityPct + 10));
    } else {
      if (quick?.hasLiveHint) {
        // Strong down-weight for clear live-action/cinematic context
        p = apiProbabilityPct * 0.65;
      }
      if ((quick?.hasMemeHint || quick?.fastPlayback) && apiProbabilityPct < 85) {
        // Human-edited meme/fast-forward content → reduce unless API is very high
        p = p * 0.6;
      }
      if (quick?.hasCGIHint && apiProbabilityPct < 75) {
        // Only down-weight CGI when API confidence is not already high
        p = p * 0.85;
      }
    }
    return Math.min(99, Math.max(1, p));
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
      
      // Try to extract a real Instagram URL for this content
      const extractedUrl = this.extractInstagramUrl(element) || (location.href.includes('instagram.com/') ? location.href : null);
      if (!extractedUrl) {
        console.log('⚠️ No Instagram URL found near element; skipping API analysis');
        return;
      }
      
      // Cache check
      const cached = this.getCachedResult(extractedUrl);
      if (cached) {
        this.handleAnalysisResult(element, cached, extractedUrl);
        return;
      }
      
      // Skip if already analyzed this URL
      if (this.analyzedUrls.has(extractedUrl)) {
        console.log(`⏭️ Already analyzed URL: ${extractedUrl}`);
        return;
      }
      
      // Clean up old URLs to prevent memory leaks
      if (this.analyzedUrls.size >= this.maxAnalyzedUrls) {
        const urlsArray = Array.from(this.analyzedUrls);
        const toRemove = urlsArray.slice(0, Math.floor(this.maxAnalyzedUrls / 2));
        toRemove.forEach(url => this.analyzedUrls.delete(url));
        console.log(`🧹 Cleaned up ${toRemove.length} old URLs from memory`);
      }
      
      this.analyzedUrls.add(extractedUrl);
      console.log(`🆕 New video content found: ${extractedUrl}`);
      
      // Show loading indicator while waiting for API
      this.showLoadingIndicator(element);
      
      // Use real AI detection API only (no quick heuristic)
      try {
        const result = await this.analyzeContent(extractedUrl, 'reel');
        this.hideLoadingIndicator();
        
        if (result && result.summary) {
          const raw = result.summary.aiProbability || 0;
          const apiPct = raw <= 1 ? raw * 100 : raw;
          const normalized = { summary: { aiProbability: apiPct } };
          this.setCachedResult(extractedUrl, normalized);
          this.handleAnalysisResult(element, normalized, extractedUrl);
        } else {
          // No result → do not guess; keep silent for accuracy
          console.warn('ℹ️ API returned no summary; skipping display');
        }
      } catch (error) {
        this.hideLoadingIndicator();
        console.error('❌ AI analysis failed (no UI shown for accuracy):', error);
      }
      
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
      
      // Try to extract a real Instagram URL for this video
      const extractedUrl = this.extractInstagramUrl(container) || this.extractInstagramUrl(videoElement) || (location.href.includes('instagram.com/') ? location.href : null);
      if (!extractedUrl) {
        console.log('⚠️ No Instagram URL found near video; skipping API analysis');
        return;
      }
      
      // Cache check
      const cached = this.getCachedResult(extractedUrl);
      if (cached) {
        this.handleAnalysisResult(container, cached, extractedUrl);
        return;
      }
      
      // Skip if already analyzed this URL
      if (this.analyzedUrls.has(extractedUrl)) {
        console.log(`⏭️ Already analyzed video: ${extractedUrl}`);
        return;
      }
      
      this.analyzedUrls.add(extractedUrl);
      console.log(`🎬 New video content found: ${extractedUrl}`);
      
      // Show loading indicator while waiting for API
      this.showLoadingIndicator(container);
      
      // Use real AI detection API only (no quick heuristic)
      try {
        const result = await this.analyzeContent(extractedUrl, 'video');
        this.hideLoadingIndicator();
        
        if (result && result.summary) {
          const raw = result.summary.aiProbability || 0;
          const apiPct = raw <= 1 ? raw * 100 : raw;
          const normalized = { summary: { aiProbability: apiPct } };
          this.setCachedResult(extractedUrl, normalized);
          this.handleAnalysisResult(container, normalized, extractedUrl);
        } else {
          console.warn('ℹ️ API returned no summary; skipping display');
        }
      } catch (error) {
        this.hideLoadingIndicator();
        console.error('❌ Video AI analysis failed (no UI shown for accuracy):', error);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing video:', error);
    }
  }
  
  async analyzeContent(url, type) {
    return new Promise((resolve) => {
      // Add timeout for faster response
      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000); // 5 second timeout
      
      chrome.runtime.sendMessage({
        action: 'analyzeContent',
        url: url,
        type: type
      }, (response) => {
        clearTimeout(timeout);
        if (response && response.success) {
          resolve(response.result);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  handleAnalysisResult(element, result, url) {
    const raw = result.summary.aiProbability || 0;
    const aiProbability = raw <= 1 ? raw * 100 : raw;
    const isAI = aiProbability >= 70;
    const isSuspicious = aiProbability >= 40;
    
    // Always show overlay with probability for visibility
    this.showWarning(element, aiProbability, isAI);
    
    // Update stats (safe)
    try {
      this.updateStats({ analyzed: 1, ai: isAI ? 1 : 0 });
    } catch (e) {
      console.warn('⚠️ Stats update failed (non-blocking):', e);
    }
    
    // Block content if child mode is on and high confidence AI
    if (this.settings.childMode && isAI) {
      this.blockContent(element);
      try { this.updateStats({ blocked: 1 }); } catch {}
    }
  }
  
  showLoadingIndicator(element) {
    // Create a simple loading indicator
    const loading = document.createElement('div');
    loading.id = 'pawprint-loading';
    loading.innerHTML = '🤖 Analyzing...';
    loading.style.cssText = `
      position: absolute;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    loading.style.top = `${rect.top + window.scrollY + 10}px`;
    loading.style.left = `${rect.left + 10}px`;
    
    document.body.appendChild(loading);
  }
  
  hideLoadingIndicator() {
    const loading = document.getElementById('pawprint-loading');
    if (loading) {
      loading.remove();
    }
  }

  showWarning(element, probability, isAI) {
    let warning = document.getElementById('pawprint-warning');
    let probabilityElement = document.getElementById('pawprint-probability');
    
    if (!warning || !probabilityElement) {
      // Recreate overlay if missing
      try { this.createOverlay(); } catch {}
      warning = document.getElementById('pawprint-warning');
      probabilityElement = document.getElementById('pawprint-probability');
      if (!warning || !probabilityElement) return;
    }
    
    // Update probability
    probabilityElement.textContent = `${probability.toFixed(1)}%`;
    probabilityElement.className = `pawprint-probability ${isAI ? 'ai' : probability >= 40 ? 'suspicious' : ''}`;
    
    // Position overlay near the element with better positioning
    const rect = element?.getBoundingClientRect ? element.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal position with fallback
    let top = rect.top + window.scrollY + 10;
    let left = rect.left + 10;
    let useFixed = false;
    
    // Fallback if element has no size/is offscreen
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      useFixed = true;
      top = 20;
      left = viewportWidth - 320;
    }
    
    // Ensure overlay stays within viewport
    if (!useFixed && (left + 300 > viewportWidth)) {
      left = viewportWidth - 320;
    }
    if (!useFixed && (top + 100 > viewportHeight + window.scrollY)) {
      top = rect.top + window.scrollY - 110;
    }
    
    warning.style.display = 'block';
    warning.style.position = useFixed ? 'fixed' : 'absolute';
    warning.style.top = `${Math.max(10, top)}px`;
    warning.style.left = `${Math.max(10, left)}px`;
    warning.style.zIndex = '2147483647';
    warning.style.pointerEvents = 'auto';
    
    // Auto-hide after 6 seconds (longer for visibility)
    setTimeout(() => {
      if (warning.style.display !== 'none') {
        warning.style.display = 'none';
      }
    }, 6000);
    
    // Close button with proper event handling
    const closeBtn = document.getElementById('pawprint-close');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        warning.style.display = 'none';
      };
    }
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
    try {
      chrome.runtime.sendMessage({
        action: 'updateStats',
        stats: stats
      });
    } catch (e) {
      console.warn('⚠️ updateStats send failed (ignored):', e);
    }
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
      this.observer = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Clean up overlay
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
    }
    
    // Clear analyzed URLs to free memory
    this.analyzedUrls.clear();
    
    console.log('🧹 Extension stopped and cleaned up');
  }

  extractInstagramUrl(root) {
    try {
      // Prefer explicit anchors to reels/posts
      const link = root.querySelector('a[href*="/reel/"]') ||
                   root.querySelector('a[href*="/p/"]') ||
                   root.querySelector('a[href*="/tv/"]') ||
                   root.closest?.('a[href*="/reel/"]') ||
                   root.closest?.('a[href*="/p/"]');
      if (link && link.href) return link.href;
      
      // Some containers store data-urls
      const dataUrl = root.getAttribute?.('data-url') || root.dataset?.url;
      if (dataUrl && /instagram\.com\/.+\/(reel|p|tv)\//.test(dataUrl)) return dataUrl;
      
      // Fallback: scan descendants lightly
      const alt = root.querySelector?.('div a[href*="instagram.com/"]');
      if (alt && alt.href) return alt.href;
      
      return null;
    } catch {
      return null;
    }
  }
}

// Initialize the detector
if (!window.pawPrintDetector) {
  const detector = new InstagramAIDetector();
  window.pawPrintDetector = detector;
  console.log('🚀 FurReal detector initialized');
} else {
  console.log('⚠️ Detector already exists, reusing existing instance');
}

// Add global test function for debugging
window.testFurReal = () => {
  console.log('🧪 Testing FurReal...');
  if (window.pawPrintDetector) {
    window.pawPrintDetector.checkForNewContent();
  }
};

// Add function to force show overlay for testing
window.showTestOverlay = () => {
  console.log('🧪 Showing test overlay...');
  if (window.pawPrintDetector) {
    const element = document.querySelector('div[role="presentation"]') || document.body;
    const result = {
      summary: {
        aiProbability: 85,
        label: 'Likely AI'
      }
    };
    window.pawPrintDetector.handleAnalysisResult(element, result, 'test_url');
  }
};

console.log('💡 Type testFurReal() to test detection or showTestOverlay() to force show overlay');
} // End of else block for preventing multiple executions
