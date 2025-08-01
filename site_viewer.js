(async () => {
  const qs = new URLSearchParams(location.search);
  const siteId = qs.get('id');
  if (!siteId) { document.body.textContent = 'No site id.'; return; }

  function requestSites() {
    return new Promise((resolve) => {
      chrome.runtime.onMessage.addListener(function handler(msg) {
        if (msg?.type === 'INTERNAL_LIST_SITES_RESULT') {
          chrome.runtime.onMessage.removeListener(handler);
          resolve(msg.data || []);
        }
      });
      chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_SITES' });
    });
  }

  function requestSitePages(siteId) {
    return new Promise((resolve) => {
      chrome.runtime.onMessage.addListener(function handler(msg) {
        if (msg?.type === 'INTERNAL_LIST_SITE_PAGES_RESULT' && msg.siteId === siteId) {
          chrome.runtime.onMessage.removeListener(handler);
          resolve(msg.data || []);
        }
      });
      chrome.runtime.sendMessage({ type: 'INTERNAL_LIST_SITE_PAGES', siteId });
    });
  }

  const sites = await requestSites();
  const site = sites.find(s => s.id === siteId);
  document.getElementById('siteTitle').textContent = site ? site.title : siteId;

  let pages = await requestSitePages(siteId);
  const list = document.getElementById('urlList');
  const frame = document.getElementById('frame');
  const filter = document.getElementById('filter');

  function render(items) {
    list.innerHTML = '';
    items.forEach(p => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = p.url;
      a.onclick = async (e) => {
        e.preventDefault();
        const blob = new Blob([p.html], { type: 'text/html' });
        frame.src = URL.createObjectURL(blob);
      };
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  render(pages);
  filter.addEventListener('input', () => {
    const q = filter.value.toLowerCase();
    render(pages.filter(p => p.url.toLowerCase().includes(q)));
  });
})();