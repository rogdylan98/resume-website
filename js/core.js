/* ==========================================================================
   Core runtime: section registry, in-view observer, capture mode, utilities
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const capture = params.has('capture');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inits = [];

  root.classList.remove('no-js');
  if (capture) root.classList.add('capture');

  const Site = {
    capture,
    reducedMotion: reduced || capture,
    /** Register a section initializer; runs after DOM is ready. */
    register(name, fn) { inits.push([name, fn]); },
    /** Observe elements; cb(el) fires once when ≥ threshold visible (immediately in capture/reduced mode). */
    onInView(els, cb, { threshold = 0.2, rootMargin = '0px 0px -8% 0px' } = {}) {
      const list = Array.from(els);
      if (Site.reducedMotion || !('IntersectionObserver' in window)) { list.forEach(cb); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
      }, { threshold, rootMargin });
      list.forEach((el) => io.observe(el));
    },
    /** Tween a number from 0 → target; respects capture/reduced motion. */
    countUp(el, target, { duration = 1400, decimals = 0, prefix = '', suffix = '' } = {}) {
      const fmt = (v) => prefix + v.toFixed(decimals) + suffix;
      if (Site.reducedMotion) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 4);
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        el.textContent = fmt(target * ease(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    /** Theme: 'light' | 'dark'. Persists, updates <html data-theme>, emits 'site:theme'. */
    getTheme() {
      const t = root.getAttribute('data-theme');
      if (t) return t;
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    setTheme(t) {
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch (e) { /* storage unavailable */ }
      document.dispatchEvent(new CustomEvent('site:theme', { detail: { theme: t } }));
    },
    toggleTheme() { Site.setTheme(Site.getTheme() === 'dark' ? 'light' : 'dark'); },
    /**
     * Skill → experience evidence contract.
     * Roles carry data-xp="<id>" (ids: accenture, boeing, nisum, appacademy, saight).
     * highlightEvidence('accenture boeing') adds .is-evidence to matching [data-xp] and sets
     * <html data-evidence>; highlightEvidence(null) clears.
     */
    highlightEvidence(ids) {
      const set = new Set((ids || '').split(/\s+/).filter(Boolean));
      document.querySelectorAll('[data-xp]').forEach((el) => el.classList.toggle('is-evidence', set.has(el.dataset.xp)));
      if (set.size) root.setAttribute('data-evidence', [...set].join(' '));
      else root.removeAttribute('data-evidence');
    },
  };
  window.Site = Site;

  const boot = () => {
    // Generic reveal
    const reveals = document.querySelectorAll('.reveal');
    Site.onInView(reveals, (el) => el.setAttribute('data-inview', ''), { threshold: 0.12 });

    for (const [name, fn] of inits) {
      try { fn(Site); } catch (err) { console.error(`[site] ${name} failed`, err); }
    }

    // Capture helper: ?capture&only=<sectionId> isolates one section; report height for screenshot tooling.
    const only = params.get('only');
    if (capture && only) {
      document.querySelectorAll('body > header, body > main > section, body > footer').forEach((el) => {
        const keep = el.id === only || (only === 'contact' && el.tagName === 'FOOTER') || (only === 'hero' && el.tagName === 'HEADER');
        if (!keep) el.style.display = 'none';
      });
    }
    if (capture) {
      requestAnimationFrame(() => {
        root.setAttribute('data-capture-height', String(Math.ceil(document.documentElement.scrollHeight)));
      });
    }
  };

  // Deferred section scripts run after core.js but before DOMContentLoaded, so waiting for it
  // guarantees every Site.register() call has happened before boot.
  if (document.readyState === 'complete') boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
