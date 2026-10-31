// Shared browser-side measurements. Inline exceptions are classified from
// surrounding prose, never computed display (inline-flex is the regression).
export function measureTargets() {
  const visible = element => element.checkVisibility();
  const describe = element => ({ tag: element.tagName, class: element.className, text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 100) });
  const rect = element => { const r = element.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, right: r.right }; };
  const isRunningTextLink = element => {
    if (element.tagName !== 'A' || element.matches('.button, .brand, .notes-list a, .notes-all a, .footer-links a')) return false;
    const container = element.closest('p, li, figcaption, .next');
    if (!container) return false;
    const prose = container.cloneNode(true);
    // Sibling paragraphs in a closing section are not the link's line.
    prose.querySelectorAll('a, p, ul, ol').forEach(node => node.remove());
    return /[\p{L}\p{N}]/u.test(prose.textContent);
  };
  const targets = [...document.querySelectorAll('a, button, summary, input, textarea')].filter(visible).filter(element => !element.classList.contains('skip'));
  const inlineTextLinks = targets.filter(isRunningTextLink).map(element => ({ ...describe(element), display: getComputedStyle(element).display }));
  return {
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    outside: [...document.querySelectorAll('main *, header *, footer *')].filter(visible).filter(element => { const r = rect(element); return r.width && (r.left < -1 || r.right > innerWidth + 1); }).map(element => ({ ...describe(element), ...rect(element) })),
    // WCAG 2.5.8/2.5.5 inline exception; standalone controls remain >=44x44.
    smallTargets: targets.filter(element => !isRunningTextLink(element)).filter(element => { const r = rect(element); return r.width < 44 || r.height < 44; }).map(element => ({ ...describe(element), ...rect(element) })),
    inlineTextLinks,
    nonInlineTextLinks: inlineTextLinks.filter(link => link.display !== 'inline'),
  };
}
