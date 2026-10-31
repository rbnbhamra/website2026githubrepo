(() => {
  'use strict';
  const toggle = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#portfolio-navigation');
  function closeNavigation() {
    navigation.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeNavigation(); toggle.focus();
    }
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeNavigation();
  });
  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        chapterLinks.forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    chapterLinks.forEach(link => observer.observe(document.querySelector(link.hash)));
  }
  const control = document.querySelector('#scrollToTop');
  const root = document.documentElement;
  const body = document.body;
  function update() {
    const position = root.scrollTop || body.scrollTop || window.scrollY || 0;
    const height = Math.max(body.scrollHeight, root.scrollHeight, body.offsetHeight, root.offsetHeight, body.clientHeight, root.clientHeight);
    control.hidden = !(position > height / 2 - root.clientHeight / 2 || position > window.innerHeight);
  }
  control.querySelector('button').addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,left:0,behavior:reduce ? 'instant' : 'smooth'});
  });
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  window.addEventListener('load',update);
  window.addEventListener('pageshow',update);
  update();
})();
