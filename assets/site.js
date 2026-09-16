(() => {
  const form = document.getElementById('lane-mapper');
  const button = document.getElementById('copy-brief');
  const status = document.getElementById('copy-status');
  const manualBrief = document.getElementById('manual-brief');
  const manualOutput = document.getElementById('manual-brief-output');

  if (!form || !button || !status || !manualBrief || !manualOutput) return;

  button.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const brief = `OPERATE\nRepeated workflow: ${data.get('repeated-workflow')}\nContinuity break: ${data.get('continuity-break')}\nObservable outcome: ${data.get('observable-outcome')}\n\nNo secrets included.`;
    manualOutput.textContent = brief;
    try {
      await navigator.clipboard.writeText(brief);
      status.textContent = 'OPERATE brief copied locally.';
    } catch {
      status.textContent = 'Copy failed. Use the OPERATE template below.';
      manualBrief.focus();
    }
  });
})();
