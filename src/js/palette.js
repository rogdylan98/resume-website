/* ==========================================================================
   ⌘K command palette — WAI-ARIA combobox + listbox inside a modal <dialog>.
   Opens on ⌘K / Ctrl+K and on document 'site:palette'.
   Capture mode: hidden unless the URL has &palette (optionally &palette=<query>).
   ========================================================================== */
(() => {
  const EMAIL = 'rdylan.silva@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/rdylan-silva';
  const RESUME = 'assets/Dylan_Silva_Resume.pdf';

  /* 16px stroke glyphs, drawn for this palette. */
  const ICON = {
    section: '<path d="M3 4.5h10M3 8h10M3 11.5h6"/>',
    role: '<rect x="2.5" y="5" width="11" height="8" rx="1.5"/><path d="M6 5V3.75c0-.4.35-.75.75-.75h2.5c.4 0 .75.35.75.75V5"/>',
    copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.75c0-.7-.55-1.25-1.25-1.25h-5.5c-.7 0-1.25.55-1.25 1.25v5.5c0 .7.55 1.25 1.25 1.25H5.5"/>',
    download: '<path d="M8 2.5v8M4.5 7l3.5 3.5L11.5 7M3 13.5h10"/>',
    external: '<path d="M6.5 3H3.75C3.3 3 3 3.3 3 3.75v8.5c0 .45.3.75.75.75h8.5c.45 0 .75-.3.75-.75V9.5M9 3h4v4M13 3L7.5 8.5"/>',
    theme: '<circle cx="8" cy="8" r="5.25"/><path d="M8 2.75v10.5A5.25 5.25 0 0 0 8 2.75z" fill="currentColor"/>',
    print: '<path d="M4.5 6V2.5h7V6M4.5 11.5h-1A1 1 0 0 1 2.5 10.5V7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1"/><path d="M4.5 9.5h7v4h-7z"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  /* Command registry. Every label/keyword comes from CONTENT.md. */
  const COMMANDS = [
    { group: 'Navigate', id: 'nav-hero', icon: 'section', title: 'Introduction', meta: '01', href: '#hero', keys: 'hero home top dylan silva about' },
    { group: 'Navigate', id: 'nav-impact', icon: 'section', title: 'Impact', meta: '02', href: '#impact', keys: 'metrics exhibits stp numbers results' },
    { group: 'Navigate', id: 'nav-experience', icon: 'section', title: 'Experience', meta: '03', href: '#experience', keys: 'work history roles career' },
    { group: 'Navigate', id: 'xp-accenture', icon: 'role', title: 'Accenture', sub: 'Technology Architecture Consultant', meta: '2025 — Now', href: '#xp-accenture', xp: 'accenture', indent: true, keys: 'consultant ai stp automation workflow' },
    { group: 'Navigate', id: 'xp-boeing', icon: 'role', title: 'Boeing', sub: 'Solutions Engineer', meta: '2023 — 25', href: '#xp-boeing', xp: 'boeing', indent: true, keys: 'cloud platform engineer requirements' },
    { group: 'Navigate', id: 'xp-nisum', icon: 'role', title: 'Nisum', sub: 'Software Consultant', meta: '2022', href: '#xp-nisum', xp: 'nisum', indent: true, keys: 'kafka python sql pipelines data' },
    { group: 'Navigate', id: 'xp-appacademy', icon: 'role', title: 'App Academy', sub: 'Web Developer (Internship)', meta: '2021 — 22', href: '#xp-appacademy', xp: 'appacademy', indent: true, keys: 'react redux javascript full-stack' },
    { group: 'Navigate', id: 'xp-saight', icon: 'role', title: 'Saight Dev', sub: 'Web Developer (Contract)', meta: '2020 — 21', href: '#xp-saight', xp: 'saight', indent: true, keys: 'web developer contract discovery' },
    { group: 'Navigate', id: 'nav-capabilities', icon: 'section', title: 'Capabilities', meta: '04', href: '#capabilities', keys: 'skills education university texas austin economics' },
    { group: 'Navigate', id: 'nav-contact', icon: 'section', title: 'Contact', meta: '05', href: '#contact', keys: 'email phone linkedin reach' },
    { group: 'Actions', id: 'act-copy', icon: 'copy', title: 'Copy email address', meta: EMAIL, run: 'copy', keys: 'email clipboard mail contact' },
    { group: 'Actions', id: 'act-resume', icon: 'download', title: 'Download résumé', meta: 'PDF', run: 'resume', keys: 'resume cv pdf download' },
    { group: 'Actions', id: 'act-linkedin', icon: 'external', title: 'Open LinkedIn', meta: 'in/rdylan-silva', run: 'linkedin', keys: 'linkedin profile social' },
    { group: 'Actions', id: 'act-theme', icon: 'theme', title: 'Switch to dark theme', meta: 'Theme', run: 'theme', keys: 'theme dark light mode appearance toggle' },
    { group: 'Actions', id: 'act-print', icon: 'print', title: 'Print résumé view', meta: 'PDF / Paper', run: 'print', keys: 'print resume paper pdf' },
  ];
  const GROUPS = ['Navigate', 'Actions'];

  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const SEP = /[\s\-—(/.@]/;
  const isWordStart = (t, i) => i === 0 || SEP.test(t[i - 1]);

  /**
   * Fuzzy match q against text → { score, idx[] } | null.
   * 1) contiguous substring (best when it starts a word);
   * 2) otherwise a subsequence whose first char starts a word, rewarded for
   *    word-start hits and consecutive runs, penalised for gaps. Loose,
   *    scattered matches are rejected so highlights always read as intentional.
   */
  function fuzzy(q, text, { prefixOnly = false } = {}) {
    const t = fold(text);
    if (!q) return { score: 0, idx: [] };
    const range = (s) => Array.from({ length: q.length }, (_, i) => s + i);
    // Prefer a word-start substring, then any substring.
    let sub = -1;
    for (let i = t.indexOf(q); i >= 0; i = t.indexOf(q, i + 1)) { if (isWordStart(t, i)) { sub = i; break; } }
    if (sub >= 0) return { score: 1200 - sub * 2 + (sub === 0 ? 150 : 0), idx: range(sub) };
    if (prefixOnly) return null;
    const anySub = t.indexOf(q);
    if (anySub >= 0 && q.length >= 3) return { score: 700 - anySub * 2, idx: range(anySub) };

    const chars = q.replace(/ /g, '');
    if (chars.length < 2) return null;
    const idx = [];
    let score = 0, prev = -1, from = 0;
    for (let qi = 0; qi < chars.length; qi++) {
      const c = chars[qi];
      // Prefer the next word-start occurrence over a mid-word one.
      let found = -1, ws = -1;
      for (let i = from; i < t.length; i++) {
        if (t[i] !== c) continue;
        if (found < 0) found = i;
        if (isWordStart(t, i)) { ws = i; break; }
      }
      if (found < 0) return null;
      const pick = (prev >= 0 && found === prev + 1) ? found : (ws >= 0 ? ws : found);
      if (qi === 0 && !isWordStart(t, pick)) return null;
      const run = pick === prev + 1;
      const atWord = isWordStart(t, pick);
      if (!run && !atWord && pick - prev > 3) return null; // scattered mid-word jump → noise
      score += 10 + (run ? 18 : 0) + (atWord ? 14 : 0) - Math.min(pick - prev - 1, 6);
      idx.push(pick); prev = pick; from = pick + 1;
    }
    return { score: score * 2, idx };
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function highlight(text, idx) {
    if (!idx || !idx.length) return esc(text);
    const set = new Set(idx);
    let out = '', open = false;
    for (let i = 0; i < text.length; i++) {
      const hit = set.has(i);
      if (hit && !open) { out += '<mark>'; open = true; }
      if (!hit && open) { out += '</mark>'; open = false; }
      out += esc(text[i]);
    }
    return out + (open ? '</mark>' : '');
  }

  const init = (Site) => {
    const dlg = document.getElementById('palette');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const input = dlg.querySelector('#palette-input');
    const list = dlg.querySelector('#palette-list');
    const count = dlg.querySelector('#palette-count');
    const empty = dlg.querySelector('[data-palette-empty]');
    const emptyQ = dlg.querySelector('[data-palette-q]');
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

    let results = [];
    let active = 0;
    let lastFocus = null;
    let closing = false;

    const themeCmd = COMMANDS.find((c) => c.id === 'act-theme');
    const syncThemeLabel = () => {
      themeCmd.title = Site.getTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    };

    function search(raw) {
      const q = fold(raw.trim()).replace(/\s+/g, ' ');
      const out = [];
      COMMANDS.forEach((c, order) => {
        if (!q) { out.push({ c, score: 0, idx: [], order }); return; }
        const mt = fuzzy(q, c.title);
        const ms = c.sub ? fuzzy(q, c.sub, { prefixOnly: true }) : null;
        const mk = fuzzy(q, c.keys, { prefixOnly: true });
        let best = null;
        if (mt) best = { score: mt.score + 50, idx: mt.idx, subIdx: [] };
        if (ms && (!best || ms.score * 0.8 > best.score)) best = { score: ms.score * 0.8, idx: [], subIdx: ms.idx };
        if (mk && (!best || mk.score * 0.5 > best.score)) best = { score: mk.score * 0.5, idx: [], subIdx: [] };
        if (best) out.push({ c, order, ...best });
      });
      if (q) out.sort((a, b) => (GROUPS.indexOf(a.c.group) - GROUPS.indexOf(b.c.group)) || (b.score - a.score) || (a.order - b.order));
      return out;
    }

    function render() {
      syncThemeLabel();
      const q = input.value;
      results = search(q);
      // When filtering, the best-scoring match (any group) becomes active.
      if (q.trim() && results.length) {
        let bi = 0;
        results.forEach((r, i) => { if (r.score > results[bi].score) bi = i; });
        active = bi;
      } else {
        active = Math.min(active, Math.max(0, results.length - 1));
      }
      let html = '';
      GROUPS.forEach((g) => {
        const rows = results.map((r, i) => [r, i]).filter(([r]) => r.c.group === g);
        if (!rows.length) return;
        html += `<div class="palette__group" role="group" aria-labelledby="palette-g-${g}">`;
        html += `<p class="palette__group-label" id="palette-g-${g}" role="presentation">${g}</p>`;
        rows.forEach(([r, i]) => {
          const c = r.c;
          html += `<div class="palette__item${c.indent ? ' palette__item--indent' : ''}" role="option" id="palette-opt-${c.id}" data-i="${i}" aria-selected="false">`
            + `<span class="palette__icon">${svg(c.icon)}</span>`
            + `<span class="palette__text"><span class="palette__title">${highlight(c.title, r.idx)}</span>`
            + (c.sub ? `<span class="palette__sub">${highlight(c.sub, r.subIdx)}</span>` : '')
            + `</span>`
            + `<span class="palette__meta">${esc(c.meta || '')}</span>`
            + `<span class="palette__enter" aria-hidden="true">↵</span>`
            + `</div>`;
        });
        html += '</div>';
      });
      list.innerHTML = html;
      const n = results.length;
      empty.hidden = n > 0;
      list.hidden = n === 0;
      emptyQ.textContent = q.trim();
      count.textContent = n === 0 ? 'No results' : `${n} ${n === 1 ? 'result' : 'results'}`;
      setActive(active, false);
    }

    function setActive(i, scroll = true) {
      if (!results.length) { input.removeAttribute('aria-activedescendant'); return; }
      active = (i + results.length) % results.length;
      list.querySelectorAll('.palette__item').forEach((el) => {
        const on = Number(el.dataset.i) === active;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', String(on));
        if (on) {
          input.setAttribute('aria-activedescendant', el.id);
          if (scroll) el.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function open(query = '') {
      if (dlg.open) { input.focus(); input.select(); return; }
      lastFocus = document.activeElement;
      input.value = query;
      active = 0;
      render();
      dlg.classList.remove('is-closing');
      dlg.showModal();
      input.focus();
      list.scrollTop = 0;
    }

    function close(afterClose) {
      if (!dlg.open || closing) { if (afterClose) afterClose(); return; }
      const done = () => {
        closing = false;
        dlg.classList.remove('is-closing');
        dlg.close();
        if (afterClose) afterClose();
        else if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
      };
      if (Site.reducedMotion) { done(); return; }
      closing = true;
      dlg.classList.add('is-closing');
      setTimeout(done, 130);
    }

    function goTo(cmd) {
      const target = document.querySelector(cmd.href);
      if (!target) { location.hash = cmd.href; return; }
      target.scrollIntoView({ behavior: Site.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', cmd.href);
      if (cmd.xp) { // brief evidence pulse on the role, without clobbering a newer highlight
        Site.highlightEvidence(cmd.xp);
        setTimeout(() => { if (document.documentElement.getAttribute('data-evidence') === cmd.xp) Site.highlightEvidence(null); }, 1800);
      }
    }

    async function runAction(cmd) {
      switch (cmd.run) {
        case 'copy': {
          const btn = document.querySelector('[data-contact-copy]');
          if (btn) { btn.click(); return; }
          try { await navigator.clipboard.writeText(EMAIL); document.dispatchEvent(new CustomEvent('site:toast', { detail: { message: `Copied ${EMAIL}` } })); }
          catch (e) { location.href = `mailto:${EMAIL}`; }
          return;
        }
        case 'resume': {
          const a = document.createElement('a');
          a.href = RESUME; a.download = 'Dylan_Silva_Resume.pdf';
          document.body.appendChild(a); a.click(); a.remove();
          return;
        }
        case 'linkedin': window.open(LINKEDIN, '_blank', 'noopener'); return;
        case 'theme': Site.toggleTheme(); document.dispatchEvent(new CustomEvent('site:toast', { detail: { message: `${Site.getTheme() === 'dark' ? 'Dark' : 'Light'} theme` } })); return;
        case 'print': setTimeout(() => window.print(), 60); return;
        default:
      }
    }

    function run(i) {
      const r = results[i];
      if (!r) return;
      const cmd = r.c;
      if (cmd.href) close(() => goTo(cmd));
      else close(() => { runAction(cmd); if (cmd.run !== 'print' && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true }); });
    }

    /* Input + keyboard model */
    input.addEventListener('input', () => { active = 0; render(); list.scrollTop = 0; });
    input.addEventListener('keydown', (e) => {
      const ctrlNP = e.ctrlKey && !e.metaKey && (e.key === 'n' || e.key === 'p');
      if (e.key === 'ArrowDown' || (ctrlNP && e.key === 'n')) { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp' || (ctrlNP && e.key === 'p')) { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'PageDown') { e.preventDefault(); setActive(Math.min(active + 5, results.length - 1)); }
      else if (e.key === 'PageUp') { e.preventDefault(); setActive(Math.max(active - 5, 0)); }
      else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); run(active); }
      else if (e.key === 'Tab') { // keep focus in the input; Tab cycles results like Raycast
        e.preventDefault(); setActive(active + (e.shiftKey ? -1 : 1));
      }
    });

    /* Pointer: hover syncs selection (pointermove ignores scroll-induced hovers) */
    list.addEventListener('pointermove', (e) => {
      const el = e.target.closest('.palette__item');
      if (el && Number(el.dataset.i) !== active) setActive(Number(el.dataset.i), false);
    });
    list.addEventListener('click', (e) => {
      const el = e.target.closest('.palette__item');
      if (el) run(Number(el.dataset.i));
    });
    list.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in input

    /* Dismissal */
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dlg.addEventListener('click', (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) close();
    });
    dlg.querySelector('[data-palette-close]').addEventListener('click', () => close());

    /* Global triggers */
    document.addEventListener('keydown', (e) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (dlg.open) close(); else open();
      }
    });
    document.addEventListener('site:palette', () => open());
    document.addEventListener('site:theme', () => { if (dlg.open) render(); });

    /* Platform-specific hint labels */
    if (!isMac) dlg.querySelectorAll('[data-mod-key]').forEach((k) => { k.textContent = 'Ctrl'; });

    /* Capture/review mode: &palette[=query] renders it open */
    const params = new URLSearchParams(location.search);
    if (Site.capture && params.has('palette')) open(params.get('palette') || '');
  };

  window.Site.register('palette', init);
})();
