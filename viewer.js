(async () => {
  const params = new URLSearchParams(window.location.search);
  const ts = params.get('ts');

  const db = await getDb();
  const tx = db.transaction('pages', 'readonly');
  const store = tx.objectStore('pages');
  const request = store.get(ts);
  request.onsuccess = () => {
    const data = request.result;
    if (data) {
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      document.getElementById('pageFrame').src = url;
    } else {
      document.body.innerHTML = 'Page not found.';
    }
  };
})();