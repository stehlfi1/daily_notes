// Daily Primer — Background Service Worker

const HOST_NAME = 'com.dailyprimer.host';

const DEFAULT_SETTINGS = {
  vaultPath: '',
  subfolder: 'daily-notes',
  dateFormat: 'YYYY-MM-DD',
  newtabDelay: 40,
  blockedDelay: 40,
  blacklist: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'instagram.com']
};

// Temporarily allowed domains (domain -> expiry timestamp)
const allowedDomains = new Map();

// Set default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.sync.get('settings');
    if (!existing.settings) {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  }
});

// --- Blacklist interception via webNavigation ---

function domainMatches(url, blacklist) {
  try {
    const hostname = new URL(url).hostname;
    return blacklist.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function isDomainAllowed(url) {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, expiry] of allowedDomains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        if (Date.now() < expiry) return true;
        allowedDomains.delete(domain);
      }
    }
  } catch {}
  return false;
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept top-level navigations
  if (details.frameId !== 0) return;

  // Don't intercept extension pages
  if (details.url.startsWith('chrome-extension://')) return;

  // Check if temporarily allowed
  if (isDomainAllowed(details.url)) return;

  const result = await chrome.storage.sync.get('settings');
  const settings = result.settings || DEFAULT_SETTINGS;

  if (domainMatches(details.url, settings.blacklist)) {
    const domain = new URL(details.url).hostname.replace(/^www\./, '');
    const primerUrl = chrome.runtime.getURL(
      `newtab.html?blocked=true&domain=${encodeURIComponent(domain)}`
    );
    chrome.tabs.update(details.tabId, { url: primerUrl });
  }
});

// --- Native messaging: read files ---

function readFileNative(filePath) {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connectNative(HOST_NAME);
    port.onMessage.addListener((response) => {
      port.disconnect();
      if (response.success) {
        resolve(response.content);
      } else {
        reject(new Error(response.error));
      }
    });
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      }
    });
    port.postMessage({ type: 'read_file', path: filePath });
  });
}

// --- Message handler ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'READ_NOTE') {
    readFileNative(message.path)
      .then(content => sendResponse({ success: true, content }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'ALLOW_SITE') {
    const domain = message.domain;
    // Allow for 15 seconds
    allowedDomains.set(domain, Date.now() + 15000);
    sendResponse({ success: true });
    return false;
  }
});