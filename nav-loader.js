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
      initLoadedNav();
    })
    .catch(err => {
      console.error('Nav load error:', err);
    });
});

function initLoadedNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const toggle = nav.querySelector('.site-nav__toggle');
  const menu = nav.querySelector('.site-nav__menu');
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  nav.querySelectorAll('a[href]').forEach(link => {
    const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href && href === path) link.classList.add('active');
  });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('is-open', !expanded);
    });
  }

  nav.querySelectorAll('.group-button').forEach(button => {
    button.addEventListener('click', () => {
      const group = button.closest('.tab-group');
      const isMobile = window.matchMedia('(max-width: 980px)').matches;
      if (!group || !isMobile) return;
      const open = group.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });
}
