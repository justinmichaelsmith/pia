window.onload = async () => {
  const pages = await getAllPages();
  const list = document.getElementById('pageList');

  if (pages.length === 0) {
    list.innerHTML = '<li>No saved pages yet.</li>';
    return;
  }

  pages.forEach(page => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="viewer.html?ts=${page.timestamp}" target="_blank">${page.title}</a>`;
    list.appendChild(li);
  });
};
