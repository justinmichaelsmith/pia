function getDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('WebNestDB', 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pages')) {
        db.createObjectStore('pages', { keyPath: 'timestamp' });
      }
      if (!db.objectStoreNames.contains('sites')) {
        db.createObjectStore('sites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('site_pages')) {
        const sp = db.createObjectStore('site_pages', { keyPath: 'key' }); // key=`${siteId}|${url}`
        sp.createIndex('bySite', 'siteId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** ------- Single-page API ------- **/
async function saveSinglePage({ html, title, url }) {
  const db = await getDb();
  const timestamp = Date.now().toString();
  await new Promise((res, rej) => {
    const tx = db.transaction('pages', 'readwrite');
    tx.objectStore('pages').add({ timestamp, html, title, url: url || null });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  return timestamp;
}

async function getAllPages() {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readonly');
    const request = tx.objectStore('pages').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getPageByTs(ts) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readonly');
    const req = tx.objectStore('pages').get(ts);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** ------- Site collection API ------- **/
async function saveSiteCollection(startUrl, pages) {
  const db = await getDb();
  const id = `${new URL(startUrl).host}-${Date.now()}`;
  const title = new URL(startUrl).host;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['sites','site_pages'], 'readwrite');
    tx.objectStore('sites').add({
      id, title, startUrl, savedAt: Date.now(), pageCount: pages.length
    });
    const sp = tx.objectStore('site_pages');
    for (const p of pages) {
      sp.add({
        key: `${id}|${p.url}`,
        siteId: id,
        url: p.url,
        title: p.title,
        html: p.html,
        savedAt: p.savedAt
      });
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return id;
}

async function getAllSites() {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sites','readonly');
    const req = tx.objectStore('sites').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getSitePages(siteId) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('site_pages','readonly');
    const idx = tx.objectStore('site_pages').index('bySite');
    const req = idx.getAll(IDBKeyRange.only(siteId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Expose to service worker
self.getDb = getDb;
self.saveSinglePage = saveSinglePage;
self.getAllPages = getAllPages;
self.getPageByTs = getPageByTs;
self.saveSiteCollection = saveSiteCollection;
self.getAllSites = getAllSites;
self.getSitePages = getSitePages;