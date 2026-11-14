(() => {
  const mapper = document.getElementById('lane-mapper');
  const button = document.getElementById('copy-brief');
  const status = document.getElementById('copy-status');
  const manualBrief = document.getElementById('manual-brief');
  const manualOutput = document.getElementById('manual-brief-output');

  if (!mapper || !button || !status || !manualBrief || !manualOutput) return;

  const workflow = mapper.querySelector('[name="repeated-workflow"]');
  const continuityBreak = mapper.querySelector('[name="continuity-break"]');
  const observableOutcome = mapper.querySelector('[name="observable-outcome"]');
  const requiredControls = [workflow, continuityBreak, observableOutcome];

  button.addEventListener('click', async () => {
    if (requiredControls.some((control) => !control.reportValidity())) return;
    const brief = `BRIEF\nThe recurring work: ${workflow.value}\nWhere continuity breaks: ${continuityBreak.value}\nWhat resolution looks like: ${observableOutcome.value}\n\nNo secrets included.`;
    manualOutput.textContent = brief;
    try {
      await navigator.clipboard.writeText(brief);
      status.textContent = 'Brief copied. Paste it into an email to percy@deployaxiom.com.';
    } catch {
      status.textContent = 'Copy failed. Use the template below.';
      manualBrief.focus();
    }
  });
})();

// A409: any link to the contact section opens the brief form on arrival, so
// "Start an engagement" (inner pages) and "Send a short brief" take one tap.
(() => {
  const composer = document.getElementById('brief-composer');
  if (!composer) return;
  const wants = (hash) => hash === '#contact' || hash === '#brief-form';
  const form = document.getElementById('brief-form');
  const open = () => { composer.open = true; };
  // Once open, the summary hides; move focus into the form so keyboard and
  // screen-reader users continue at the first field instead of the page top.
  if (form) {
    form.setAttribute('tabindex', '-1');
    composer.addEventListener('toggle', () => {
      if (composer.open && !form.contains(document.activeElement)) form.focus({ preventScroll: true });
    });
  }
  if (wants(location.hash)) open();
  addEventListener('hashchange', () => { if (wants(location.hash)) open(); });
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (link && wants(link.hash) && link.pathname === location.pathname) open();
  });
})();
