/* ==========================================================================
   04 — Contact: copy-to-clipboard + toast, live Austin clock, footer controls
   Shared event contract (document):
     'site:toast'  detail { message }  → shows the toast (palette.js uses it too)
   ========================================================================== */
(() => {
  const EMAIL = 'rdylan.silva@gmail.com';

  /** Clipboard write with a legacy fallback. Resolves true on success. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  function initToast(Site) {
    const toast = document.querySelector('[data-contact-toast]');
    if (!toast) return;
    let hideT = 0;
    document.addEventListener('site:toast', (e) => {
      const msg = (e.detail && e.detail.message) || '';
      if (!msg) return;
      clearTimeout(hideT);
      // Re-set text so screen readers re-announce repeated messages.
      toast.textContent = '';
      requestAnimationFrame(() => {
        toast.textContent = msg;
        toast.classList.add('is-visible');
      });
      hideT = setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => { if (!toast.classList.contains('is-visible')) toast.textContent = ''; }, Site.reducedMotion ? 0 : 400);
      }, 2400);
    });
  }

  function initCopy() {
    const btn = document.querySelector('[data-contact-copy]');
    if (!btn) return;
    const chip = btn.querySelector('[data-contact-chip]');
    let resetT = 0;
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.contactCopy || EMAIL);
      if (!ok) {
        document.dispatchEvent(new CustomEvent('site:toast', { detail: { message: 'Clipboard unavailable — opening mail app' } }));
        location.href = `mailto:${EMAIL}`;
        return;
      }
      btn.classList.add('is-copied');
      if (chip) chip.textContent = 'Copied';
      document.dispatchEvent(new CustomEvent('site:toast', { detail: { message: `Copied ${EMAIL}` } }));
      clearTimeout(resetT);
      resetT = setTimeout(() => {
        btn.classList.remove('is-copied');
        if (chip) chip.textContent = 'Copy';
      }, 2000);
    });
    // Exposed for the palette's "Copy email" action via event, not a global.
    document.addEventListener('site:copy-email', () => btn.click());
  }

  function initClock() {
    const el = document.querySelector('[data-contact-time]');
    if (!el || !window.Intl) return;
    const tz = 'America/Chicago';
    let fmt, zone;
    try {
      fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
      zone = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
    } catch (e) { return; }
    const render = () => {
      const now = new Date();
      const abbr = (zone.formatToParts(now).find((p) => p.type === 'timeZoneName') || {}).value || 'CT';
      el.textContent = `${fmt.format(now)} ${abbr}`;
      el.setAttribute('datetime', now.toISOString());
    };
    render();
    // Align updates to the top of each minute.
    const schedule = () => setTimeout(() => { render(); schedule(); }, 60000 - (Date.now() % 60000) + 20);
    schedule();
  }

  function initFooter(Site) {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    document.querySelectorAll('[data-footer-kbd]').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
    const year = document.querySelector('[data-footer-year]');
    if (year) year.textContent = String(new Date().getFullYear());
    const pal = document.querySelector('[data-footer-palette]');
    if (pal) pal.addEventListener('click', () => Site.openPalette());
    const top = document.querySelector('[data-footer-top]');
    if (top) top.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: Site.reducedMotion ? 'auto' : 'smooth' });
      const main = document.getElementById('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
      history.replaceState(null, '', location.pathname + location.search);
    });
  }

  const init = (Site) => {
    initToast(Site);
    initCopy();
    initClock();
    initFooter(Site);
  };

  window.Site.register('contact', init);
})();
