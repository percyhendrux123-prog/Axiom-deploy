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
    const brief = `OPERATE\nWhat keeps slipping: ${workflow.value}\nWhere it gets dropped: ${continuityBreak.value}\nWhat handled looks like: ${observableOutcome.value}\n\nNo secrets included.`;
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
