const CIRCUMFERENCE = 2 * Math.PI * 52; // matches SVG circle r=52

const DEFAULT_SETTINGS = {
  vaultPath: '',
  subfolder: 'daily-notes',
  dateFormat: 'YYYY-MM-DD',
  newtabDelay: 40,
  blockedDelay: 40,
  blacklist: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'instagram.com']
};

// --- Date formatting ---

function formatDate(date, format) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', y)
    .replace('MM', m)
    .replace('DD', d)
    .replace('dddd', days[date.getDay()]);
}

function todayFilename(dateFormat) {
  return formatDate(new Date(), dateFormat) + '.md';
}

function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// --- Settings ---

async function loadSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

// --- Vault reading via native messaging ---

async function readDailyNote(settings) {
  if (!settings.vaultPath) return null;

  const subfolder = settings.subfolder || 'daily-notes';
  const filename = todayFilename(settings.dateFormat);
  const filePath = `${settings.vaultPath}/${subfolder}/${filename}`;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'READ_NOTE', path: filePath });
    if (response && response.success) {
      return response.content;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// --- Markdown rendering ---

function renderMarkdown(md) {
  const html = marked.parse(md);
  // Convert Obsidian-style checkboxes: - [ ] and - [x]
  return html.replace(
    /<li>\s*\[( |x)\]\s*/gi,
    (match, checked) => {
      const isChecked = checked.toLowerCase() === 'x';
      return `<li class="task-item"><input type="checkbox" disabled ${isChecked ? 'checked' : ''}> `;
    }
  );
}

// --- Timer ---

function startTimer(duration, onComplete) {
  const overlay = document.getElementById('timer-overlay');
  const blocker = document.getElementById('interaction-blocker');
  const countEl = document.getElementById('timer-count');
  const progressEl = document.querySelector('.ring-progress');

  // Shift timer down if block bar is visible
  const blockBar = document.getElementById('block-bar');
  if (blockBar && !blockBar.classList.contains('hidden')) {
    const barHeight = blockBar.offsetHeight;
    document.documentElement.style.setProperty('--timer-top', `calc(1.5rem + ${barHeight}px)`);
  }

  overlay.classList.remove('hidden');
  blocker.classList.remove('hidden');
  progressEl.style.strokeDasharray = CIRCUMFERENCE;
  progressEl.style.strokeDashoffset = '0';

  let remaining = duration;
  countEl.textContent = remaining;

  // Steal focus from address bar so user can't type to navigate away
  blocker.setAttribute('tabindex', '-1');
  blocker.focus();

  const interval = setInterval(() => {
    remaining--;
    countEl.textContent = remaining;

    const progress = 1 - (remaining / duration);
    progressEl.style.strokeDashoffset = (progress * CIRCUMFERENCE).toString();

    if (remaining <= 0) {
      clearInterval(interval);
      overlay.classList.add('hidden');
      blocker.classList.add('hidden');
      onComplete();
    }
  }, 1000);

  // Prevent bypass — steal focus back and block keys
  document.addEventListener('keydown', (e) => {
    if (remaining > 0) {
      e.preventDefault();
      e.stopPropagation();
      blocker.focus();
    }
  }, true);
}

// --- Blocked mode: proceed ---

async function proceedToSite(domain) {
  await chrome.runtime.sendMessage({ type: 'ALLOW_SITE', domain });
  window.location.href = `https://${domain}`;
}

// --- Setup prompt ---

function showSetup() {
  document.getElementById('setup-prompt').classList.remove('hidden');

  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// --- Main ---

async function init() {
  const params = new URLSearchParams(window.location.search);
  const isBlocked = params.get('blocked') === 'true';
  const blockedDomain = params.get('domain') || '';

  const settings = await loadSettings();

  if (!settings.vaultPath) {
    showSetup();
    return;
  }

  // Show primer
  document.getElementById('primer').classList.remove('hidden');

  // Date display
  const now = new Date();
  document.getElementById('current-date').textContent = formatDate(now, 'YYYY-MM-DD — dddd');

  // Blocked mode header
  if (isBlocked && blockedDomain) {
    document.getElementById('block-bar').classList.remove('hidden');
    document.getElementById('blocked-domain').textContent = blockedDomain;
  }

  // Read and render note
  const noteContent = await readDailyNote(settings);

  if (noteContent) {
    document.getElementById('note-content').innerHTML = renderMarkdown(noteContent);
  } else {
    document.getElementById('no-note').classList.remove('hidden');
  }

  // Determine delay
  let delay = 0;

  if (isBlocked) {
    // Blocked sites always get the full delay
    delay = settings.blockedDelay;
  } else {
    // New tab: only delay on first open of the day
    const stored = await chrome.storage.local.get('lastDelayDate');
    const today = todayDateString();

    if (stored.lastDelayDate !== today) {
      delay = settings.newtabDelay;
    }
  }

  if (delay > 0) {
    startTimer(delay, () => {
      if (isBlocked && blockedDomain) {
        // Show proceed button
        document.getElementById('proceed-domain').textContent = blockedDomain;
        document.getElementById('actions').classList.remove('hidden');
      }

      if (!isBlocked) {
        // Mark today's delay as done
        chrome.storage.local.set({ lastDelayDate: todayDateString() });
      }
    });
  } else {
    // No delay for this new tab (already shown today)
    if (isBlocked && blockedDomain) {
      document.getElementById('proceed-domain').textContent = blockedDomain;
      document.getElementById('actions').classList.remove('hidden');
    }
  }

  // Proceed button handler
  document.getElementById('proceed-btn').addEventListener('click', () => {
    proceedToSite(blockedDomain);
  });
}

document.addEventListener('DOMContentLoaded', init);