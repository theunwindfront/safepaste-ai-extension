import '../shared/constants.js';

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...SP.DEFAULT_SETTINGS, ...settings };
}

const today = () => new Date().toLocaleDateString('en-CA');

export async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return stats?.day === today() ? stats : { day: today(), items: 0, pastes: 0 };
}

export async function recordPaste(counts) {
  const stats = await getStats();
  stats.pastes += 1;
  stats.items += Object.values(counts).reduce((sum, n) => sum + n, 0);
  await chrome.storage.local.set({ stats });
}
