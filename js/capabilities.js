/* ==========================================================================
   03 — Capabilities: skill → experience evidence cross-highlighting
   hover/focus  → preview (readout + Site.highlightEvidence)
   click/Enter  → scroll to first evidencing role, hold highlight briefly
   touch tap    → toggle a pinned preview (readout names become jump links)
   ========================================================================== */
(() => {
  const ROLE_NAMES = {
    accenture: 'Accenture', boeing: 'Boeing', nisum: 'Nisum', appacademy: 'App Academy', saight: 'Saight Dev',
  };
  const HOLD_MS = 2400;

  const init = (Site) => {
    const matrix = document.querySelector('[data-cap-matrix]');
    if (!matrix) return;
    const readoutText = matrix.querySelector('[data-cap-readout-text]');
    if (matchMedia('(hover: none)').matches && !Site.capture) {
      readoutText.textContent = readoutText.textContent.replace(/^Hover/, 'Tap');
    }
    const hint = readoutText.textContent;
    const skills = Array.from(matrix.querySelectorAll('.cap__skill'));
    const colHeads = Array.from(matrix.querySelectorAll('.cap__colhead[data-cap-col]'));

    let active = null;      // button currently previewed
    let pinned = null;      // button pinned by touch tap
    let holdTimer = 0;
    let lastPointer = 'mouse';

    const idsOf = (btn) => (btn.dataset.evidence || '').split(/\s+/).filter(Boolean);

    const renderReadout = (btn, { links = false } = {}) => {
      if (!btn) { readoutText.textContent = hint; return; }
      const ids = idsOf(btn);
      readoutText.textContent = '';
      if (!ids.length) {
        readoutText.textContent = hint;
        return;
      }
      const label = document.createElement('span');
      label.className = 'cap__readout-label';
      label.textContent = 'Evidenced at: ';
      const roles = document.createElement('span');
      roles.className = 'cap__readout-roles';
      ids.forEach((id, i) => {
        if (i) {
          const sep = document.createElement('span');
          sep.className = 'cap__readout-sep'; sep.setAttribute('aria-hidden', 'true'); sep.textContent = '·';
          roles.append(sep);
        }
        const el = document.createElement(links ? 'a' : 'span');
        el.className = 'cap__readout-role';
        el.textContent = ROLE_NAMES[id] || id;
        if (links) { el.href = `#xp-${id}`; el.tabIndex = -1; }
        roles.append(el);
      });
      readoutText.append(label, roles);
    };

    const apply = (btn, opts) => {
      if (active && active !== btn) active.closest('.cap__row').classList.remove('is-active');
      active = btn;
      const ids = btn ? idsOf(btn) : [];
      matrix.classList.toggle('is-active', !!btn);
      if (btn) btn.closest('.cap__row').classList.add('is-active');
      colHeads.forEach((h) => h.classList.toggle('is-on', ids.includes(h.dataset.capCol)));
      renderReadout(btn, opts);
      Site.highlightEvidence(ids.length ? ids.join(' ') : null);
    };

    const preview = (btn) => { clearTimeout(holdTimer); if (!pinned || pinned === btn) apply(btn, { links: pinned === btn }); };
    const release = (btn) => {
      if (pinned || holdTimer) return;
      if (active === btn) apply(null);
    };

    const jump = (btn) => {
      const ids = idsOf(btn);
      if (!ids.length) return;
      const target = document.getElementById(`xp-${ids[0]}`);
      apply(btn);
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        holdTimer = 0;
        // Only clear if the user hasn't moved on to another skill
        if (!matrix.matches(':hover') || !active || !active.matches(':hover, :focus-visible')) apply(null);
      }, HOLD_MS);
      if (target) target.scrollIntoView({ behavior: Site.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    };

    skills.forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; });
      btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') preview(btn); });
      btn.closest('.cap__row').addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') release(btn); });
      btn.addEventListener('focus', () => { if (lastPointer !== 'touch') preview(btn); });
      btn.addEventListener('blur', () => { if (lastPointer !== 'touch') release(btn); });
      btn.addEventListener('click', (e) => {
        if (lastPointer === 'touch' && e.detail !== 0) {
          // Tap toggles a pinned preview; readout roles become jump links.
          const same = pinned === btn;
          pinned = same ? null : btn;
          apply(same ? null : btn, { links: !same });
          lastPointer = 'mouse';
          return;
        }
        lastPointer = 'mouse';
        jump(btn);
      });
    });

    // Tap/click outside clears a pinned preview; Escape clears everything.
    document.addEventListener('pointerdown', (e) => {
      if (pinned && !e.target.closest('.cap__skill, .cap__readout')) { pinned = null; apply(null); }
    });
    matrix.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && active) { pinned = null; clearTimeout(holdTimer); holdTimer = 0; apply(null); }
    });
  };

  window.Site.register('capabilities', init);
})();
