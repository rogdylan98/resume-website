/* ==========================================================================
   02 · Impact — metric count-ups and a data-driven career timeline.
   The HTML ships fully rendered (no-JS / capture safe); this file only
   animates and keeps the timeline geometry in sync with today's date.
   ========================================================================== */
(() => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** "2021-06" → { y: 2021, m: 6 } ; null when malformed */
  const parseYM = (s) => {
    const m = /^(\d{4})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const y = +m[1], mo = +m[2];
    return mo >= 1 && mo <= 12 ? { y, m: mo } : null;
  };

  function initTimeline(root, Site) {
    const rows = Array.from(root.querySelectorAll('.impact-tl__row'));
    const today = new Date();
    const nowYM = { y: today.getFullYear(), m: today.getMonth() + 1 };
    const daysInMonth = new Date(nowYM.y, nowYM.m, 0).getDate();

    const items = rows.map((el) => {
      const start = parseYM(el.dataset.start);
      const open = el.dataset.end === 'present';
      const end = open ? nowYM : parseYM(el.dataset.end);
      return start && end ? { el, start, end, open } : null;
    });
    if (!items.length || items.some((d) => !d)) return; // keep static geometry

    // Domain: Jan of the first start year → Jan of the year after the latest end.
    const y0 = Math.min(...items.map((d) => d.start.y));
    const y1 = Math.max(...items.map((d) => d.end.y), nowYM.y) + 1;
    const idx = ({ y, m }) => (y - y0) * 12 + (m - 1);
    const nowPos = idx(nowYM) + (today.getDate() - 1) / daysInMonth;
    const fix = (n) => String(Math.round(n * 100) / 100);

    root.style.setProperty('--span', String((y1 - y0) * 12));
    root.style.setProperty('--now', fix(nowPos));

    items.forEach((d, i) => {
      const a = idx(d.start);
      const b = d.open ? nowPos : idx(d.end) + 1;
      d.el.style.setProperty('--a', fix(a));
      d.el.style.setProperty('--b', fix(b));
      d.el.style.setProperty('--i', String(i));
    });

    // Year ticks follow the domain (so the axis extends itself in 2027+).
    const axis = root.querySelector('[data-impact-axis]');
    if (axis) {
      axis.textContent = '';
      for (let y = y0; y < y1; y += 1) {
        const t = document.createElement('span');
        t.className = 'impact-tl__tick';
        t.style.setProperty('--m', String((y - y0) * 12));
        t.textContent = String(y);
        axis.appendChild(t);
      }
    }
    const nowLabel = root.querySelector('[data-impact-now]');
    if (nowLabel) nowLabel.textContent = `${MONTHS[nowYM.m - 1]} ${nowYM.y}`;

    // Smooth-scroll to the role and move focus there for keyboard / AT users.
    rows.forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = document.getElementById((el.getAttribute('href') || '').slice(1));
        if (!target) return; // let the browser handle it
        e.preventDefault();
        target.scrollIntoView({ behavior: Site.reducedMotion ? 'auto' : 'smooth', block: 'start' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        history.replaceState(null, '', `#${target.id}`);
      });
    });

    if (!Site.reducedMotion) {
      root.setAttribute('data-anim', 'pending');
      Site.onInView([root], () => requestAnimationFrame(() => root.setAttribute('data-anim', 'done')), { threshold: 0.3 });
    }
  }

  function initMetrics(list, Site) {
    return; /* static numbers, no count-up */
    const nums = Array.from(list.querySelectorAll('.impact__num[data-count]'));
    const parts = nums.map((el) => ({
      el,
      out: el.firstElementChild,
      target: parseFloat(el.dataset.count) || 0,
      suffix: el.dataset.suffix || '',
    }));
    if (Site.reducedMotion) return; // HTML already shows final values
    parts.forEach((p) => { if (p.out) p.out.textContent = `0${p.suffix}`; });
    Site.onInView([list], () => {
      parts.forEach((p, i) => {
        if (!p.out) return;
        setTimeout(() => Site.countUp(p.out, p.target, { duration: p.target < 10 ? 700 : 1300, suffix: p.suffix }), i * 90);
      });
    }, { threshold: 0.35 });
  }

  const init = (Site) => {
    const section = document.getElementById('impact');
    if (!section) return;
    const metrics = section.querySelector('[data-impact-metrics]');
    const tl = section.querySelector('[data-impact-tl]');
    if (metrics) initMetrics(metrics, Site);
    if (tl) initTimeline(tl, Site);
  };

  if (window.Site) window.Site.register('impact', init);
})();
