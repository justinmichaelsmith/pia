// Loads storage & crawler into the service worker context
importScripts('storage.js', 'crawler.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('WebNest installed.');
});

// Messages from popup/content
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  (async () => {
    if (msg?.type === 'SAVE_PAGE' && msg.payload) {
      const ts = await saveSinglePage(msg.payload);
      notify('WebNest: page saved.');
      console.log('Saved page ts=', ts, msg.payload.title);
    }
    if (msg?.type === 'CRAWL_SITE' && msg.startUrl) {
      await runCrawl(msg.startUrl);
    }
  })();
});

// Trigger a crawl
async function runCrawl(startUrl) {
  notify('WebNest: starting site save…');
  try {
    const pages = await crawlSite(startUrl, {
      MAX_PAGES: 50,      // adjust
      MAX_DEPTH: 2,       // adjust
      DELAY_MS: 500,      // polite crawling
      OBEY_ROBOTS: true   // toggle if needed
    });
    const siteId = await saveSiteCollection(startUrl, pages);
    notify(`Saved ${pages.length} pages from ${new URL(startUrl).host}.`);
    console.log('Crawl complete, siteId:', siteId);
  } catch (e) {
    console.error('Crawl failed', e);
    notify('WebNest: crawl failed. See console for details.');
  }
}

// Lightweight notification helper
function notify(message) {
  if (!chrome.notifications) return;
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'WebNest',
    message
  });
}