/* ==========================================================================
   02 — Experience: timeline fallback where scroll-driven animations are unsupported.
   Evidence highlighting (.is-evidence / html[data-evidence]) is driven by
   Site.highlightEvidence() from the capabilities section; styling lives in experience.css.
   ========================================================================== */
window.Site && window.Site.register('experience', (Site) => {
  const section = document.getElementById('experience');
  if (!section) return;

  const supportsTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (supportsTimeline || Site.reducedMotion || !('IntersectionObserver' in window)) return;

  section.classList.add('xp--io');
  Site.onInView(section.querySelectorAll('.xp__role'), (el) => el.setAttribute('data-reached', ''),
    { threshold: 0, rootMargin: '0px 0px -45% 0px' });
});
