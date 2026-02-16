const DEFAULT_SETTINGS = {
  vaultPath: '',
  subfolder: 'daily-notes',
  dateFormat: 'YYYY-MM-DD',
  newtabDelay: 40,
  blockedDelay: 40,
  blacklist: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'instagram.com']
};

async function loadSettings() {
  const result = await chrome.storage.sync.get('settings');
  return result.settings || DEFAULT_SETTINGS;
}

async function init() {
  const settings = await loadSettings();

  document.getElementById('vault-path').value = settings.vaultPath || '';
  document.getElementById('subfolder').value = settings.subfolder || 'daily-notes';
  document.getElementById('date-format').value = settings.dateFormat || 'YYYY-MM-DD';
  document.getElementById('newtab-delay').value = settings.newtabDelay ?? 40;
  document.getElementById('blocked-delay').value = settings.blockedDelay ?? 40;
  document.getElementById('blacklist').value = (settings.blacklist || DEFAULT_SETTINGS.blacklist).join('\n');

  document.getElementById('save').addEventListener('click', saveSettings);
}

async function saveSettings() {
  const blacklistText = document.getElementById('blacklist').value.trim();
  const blacklist = blacklistText
    .split('\n')
    .map(d => d.trim().toLowerCase())
    .filter(d => d.length > 0);

  const settings = {
    vaultPath: document.getElementById('vault-path').value.trim(),
    subfolder: document.getElementById('subfolder').value.trim() || 'daily-notes',
    dateFormat: document.getElementById('date-format').value.trim() || 'YYYY-MM-DD',
    newtabDelay: parseInt(document.getElementById('newtab-delay').value, 10) || 40,
    blockedDelay: parseInt(document.getElementById('blocked-delay').value, 10) || 40,
    blacklist
  };

  await chrome.storage.sync.set({ settings });

  const status = document.getElementById('save-status');
  status.classList.remove('hidden');
  setTimeout(() => status.classList.add('hidden'), 2000);
}

document.addEventListener('DOMContentLoaded', init);