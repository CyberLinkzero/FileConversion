// nav-loader.js
document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.querySelector('[data-nav-placeholder]');
  if (!placeholder) return;

  fetch('nav.html')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load nav.html');
      return res.text();
    })
    .then(html => {
      placeholder.outerHTML = html;
    })
    .catch(err => {
      console.error('Nav load error:', err);
    });
});
