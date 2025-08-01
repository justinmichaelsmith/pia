// Wire up buttons and list rendering via background (storage lives there)

document.getElementById('savePage').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
};

document.getElementById('saveSite').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ type: 'CRAWL_SITE', startUrl: tab.url });
};

async function getAllPagesSW() {
  return new Promise((resolve) => {
    chrome.runtime.getBackgroundPage?.(() => resolve([])); // MV2 stub
    // MV3: call via message
    chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_PAGES' }, resolve);
  });
}

async function getAllSitesSW() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_SITES' }, resolve);
  });
}

// Because MV3 service worker can’t be directly called, we piggyback on messages:
chrome.runtime.onMessage.addListener((msg, _s, _r) => {
  if (msg?.type === 'INTERNAL_LIST_PAGES_RESULT') renderPages(msg.data || []);
  if (msg?.type === 'INTERNAL_LIST_SITES_RESULT') renderSites(msg.data || []);
});

function requestLists() {
  chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_PAGES' });
  chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_SITES' });
}

function renderPages(pages) {
  const list = document.getElementById('pageList');
  if (!pages.length) { list.innerHTML = '<li>No saved pages.</li>'; return; }
  list.innerHTML = '';
  pages.forEach(p => {
    const li = document.createElement('li');
    const safeTitle = p.title?.replace(/[<>]/g, '');
    li.innerHTML = `<a href="viewer.html?ts=${p.timestamp}" target="_blank">${safeTitle || 'Untitled'}</a>`;
    list.appendChild(li);
  });
}

function renderSites(sites) {
  const list = document.getElementById('siteList');
  if (!sites.length) { list.innerHTML = '<li>No saved sites.</li>'; return; }
  list.innerHTML = '';
  sites.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="site_viewer.html?id=${encodeURIComponent(s.id)}" target="_blank">${s.title} (${s.pageCount})</a>`;
    list.appendChild(li);
  });
}

window.onload = () => requestLists();
