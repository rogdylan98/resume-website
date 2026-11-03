/* ==========================================================================
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
