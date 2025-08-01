// Runs in page, serializes the DOM, then asks background to save it.
(() => {
  try {
    const docClone = document.documentElement.cloneNode(true);
    const html = '<!DOCTYPE html>\n' + docClone.outerHTML;
    const title = document.title || 'Untitled Page';
    const url = location.href;

    chrome.runtime.sendMessage({
      type: 'SAVE_PAGE',
      payload: { html, title, url }
    }, () => {
      // optional callback
    });

    alert('WebNest: page queued for save.');
  } catch (e) {
    alert('WebNest: failed to save this page.');
    console.error(e);
  }
})();