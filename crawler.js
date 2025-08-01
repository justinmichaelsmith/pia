const DEFAULTS = {
  MAX_PAGES: 50,
  MAX_DEPTH: 2,
  DELAY_MS: 500,
  OBEY_ROBOTS: true
};

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function sameOrigin(a, b) {
  try { return new URL(a).origin === new URL(b).origin; } catch { return false; }
}

async function fetchRobotsTxt(origin) {
  try {
    const res = await fetch(new URL('/robots.txt', origin).href, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// extremely simple robots.txt Disallow parser (user-agent ignored for alpha)
function isDisallowed(robotsTxt, url) {
  if (!robotsTxt) return false;
  const u = new URL(url);
  const lines = robotsTxt.split('\n').map(l => l.trim());
  const disallows = lines
    .filter(l => /^disallow:/i.test(l))
    .map(l => l.split(':')[1]?.trim())
    .filter(Boolean);
  return disallows.some(rule => rule === '/' || u.pathname.startsWith(rule));
}

function extractLinks(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const anchors = [...doc.querySelectorAll('a[href]')];
  const urls = new Set();
  for (const a of anchors) {
    try {
      const u = new URL(a.getAttribute('href'), baseUrl);
      if (['http:', 'https:'].includes(u.protocol)) urls.add(u.href.split('#')[0]);
    } catch {}
  }
  return [...urls];
}

async function fetchText(url) {
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

async function fetchPage(url) {
  const html = await fetchText(url);
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : url;
  return { url, html, title, savedAt: Date.now() };
}

async function boundedBfs(startUrl, cfg) {
  const origin = new URL(startUrl).origin;
  const robotsTxt = cfg.OBEY_ROBOTS ? await fetchRobotsTxt(origin) : null;

  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const pages = [];

  while (queue.length && pages.length < cfg.MAX_PAGES) {
    const { url, depth } = queue.shift();

    if (visited.has(url)) continue;
    if (!sameOrigin(url, startUrl)) continue;
    if (cfg.OBEY_ROBOTS && isDisallowed(robotsTxt, url)) continue;

    visited.add(url);

    try {
      const page = await fetchPage(url);
      pages.push(page);

      if (depth < cfg.MAX_DEPTH) {
        const links = extractLinks(page.html, url);
        for (const next of links) {
          if (!visited.has(next) && sameOrigin(next, startUrl)) {
            queue.push({ url: next, depth: depth + 1 });
          }
        }
      }
      await sleep(cfg.DELAY_MS);
    } catch (e) {
      console.warn('Skip on error', url, e);
    }
  }

  return pages;
}

async function crawlSite(startUrl, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  return await boundedBfs(startUrl, cfg);
}

// Expose to service worker scope
self.crawlSite = crawlSite;