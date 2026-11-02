/* ==========================================================================
   01 — Hero: Exhibit 0 draw-on-view
   ========================================================================== */
(() => {
  const Site = window.Site;
  if (!Site) return;

  Site.register('hero', () => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    /* Exhibit 0: bars draw and values tick in once the chart is in view.
       Final values live in the HTML (capture / reduced motion / no-JS show them as-is). */
    const chart = hero.querySelector('.hero__chart');
    if (chart) {
      const vals = [...chart.querySelectorAll('[data-hero-count]')];
      if (!Site.reducedMotion) {
        chart.setAttribute('data-armed', '');
        vals.forEach((el) => { el.textContent = '0%'; });
      }
      Site.onInView([chart], () => {
        if (Site.reducedMotion) return;
        // Two frames so the armed (scaleX 0) state is committed before the transition starts.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          chart.setAttribute('data-drawn', '');
          vals.forEach((el, i) => setTimeout(
            () => Site.countUp(el, Number(el.dataset.heroCount), { duration: 640, suffix: '%' }),
            i * 140));
        }));
      }, { threshold: 0.5 });
    }
  });
})();
