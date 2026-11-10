#!/usr/bin/env node
// Prints the three homepage ledger numbers from the operating ledger CSV.
// Rule and labels: docs/ledger-count.md. Read-only: the CSV is never written.
//
// Usage: node scripts/ledger-count.mjs <path-to-OS-EVENTS.csv> [--through YYYY-MM-DD] [--json]
import { readFileSync } from 'node:fs';

// Columns the rule depends on. A ledger without any of them is refused, never counted.
export const REQUIRED_COLUMNS = ['date', 'status', 'evidence', 'failure_recovered'];

// Field values are compared after trimming surrounding whitespace (see docs/ledger-count.md).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((v) => v !== '')) rows.push(row);
  const [header = [], ...body] = rows;
  const names = header.map((name) => name.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !names.includes(c));
  if (missing.length) throw new Error(`ledger CSV is missing column(s): ${missing.join(', ')}`);
  return body.map((values) => Object.fromEntries(header.map((name, i) => [name.trim(), (values[i] ?? '').trim()])));
}

export function countLedger(rows, through) {
  const inRange = rows.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.date) && (!through || r.date.slice(0, 10) <= through));
  return {
    through: through ?? null,
    outcomes: inRange.length,
    verified: inRange.filter((r) => r.status === 'verified' && typeof r.evidence === 'string' && r.evidence.length > 0).length,
    recovered: inRange.filter((r) => r.failure_recovered === 'yes').length,
    skippedUndated: rows.length - rows.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.date)).length,
  };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const path = args.find((a) => !a.startsWith('--') && !/^\d{4}-\d{2}-\d{2}$/.test(a));
  const t = args.indexOf('--through');
  const through = t >= 0 ? args[t + 1] : undefined;
  if (!path || (t >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(through ?? ''))) {
    console.error('usage: node scripts/ledger-count.mjs <OS-EVENTS.csv> [--through YYYY-MM-DD] [--json]');
    process.exit(2);
  }
  let result;
  try { result = countLedger(parseCsv(readFileSync(path, 'utf8')), through); }
  catch (err) { console.error(err.message); process.exit(2); }
  if (args.includes('--json')) console.log(JSON.stringify(result));
  else {
    console.log(`through:   ${result.through ?? 'all rows'}`);
    console.log(`outcomes:  ${result.outcomes}  (outcomes on record)`);
    console.log(`verified:  ${result.verified}  (verified against recorded evidence)`);
    console.log(`recovered: ${result.recovered}  (with a failure caught and recovered)`);
    if (result.skippedUndated) console.log(`skipped:   ${result.skippedUndated} rows with no ISO date`);
  }
}
