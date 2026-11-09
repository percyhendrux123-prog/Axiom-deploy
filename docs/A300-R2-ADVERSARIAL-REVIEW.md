# A300 rework adversarial review

## Required native profile

Command actually executed in the Linux appbuilder Space:

`hermes -p codereview chat --query-file docs/A300-R2-REVIEW-BRIEF.md -Q`

Result: exit127, `bash: hermes: command not found`. This is an unavailable gate, not a review verdict. AXIOM must run it on host against implementation commit83fa07e / final evidence head. Exact log: `qa/a300-r2/native-codereview.log` in evidence archive.

## Supplementary fresh-context read-only review

One pass on the rework diff against4aac7d4. No concrete introduced defects found; no changes required, therefore no second pass.

Reviewer read the CSS/cache/test/fixture changes, checked unchanged art hash, and actually exercised:
- Narrow WebKit metric tests2/2.
- 28 old/new static art comparisons: both engines, fallback/host-metric fonts, widths320/390/900/901/1024/1440/1920. Full-row width delta exactly0, height/font size unchanged, full art fits its column.
- 8 cursor-transition controls. Old desktop negative controls: width drift11px Chromium /10.765625px WebKit; intentionally repeated Chromium transitions yield CLS0.005033351417824074. New PRE width/left drift0 and Chromium CLS0.
- 12 resize checks.

Parent read the persisted reviewer report and independently parsed its JSON/log. `failures` is empty. All artifacts/probe source are preserved in `qa/a300-r2/review` in the evidence zip. Parent's own real test execution:58 source,73 full Chromium browser,20 cross-engine pass. These are distinct from reviewer checks.

Native Mac Apple Braille is not certified by the fixture. WebKit has no CLS API: geometry/scroll proof only. WebKit single-character Range metrics can snap by<1px although full-row advance is unchanged exactly; no art-size regression. Existing320px overflow is baseline, not an introduced finding.

No client data, tracked-file edits, commits or publication by the supplementary reviewer. Its attempted non-allowlisted command Standing proof was unavailable (`standing:68`); parent separately obtained passing public-reference HTTP proof `standing:67`, scoped honestly in handoff.
