/* Scroll-reveal animations for the portfolio.
   Load this in <head> (before the body paints) so target elements start
   hidden with no flicker. Elements then rise/fade/slide in as they enter
   the viewport, staggered so groups cascade. Self-contained: injects its
   own CSS, respects prefers-reduced-motion, degrades gracefully without JS
   or IntersectionObserver. */
(function () {
  var docEl = document.documentElement;

  // --- Runs immediately (script is in <head>) so the hidden state is in
  //     place before the body paints -> no flash of un-animated content. ---
  docEl.classList.add('reveal-js');

  var hideSelectors = [
    '.features3 .item',
    '.gallery2 .item',
    '.testimonials1 .mbr-section-title',
    '.testimonials1 .image-wrapper',
    '.testimonials1 .text-wrapper',
    '.slider6 .mbr-section-head',
    '.slider6 .embla'
  ];

  if (!document.getElementById('reveal-anim-style')) {
    var hidden = hideSelectors.map(function (s) { return 'html.reveal-js ' + s; }).join(',');
    var css = ''
      // start hidden before first paint
      + hidden + '{opacity:0;}'
      // transition-based reveal (cards + carousels)
      + '.rv{transform:translateY(32px) scale(.985);'
      + 'transition:opacity .7s cubic-bezier(.2,0,0,1),transform .7s cubic-bezier(.2,0,0,1);'
      + 'will-change:opacity,transform;}'
      + '.rv.rv-in{opacity:1 !important;transform:none !important;}'
      // keyframe-based reveal (About Me intro: reliably replays, no snap)
      + '@keyframes rvUp{from{opacity:0;transform:translateY(34px) scale(.98)}to{opacity:1;transform:none}}'
      + '@keyframes rvLeft{from{opacity:0;transform:translateX(-42px) scale(.95)}to{opacity:1;transform:none}}'
      + '.rvl.rvl-in{animation:rvUp .8s cubic-bezier(.2,0,0,1) both;}'
      + '.rvl.rvl-img.rvl-in{animation:rvLeft .9s cubic-bezier(.2,0,0,1) both;}'
      // reduced motion: show everything, no movement
      + '@media (prefers-reduced-motion: reduce){'
      +   hidden + '{opacity:1 !important;}'
      +   'html.reveal-js .rv,html.reveal-js .rvl{opacity:1 !important;transform:none !important;'
      +   'animation:none !important;transition:none !important;}}';
    var st = document.createElement('style');
    st.id = 'reveal-anim-style';
    st.textContent = css;
    (document.head || docEl).appendChild(st);
  }

  function init() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var targets = [];
    function add(sel) {
      var list = document.querySelectorAll(sel);
      for (var i = 0; i < list.length; i++) {
        if (targets.indexOf(list[i]) === -1) targets.push(list[i]);
      }
    }
    add('.features3 .item');
    add('.gallery2 .item');
    add('.testimonials1 .mbr-section-title');
    add('.testimonials1 .image-wrapper');
    add('.testimonials1 .text-wrapper');
    add('.slider6 .mbr-section-head');
    add('.slider6 .embla');

    if (!targets.length) { docEl.classList.remove('reveal-js'); return; }

    // Per-group stagger counters.
    var counts = [];
    function nextIndex(key) {
      for (var i = 0; i < counts.length; i++) if (counts[i].k === key) return counts[i].n++;
      counts.push({ k: key, n: 1 });
      return 0;
    }

    targets.forEach(function (el) {
      var section = el.closest ? el.closest('.testimonials1') : null;
      if (section) {
        // About Me intro: keyframe reveal, cascade within the section
        el.classList.add('rvl');
        if (el.classList.contains('image-wrapper')) el.classList.add('rvl-img');
        el.style.animationDelay = (nextIndex(section) * 110) + 'ms';
      } else {
        // Cards / carousels: transition reveal, cascade within the row
        el.classList.add('rv');
        el.style.transitionDelay = (nextIndex(el.parentElement) * 95) + 'ms';
      }
    });

    function reveal(el) { el.classList.add('rv-in', 'rvl-in'); }

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
