# A298 round-2 supplemental adversarial review

Scope: d83764e → 8c8dc78 on design/a298-terminal-chain, plus texture fix df3d0c2. This is not codereview-profile approval or a deployment approval.

Required native-profile attempt:
`hermes -p codereview chat --query-file docs/A298-R2-REVIEW-BRIEF.md -Q`
returned `hermes: command not found`, exit 127. Log: `qa/a298-r2/codereview-cli.log`.

AXIOM reported A299's cross-family host codereview of **d83764e**, not the revised head, as SHIP with no P1/P2 and one P3 documentation correction. That correction is included: the old handoff now names the working-tree whitespace check and explicitly preserves upstream trailing whitespace in the BSD license. AXIOM also said no separate profile run was needed for this round; the required local attempt was nevertheless recorded.

## Independent supplementary review

One read-only fresh-context reviewer inspected the exact diff and ran independent browser probes. It found one concrete P2:

> AC3 fails after texture drift is frozen. Fractional translations blur the dots below the intended +8–12 levels. At 1440 and 390, drift → reduced motion yielded brightest red 18 against night 14 (+4), held unchanged after another capture. Initial reduced-motion loads measured +11.

Parent verification reproduced the defect with new browser regressions: **+4 desktop / +5 mobile** after waiting 2.5s then enabling reduced motion. Both failed before the fix.

**Fix df3d0c2:** round the two existing drift coordinates to whole CSS pixels. No extra clock, loop, reset animation, shader, opacity increase or foreground-color change. The same bounded 6px/4px slow drift remains, in quiet pixel steps, and freezes visibly under reduced motion.

Focused re-verification: all six texture cases pass (initial static + after-drift static + hidden/offscreen pauses, both widths). Final pixel sample in all four visibility cases is rgb(25,26,29) over night rgb(14,15,17): +11 red, dim contrast 5.295:1 and body contrast 12.439:1. Full suites are recorded separately in the round-2 handoff. The correction is two `Math.round` calls; no second independent review pass was warranted for this trivial fix.

The independent reviewer found no further concrete defects in DPR-scaled direct glyph drawing, seven-arrow grids, repeated breakpoint resizing, hidden/offscreen rendering pauses, all 11 selections/panels, Escape/cancel/manual replay, proportional art fit, or desktop headline fit. No review files were written by that reviewer and no card/publication action was taken.

Parent self-review also checked added production lines: no credential literals, eval/exec, private timer APIs or network APIs. The caduceus generator, its dither/breathing/entrance implementation and SHA fixtures are unchanged this revision; only its responsive CSS scale changes. Browser/source tests, exact static build and whitespace evidence are preserved in `qa/a298-r2`.
