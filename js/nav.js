/* ==========================================================================
   00 — Nav: scrolled state, progress, active section, theme, palette, sheet
   ========================================================================== */
(() => {
  const Site = window.Site;
  if (!Site) return;

  Site.register('nav', () => {
    const root = document.documentElement;
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    const sheet = document.querySelector('[data-nav-sheet]');
    const menuBtn = nav.querySelector('[data-nav-menu]');
    const indicator = nav.querySelector('.nav__indicator');
    const deskLinks = [...nav.querySelectorAll('.nav__link')];
    const allLinks = [...document.querySelectorAll('[data-nav-link]')];

    /* ---- Platform-aware shortcut label ---- */
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent;
    const isMac = /mac|iphone|ipad|ipod/i.test(platform);
    document.querySelectorAll('[data-nav-kbd]').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });

    /* ---- Command palette ---- */
    document.querySelectorAll('[data-nav-palette]').forEach((b) => b.addEventListener('click', () => {
      if (sheet && !sheet.hidden) closeSheet({ restoreFocus: false });
      Site.openPalette();
    }));

    /* ---- Theme toggle ---- */
    const themeBtns = [...document.querySelectorAll('[data-nav-theme]')];
    const themeState = document.querySelector('[data-nav-theme-state]');
    const syncTheme = (t) => {
      const dark = (t || Site.getTheme()) === 'dark';
      themeBtns.forEach((b) => b.setAttribute('aria-pressed', String(dark)));
      if (themeState) themeState.textContent = dark ? 'On' : 'Off';
      const meta = document.querySelectorAll('meta[name="theme-color"]');
      meta.forEach((m) => m.setAttribute('content', dark ? '#0B0E13' : '#F5F3EE'));
    };
    themeBtns.forEach((b) => b.addEventListener('click', () => Site.toggleTheme()));
    document.addEventListener('site:theme', (e) => syncTheme(e.detail && e.detail.theme));
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!root.hasAttribute('data-theme')) syncTheme();
    });
    // Initial sync without touching meta unless a theme was explicitly chosen.
    themeBtns.forEach((b) => b.setAttribute('aria-pressed', String(Site.getTheme() === 'dark')));
    if (themeState) themeState.textContent = Site.getTheme() === 'dark' ? 'On' : 'Off';

    /* ---- Scrolled state + progress fallback (rAF-throttled) ---- */
    const cssProgress = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        nav.toggleAttribute('data-scrolled', y > 8);
        if (!cssProgress) {
          const max = root.scrollHeight - window.innerHeight;
          nav.style.setProperty('--nav-p', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    /* ---- Active section indicator ---- */
    const moveIndicator = (link) => {
      if (!indicator) return;
      if (!link || link.offsetParent === null) { nav.style.setProperty('--nav-ind-o', '0'); return; }
      const pad = parseFloat(getComputedStyle(link).paddingLeft) || 0;
      const list = link.closest('.nav__links');
      const lr = list.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      nav.style.setProperty('--nav-ind-x', `${r.left - lr.left + pad}px`);
      nav.style.setProperty('--nav-ind-w', `${r.width - pad * 2}px`);
      nav.style.setProperty('--nav-ind-o', '1');
    };
    let current = null;
    const setActive = (id) => {
      if (id === current) return;
      current = id;
      allLinks.forEach((a) => {
        if (a.dataset.navLink === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      moveIndicator(deskLinks.find((a) => a.dataset.navLink === id));
    };
    const ids = [...new Set(allLinks.map((a) => a.dataset.navLink))];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    // Reading line sits a fixed distance below the bar (not a % of the viewport), so very tall
    // viewports (e.g. full-page captures) never mark a lower section active while the hero is on top.
    const updateActive = () => {
      if (!sections.length) return;
      const line = nav.offsetHeight + Math.min(window.innerHeight * 0.35, 320);
      const atEnd = window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      let hit = null;
      if (atEnd) hit = sections[sections.length - 1];
      else for (const sec of sections) {
        const r = sec.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { hit = sec; break; }
      }
      setActive(hit ? hit.id : null);
    };
    let activeTick = false;
    const queueActive = () => {
      if (activeTick) return;
      activeTick = true;
      requestAnimationFrame(() => { activeTick = false; updateActive(); });
    };
    window.addEventListener('scroll', queueActive, { passive: true });
    window.addEventListener('resize', queueActive, { passive: true });
    window.addEventListener('load', queueActive);
    updateActive();
    window.addEventListener('resize', () => moveIndicator(deskLinks.find((a) => a.dataset.navLink === current)), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(deskLinks.find((a) => a.dataset.navLink === current)));

    /* ---- Mobile sheet: focus trap, Esc, scroll lock, inert background ---- */
    if (!sheet || !menuBtn) return;
    const background = () => [...document.querySelectorAll('body > main, body > footer, body > header')];
    const focusables = () => [...sheet.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null);
    let lastFocus = null;

    const openSheet = () => {
      lastFocus = document.activeElement;
      const sbw = window.innerWidth - root.clientWidth;
      root.style.overflow = 'hidden';
      if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
      sheet.hidden = false;
      sheet.setAttribute('data-open', '');
      menuBtn.setAttribute('aria-expanded', 'true');
      background().forEach((el) => el.setAttribute('inert', ''));
      const first = sheet.querySelector('.nav-sheet__link[aria-current="true"]') || sheet.querySelector('.nav-sheet__link');
      (first || focusables()[0]).focus({ preventScroll: true });
      document.addEventListener('keydown', onKey);
    };
    function closeSheet({ restoreFocus = true } = {}) {
      if (sheet.hidden) return;
      sheet.hidden = true;
      sheet.removeAttribute('data-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      root.style.overflow = '';
      document.body.style.paddingRight = '';
      background().forEach((el) => el.removeAttribute('inert'));
      document.removeEventListener('keydown', onKey);
      if (restoreFocus && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!sheet.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }

    menuBtn.addEventListener('click', openSheet);
    sheet.querySelector('[data-nav-close]').addEventListener('click', () => closeSheet());
    sheet.querySelectorAll('.nav-sheet__link').forEach((a) => a.addEventListener('click', () => {
      // Close first so the anchor scroll is not blocked by the scroll lock.
      closeSheet({ restoreFocus: false });
    }));
    sheet.querySelectorAll('a[download]').forEach((a) => a.addEventListener('click', () => closeSheet()));
    matchMedia('(min-width: 760px)').addEventListener('change', (e) => { if (e.matches) closeSheet({ restoreFocus: false }); });
  });
})();
