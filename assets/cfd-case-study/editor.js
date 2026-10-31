/* Browser-local authoring tools. No server writes or automatic publishing. */
(() => {
  'use strict';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function createHistory(initial, limit = 60) {
    let states = [clone(initial)];
    let position = 0;
    return {
      current: () => clone(states[position]),
      canUndo: () => position > 0,
      canRedo: () => position < states.length - 1,
      commit(next) {
        if (JSON.stringify(next) === JSON.stringify(states[position])) return false;
        states = states.slice(0, position + 1);
        states.push(clone(next));
        if (states.length > limit) states.shift();
        position = states.length - 1;
        return true;
      },
      undo() { if (position > 0) position--; return clone(states[position]); },
      redo() { if (position < states.length - 1) position++; return clone(states[position]); }
    };
  }

  function normalizeState(input, baseline) {
    const result = clone(baseline);
    if (!input || typeof input !== 'object') return result;
    Object.keys(result.fields).forEach(id => {
      const value = input.fields?.[id];
      if (typeof value === 'string' && value.length <= 20000) result.fields[id] = value;
    });
    Object.keys(result.sections).forEach(id => {
      if (typeof input.sections?.[id] === 'boolean') result.sections[id] = input.sections[id];
    });
    return result;
  }

  // The state model can be checked independently of browser layout.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createHistory, normalizeState };
    return;
  }

  const enabled = document.body.hasAttribute('data-editor-enabled') || new URLSearchParams(location.search).get('edit') === '1';
  if (!enabled) return;
  const main = document.querySelector('#main');
  if (!main) return;
  const fieldSelector = 'h1,h2,h3,h4,p,figcaption,dt,dd,.eyebrow,.mini-label,.implication,.scope-note>strong,.tradeoff>strong,.journey strong,.comparison th,.comparison td,.target-grid article>strong';
  const fields = [...main.querySelectorAll(fieldSelector)].filter(element =>
    !element.closest('.portal,.site-footer,.chapter-nav') &&
    !element.parentElement.closest(fieldSelector) && element.textContent.trim()
  );
  const sections = [...main.children].filter(element =>
    (element.tagName === 'SECTION' && !element.classList.contains('hero')) || element.matches('figure.hero-stage')
  );
  fields.forEach((element, index) => { element.dataset.editId = `field-${index}`; });
  sections.forEach((element, index) => { element.dataset.editSection = `section-${index}`; });
  const baseline = {
    fields: Object.fromEntries(fields.map(element => [element.dataset.editId, element.innerHTML])),
    sections: Object.fromEntries(sections.map(element => [element.dataset.editSection, !element.hidden]))
  };
  // Keep export source separate from live prototype replies, filters, and dialogs.
  const pristine = document.documentElement.cloneNode(true);
  const history = createHistory(baseline);
  const storageKey = `cfd-page-editor:v1:${location.pathname}`;
  let fingerprint = 2166136261;
  for (const character of JSON.stringify(baseline)) fingerprint = Math.imul(fingerprint ^ character.charCodeAt(0), 16777619) >>> 0;
  let editing = false;
  let persistTimer;
  let resetPending = false;
  let busy = false;
  let canPersist = true;

  const toolbar = document.createElement('aside');
  toolbar.className = 'page-editor';
  toolbar.setAttribute('aria-label', 'Page editing tools');
  toolbar.innerHTML = `<button type="button" class="editor-launch" aria-expanded="false">Edit page <span aria-hidden="true">✎</span></button>
    <div class="editor-workspace" hidden>
      <div class="editor-heading"><strong>Page editor</strong><button type="button" data-action="done" class="editor-done">Done editing</button></div>
      <p class="editor-instructions">Click a heading or paragraph to edit it. Enter adds a line break. Use Sections to show or hide sections.</p>
      <div class="editor-actions" role="group" aria-label="Editing actions">
        <button type="button" data-action="undo" disabled>Undo</button><button type="button" data-action="redo" disabled>Redo</button>
        <details class="editor-section-menu"><summary>Sections</summary><div class="editor-section-options"></div></details>
        <button type="button" data-action="reset">Reset</button>
        <button type="button" data-action="download" class="editor-download">Download page</button>
        <button type="button" data-action="editable">Save editable copy</button>
      </div>
      <p class="editor-status" role="status">Changes stay in this browser. Download the page to keep a publishable copy.</p>
      <p class="editor-help">Download page creates a clean HTML file. Save editable copy keeps these editing tools. Neither updates your live website.</p>
    </div>`;
  document.body.append(toolbar);
  const launch = toolbar.querySelector('.editor-launch');
  const workspace = toolbar.querySelector('.editor-workspace');
  const status = toolbar.querySelector('.editor-status');
  const resetButton = toolbar.querySelector('[data-action="reset"]');
  const options = toolbar.querySelector('.editor-section-options');

  function cleanInline(value) {
    const template = document.createElement('template');
    template.innerHTML = value;
    const output = document.createElement('div');
    const allowed = new Set(['STRONG', 'B', 'EM', 'I', 'BR', 'SPAN']);
    function visit(node, parent) {
      if (node.nodeType === Node.TEXT_NODE) { parent.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].includes(node.tagName)) return;
      let target = parent;
      if (allowed.has(node.tagName)) {
        target = document.createElement(node.tagName.toLowerCase());
        if (node.tagName === 'SPAN') {
          const className = node.getAttribute('class');
          if (className && /^[a-zA-Z0-9 _-]{1,120}$/.test(className)) target.className = className;
          if (node.getAttribute('aria-hidden') === 'true') target.setAttribute('aria-hidden', 'true');
        }
        parent.append(target);
      }
      if (node.tagName === 'DIV' || node.tagName === 'P') {
        if (parent.childNodes.length) parent.append(document.createElement('br'));
      }
      [...node.childNodes].forEach(child => visit(child, target));
    }
    [...template.content.childNodes].forEach(node => visit(node, output));
    return output.innerHTML;
  }

  function getState() {
    return {
      fields: Object.fromEntries(fields.map(element => [element.dataset.editId, cleanInline(element.innerHTML)])),
      sections: Object.fromEntries(sections.map(element => [element.dataset.editSection, !element.hidden]))
    };
  }

  function updateLinks(root, state) {
    root.querySelectorAll('a[href^="#"]').forEach(link => {
      const target = root.querySelector(link.getAttribute('href'));
      if (target?.dataset.editSection && Object.hasOwn(state.sections, target.dataset.editSection)) link.hidden = !state.sections[target.dataset.editSection];
    });
  }

  function applyState(root, raw) {
    const state = normalizeState(raw, baseline);
    root.querySelectorAll('[data-edit-id]').forEach(element => {
      if (Object.hasOwn(state.fields, element.dataset.editId)) element.innerHTML = cleanInline(state.fields[element.dataset.editId]);
    });
    root.querySelectorAll('[data-edit-section]').forEach(element => { element.hidden = !state.sections[element.dataset.editSection]; });
    updateLinks(root, state);
  }

  function updateControls() {
    toolbar.querySelector('[data-action="undo"]').disabled = !history.canUndo();
    toolbar.querySelector('[data-action="redo"]').disabled = !history.canRedo();
    options.querySelectorAll('input').forEach(input => {
      const element = sections.find(section => section.dataset.editSection === input.value);
      input.checked = !element.hidden;
    });
  }

  function persist() {
    clearTimeout(persistTimer);
    const state = getState();
    try {
      if (JSON.stringify(state) === JSON.stringify(baseline)) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ version: 1, fingerprint, state }));
      canPersist = true;
      status.textContent = 'Draft saved in this browser. Download the page when you’re ready.';
    } catch {
      canPersist = false;
      status.textContent = 'Browser saving is unavailable here. Download an editable copy before closing.';
    }
  }

  function commit() {
    if (history.commit(getState())) { updateControls(); persist(); }
  }

  function setEditing(value) {
    if (!value) { document.activeElement?.blur(); commit(); }
    editing = value;
    document.body.classList.toggle('page-editing', value);
    launch.hidden = value;
    launch.setAttribute('aria-expanded', String(value));
    workspace.hidden = !value;
    fields.forEach(element => {
      if (value) { element.setAttribute('contenteditable', 'true'); element.setAttribute('spellcheck', 'true'); }
      else { element.removeAttribute('contenteditable'); element.removeAttribute('spellcheck'); }
    });
    if (value) toolbar.querySelector('[data-action="done"]').focus();
    else launch.focus();
  }

  sections.forEach(element => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.value = element.dataset.editSection; checkbox.checked = !element.hidden;
    const text = document.createElement('span');
    text.textContent = element.matches('figure') ? 'Interactive prototype' : element.querySelector('h2')?.textContent.replace(/\s+/g, ' ').trim() || 'Section';
    label.append(checkbox, text); options.append(label);
    checkbox.addEventListener('change', () => {
      element.hidden = !checkbox.checked;
      updateLinks(document, getState());
      commit();
    });
  });

  function insertPlainText(text) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const anchor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!anchor?.closest('[contenteditable="true"][data-edit-id]')) return;
    const fragment = document.createDocumentFragment();
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    lines.forEach((line, index) => { if (index) fragment.append(document.createElement('br')); fragment.append(document.createTextNode(line)); });
    const end = document.createTextNode(''); fragment.append(end);
    range.deleteContents(); range.insertNode(fragment); range.setStartAfter(end); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
  }

  fields.forEach(element => {
    element.addEventListener('paste', event => { if (!editing) return; event.preventDefault(); insertPlainText(event.clipboardData.getData('text/plain')); commit(); });
    element.addEventListener('drop', event => { if (editing) event.preventDefault(); });
    element.addEventListener('keydown', event => {
      if (editing && event.key === 'Enter') { event.preventDefault(); insertPlainText('\n'); toolbar.querySelector('[data-action="undo"]').disabled = false; clearTimeout(persistTimer); persistTimer = setTimeout(persist, 500); }
    });
    element.addEventListener('input', () => {
      if (!editing) return;
      resetPending = false; resetButton.textContent = 'Reset';
      status.textContent = 'Editing…';
      toolbar.querySelector('[data-action="undo"]').disabled = false;
      toolbar.querySelector('[data-action="redo"]').disabled = true;
      clearTimeout(persistTimer); persistTimer = setTimeout(persist, 500);
    });
    element.addEventListener('blur', () => { if (editing) { element.innerHTML = cleanInline(element.innerHTML); commit(); } });
  });

  async function dataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
    });
  }

  async function checkedFetch(url) {
    const response = await fetch(new URL(url, location.href));
    if (!response.ok) throw new Error(`Could not include ${url}`);
    return response;
  }

  async function buildExport(keepEditor) {
    const state = getState();
    const copy = pristine.cloneNode(true);
    applyState(copy, state);
    if (keepEditor) copy.querySelector('body').setAttribute('data-editor-enabled', '');
    else {
      copy.querySelector('body').removeAttribute('data-editor-enabled');
      copy.querySelectorAll('[data-editor-resource]').forEach(element => element.remove());
    }
    for (const link of [...copy.querySelectorAll('link[rel="stylesheet"]')]) {
      const style = document.createElement('style');
      style.textContent = await (await checkedFetch(link.getAttribute('href'))).text();
      if (link.hasAttribute('data-editor-resource')) style.setAttribute('data-editor-resource', '');
      link.replaceWith(style);
    }
    for (const script of [...copy.querySelectorAll('script[src]')]) {
      const code = await (await checkedFetch(script.getAttribute('src'))).text();
      const inline = document.createElement('script');
      inline.textContent = code.replace(/<\/script/gi, '<\\/script');
      if (script.hasAttribute('data-editor-resource')) inline.setAttribute('data-editor-resource', '');
      script.remove();
      copy.querySelector('body').append(inline);
    }
    for (const image of [...copy.querySelectorAll('img[src]')]) {
      const source = image.getAttribute('src');
      if (source.startsWith('data:')) continue;
      image.setAttribute('src', await dataUrl(await (await checkedFetch(source)).blob()));
    }
    copy.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href.startsWith('#') || /^(https?:|data:|mailto:|tel:)/i.test(href)) return;
      link.setAttribute('href', new URL(href, 'https://ssinghdesign.com/').href);
    });
    copy.querySelectorAll('[data-edit-id],[data-edit-section]').forEach(element => { element.removeAttribute('data-edit-id'); element.removeAttribute('data-edit-section'); });
    // Inline scripts execute at the end of body; the export contains no toolbar or live sample activity.
    return '<!doctype html>\n' + copy.outerHTML;
  }

  async function download(keepEditor) {
    if (busy) return;
    document.activeElement?.blur(); commit(); busy = true;
    toolbar.querySelectorAll('button').forEach(button => { button.disabled = true; });
    status.textContent = 'Preparing your HTML file…';
    try {
      const html = await buildExport(keepEditor);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = keepEditor ? 'CFD-Case-Study-Editable.html' : 'page12.html';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = keepEditor ? 'Editable copy downloaded. Open it in your browser to continue later.' : 'Clean page downloaded as page12.html. Upload it to your website when ready.';
    } catch (error) {
      status.textContent = 'Download could not finish. Your edits are still here; save the draft and try again.';
      console.error('Page export failed:', error);
    } finally {
      busy = false; toolbar.querySelectorAll('button').forEach(button => { button.disabled = false; }); updateControls();
    }
  }

  launch.addEventListener('click', () => setEditing(true));
  toolbar.querySelector('[data-action="done"]').addEventListener('click', () => setEditing(false));
  toolbar.querySelector('[data-action="undo"]').addEventListener('click', () => { commit(); applyState(document, history.undo()); updateControls(); persist(); });
  toolbar.querySelector('[data-action="redo"]').addEventListener('click', () => { applyState(document, history.redo()); updateControls(); persist(); });
  resetButton.addEventListener('click', () => {
    commit();
    if (!resetPending) { resetPending = true; resetButton.textContent = 'Confirm reset'; status.textContent = 'Click Confirm reset to restore this file’s original text and sections. You can undo the reset.'; return; }
    applyState(document, baseline); history.commit(baseline); updateControls(); persist();
    resetPending = false; resetButton.textContent = 'Reset'; status.textContent = 'Original text and sections restored. Undo is available.';
  });
  toolbar.querySelector('[data-action="download"]').addEventListener('click', () => download(false));
  toolbar.querySelector('[data-action="editable"]').addEventListener('click', () => download(true));
  window.addEventListener('beforeunload', event => {
    persist();
    if (!canPersist && JSON.stringify(getState()) !== JSON.stringify(baseline)) { event.preventDefault(); event.returnValue = ''; }
  });
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey));
    if (draft?.version === 1 && draft.fingerprint === fingerprint) {
      applyState(document, draft.state); history.commit(getState()); updateControls();
      status.textContent = 'Your local draft was restored. Choose Edit page to continue.';
      launch.textContent = 'Edit page · Draft restored';
    }
  } catch { canPersist = false; }
})();
