/* Local concept interactions. No network requests or persistent data storage. */
(() => {
  'use strict';
  const menuToggle = document.querySelector('#menu-toggle');
  const portfolioNav = document.querySelector('#portfolio-navigation');
  let menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    portfolioNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  menuToggle.addEventListener('click', () => setMenu(!menuOpen));
  portfolioNav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) { setMenu(false); menuToggle.focus(); }
  });
  portfolioNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  const list = document.querySelector('#request-list');
  const rows = [...list.querySelectorAll('.request-row')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#request-search');
  const dialog = document.querySelector('#request-dialog');
  const replyForm = document.querySelector('#reply-form');
  const replyText = document.querySelector('#reply-text');
  const closeForm = document.querySelector('#close-form');
  const closeReason = document.querySelector('#close-reason');
  const closeButton = document.querySelector('#start-close');
  const feedback = document.querySelector('#request-feedback');
  const messages = document.querySelector('#sent-messages');
  let currentFilter = 'all';
  let activeRow = null;
  let opener = null;
  const drafts = new Map();
  const requestMessages = new Map();
  const scenarios = {
    'INC-2048': { team: 'IT support', message: 'Can you confirm which device you’re using? That will help us investigate.', description: 'My laptop loses its connection when I join a video call. It started this morning.' },
    'REQ-2041': { team: 'Software & access', message: 'We’re checking the access permissions for your design library. We’ll update you here.', description: 'I need access to the shared design library for my upcoming project.' },
    'REQ-2036': { team: 'Workplace', message: 'Your chair replacement request is with the workplace team for approval.', description: 'The adjustment mechanism on my office chair is no longer working.' },
    'INC-2029': { team: 'IT support', message: 'The display connection has been restored. This request is now closed.', description: 'The meeting room display was not connecting to laptops.' }
  };

  function updateCounts() {
    const counts = { all: rows.length, action: rows.filter(r => r.dataset.state === 'action').length, closed: rows.filter(r => r.dataset.state === 'closed').length };
    filters.forEach(button => { button.querySelector('span').textContent = counts[button.dataset.filter]; });
    document.querySelector('#active-count').textContent = rows.filter(r => r.dataset.state !== 'closed').length;
  }

  function filterRows() {
    const term = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const matchesState = currentFilter === 'all' || row.dataset.state === currentFilter;
      const matchesSearch = `${row.dataset.title} ${row.dataset.id}`.toLocaleLowerCase().includes(term);
      row.hidden = !(matchesState && matchesSearch);
      if (!row.hidden) visible++;
    });
    document.querySelector('#no-requests').hidden = visible !== 0;
    document.querySelector('#filter-status').textContent = `${visible} matching request${visible === 1 ? '' : 's'}.`;
  }

  filters.forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filters.forEach(b => { const selected = b === button; b.classList.toggle('is-selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    filterRows();
  }));
  search.addEventListener('input', filterRows);

  function addMessage(text, isClosure = false) {
    const entry = document.createElement('div');
    entry.className = 'message';
    const avatar = document.createElement('span');
    avatar.className = 'mini-avatar';
    avatar.textContent = isClosure ? '✓' : 'AS';
    const content = document.createElement('div');
    const author = document.createElement('strong');
    author.textContent = isClosure ? 'Alex · Request closed' : 'Alex · You';
    const body = document.createElement('p');
    body.textContent = text;
    content.append(author, body);
    entry.append(avatar, content);
    messages.append(entry);
  }

  function saveDraft() {
    if (activeRow) drafts.set(activeRow.dataset.id, { reply: replyText.value, reason: closeReason.value });
  }

  rows.forEach(row => row.addEventListener('click', () => {
    opener = row;
    activeRow = row;
    const id = row.dataset.id;
    const scenario = scenarios[id];
    document.querySelector('#dialog-title').textContent = row.dataset.title;
    document.querySelector('#dialog-reference').textContent = id;
    document.querySelector('#support-message').textContent = scenario.message;
    document.querySelector('#original-request').textContent = scenario.description;
    document.querySelector('.dialog-details dd').textContent = scenario.team;
    const badge = row.querySelector('.badge');
    const dialogStatus = document.querySelector('#dialog-status');
    dialogStatus.textContent = badge.textContent;
    dialogStatus.className = badge.className;
    replyText.value = drafts.get(id)?.reply || '';
    closeReason.value = drafts.get(id)?.reason || '';
    messages.replaceChildren();
    (requestMessages.get(id) || []).forEach(m => addMessage(m.text, m.closed));
    feedback.textContent = '';
    closeForm.hidden = true;
    closeButton.hidden = false;
    const closed = row.dataset.state === 'closed';
    replyForm.hidden = closed;
    closeButton.disabled = closed;
    closeButton.textContent = closed ? 'Request is closed' : 'Close this request';
    dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
    document.querySelector('#dismiss-dialog').focus();
  }));

  document.querySelector('#dismiss-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { saveDraft(); document.body.classList.remove('modal-open'); if (opener && !opener.hidden) opener.focus(); else filters.find(b => b.dataset.filter === currentFilter).focus(); });

  replyForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = replyText.value.trim();
    if (!text) { replyText.setCustomValidity('Please write a reply before sending.'); replyText.reportValidity(); return; }
    replyText.setCustomValidity('');
    const id = activeRow.dataset.id;
    const history = requestMessages.get(id) || [];
    history.push({ text, closed: false });
    requestMessages.set(id, history);
    addMessage(text);
    replyText.value = '';
    if (activeRow.dataset.state === 'action') {
      activeRow.dataset.state = 'progress';
      const badge = activeRow.querySelector('.badge');
      badge.className = 'badge progress';
      badge.textContent = 'In progress';
      activeRow.querySelector('.request-status small').textContent = 'Your reply is with IT support';
      document.querySelector('#dialog-status').className = badge.className;
      document.querySelector('#dialog-status').textContent = badge.textContent;
    }
    activeRow.querySelector('.request-updated').textContent = 'Just now';
    feedback.textContent = 'Reply added to this prototype. No message has been sent externally.';
    updateCounts();
    filterRows();
    replyText.focus();
  });
  replyText.addEventListener('input', () => replyText.setCustomValidity(''));

  closeButton.addEventListener('click', () => {
    closeForm.hidden = false;
    closeButton.hidden = true;
    // Reuse an unsent explanation instead of asking for the same text again.
    if (!closeReason.value.trim() && replyText.value.trim()) closeReason.value = replyText.value;
    closeReason.focus();
  });
  document.querySelector('#cancel-close').addEventListener('click', () => { closeForm.hidden = true; closeButton.hidden = false; closeButton.focus(); });
  closeForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = closeReason.value.trim() || replyText.value.trim() || 'Confirmed resolved.';
    const id = activeRow.dataset.id;
    const history = requestMessages.get(id) || [];
    history.push({ text, closed: true });
    requestMessages.set(id, history);
    addMessage(text, true);
    activeRow.dataset.state = 'closed';
    const badge = activeRow.querySelector('.badge');
    badge.className = 'badge closed';
    badge.textContent = 'Closed';
    activeRow.querySelector('.request-status small').textContent = 'Resolved and confirmed';
    activeRow.querySelector('.request-updated').textContent = 'Just now';
    document.querySelector('#dialog-status').className = badge.className;
    document.querySelector('#dialog-status').textContent = badge.textContent;
    replyText.value = '';
    closeReason.value = '';
    closeForm.hidden = true;
    replyForm.hidden = true;
    closeButton.hidden = false;
    closeButton.disabled = true;
    closeButton.textContent = 'Request is closed';
    feedback.textContent = 'Request closed in this prototype. Your explanation is saved in the conversation.';
    updateCounts();
    filterRows();
    document.querySelector('#dismiss-dialog').focus();
  });

  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) chapterLinks.forEach(link => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-12% 0px -65% 0px', threshold: 0 });
    chapterLinks.forEach(link => observer.observe(document.querySelector(link.hash)));
  }
  updateCounts();
})();
