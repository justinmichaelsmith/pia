(async () => {
  // MV3: use message roundtrip to background to read DB
  const params = new URLSearchParams(window.location.search);
  const ts = params.get('ts');
  if (!ts) {
    document.body.textContent = 'Missing page timestamp.';
    return;
  }

  function requestPage(ts) {
    return new Promise((resolve) => {
      chrome.runtime.onMessage.addListener(function handler(msg) {
        if (msg?.type === 'INTERNAL_GET_PAGE_RESULT' && msg.ts === ts) {
          chrome.runtime.onMessage.removeListener(handler);
          resolve(msg.data || null);
        }
      });
      chrome.runtime.sendMessage({ type: 'INTERNAL_GET_PAGE', ts });
    });
  }

  const page = await requestPage(ts);
  if (!page) { document.body.textContent = 'Page not found.'; return; }

  const blob = new Blob([page.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  document.getElementById('pageFrame').src = url;
})();
