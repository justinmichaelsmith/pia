(async () => {
  const docClone = document.documentElement.cloneNode(true);
  const html = '<!DOCTYPE html>\n' + docClone.outerHTML;
  const title = document.title || 'Untitled Page';
  const timestamp = new Date().toISOString();

  const pageData = { html, title, timestamp };

  const db = await getDb();
  const tx = db.transaction('pages', 'readwrite');
  tx.objectStore('pages').add(pageData);
  tx.commit();

  alert('Page saved for offline viewing.');
})();
