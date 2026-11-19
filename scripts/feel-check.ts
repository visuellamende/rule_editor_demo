/**
 * Prueft die Teilsprache aus src/utils/feel.ts: Rechenfaelle mit erwartetem
 * Ergebnis, Fehlerfaelle mit erwarteter Meldung, und die statische Analyse,
 * auf der die Regeln EXPR-02 und EXPR-03 beruhen.
 *
 * Aufruf: npm run check-feel
 */
import { evaluateFeel, parseFeel, collectNames, collectCallProblems } from '../src/utils/feel';

const context = { grundmiete: 1200, quote: 30, rolle: 'MEMBER', tage: 92, aktiv: true };

const rechnet: Array<[string, unknown]> = [
  ['1 + 2 * 3', 7],
  ['(1 + 2) * 3', 9],
  ['2 ** 3 ** 2', 512],
  ['-grundmiete + 200', -1000],
  ['grundmiete * (1 - quote / 100)', 840],
  ['round(grundmiete * (1 - quote / 100), 2)', 840],
  ['round(1234.5678, 2)', 1234.57],
  ['quote > 20 and quote <= 50', true],
  ['not(aktiv)', false],
  ['if quote > 50 then "hoch" else "normal"', 'normal'],
  ['tage in [89..92]', true],
  ['tage in [89..92)', false],
  ['rolle in ("GUEST", "MEMBER")', true],
  ['rolle in ("GUEST", "ADMIN")', false],
  ['max(1, 5, 3)', 5],
  ['min(1, 5, 3)', 1],
  ['sum(1, 2, 3)', 6],
  ['count(1, 2, 3)', 3],
  ['abs(0 - 7)', 7],
  ['floor(3.7)', 3],
  ['ceiling(3.2)', 4],
  ['string length("hallo")', 5],
  ['upper(rolle)', 'MEMBER'],
  ['lower(rolle)', 'member'],
  ['contains(rolle, "MEM")', true],
  ['starts with(rolle, "MEM")', true],
  ['"a" + "b"', 'ab'],
  ['1 = 1', true],
  ['1 != 2', true],
  ['"abc" < "abd"', true],
];

/** Fehlerfall und ein Stueck der erwarteten Meldung. */
const scheitert: Array<[string, string]> = [
  ['1 +', 'Ausdruck erwartet'],
  ['grundmiete *', 'Ausdruck erwartet'],
  ['"offen', 'ohne schließendes'],
  ['if 1 then 2', '"else" erwartet'],
  ['unbekannt(1)', 'unbekannte Funktion'],
  ['1 / 0', 'Division durch null'],
  ['fehlt + 1', 'ist nicht belegt'],
  ['1 + "a" * 2', 'erwartet eine Zahl'],
  ['quote and 1', 'Wahrheitswert erwartet'],
  ['1 2', 'Unerwarteter Rest'],
];

let failed = 0;
let passed = 0;

console.log('--- Teilsprache: Rechenfälle ---\n');
for (const [source, expected] of rechnet) {
  const r = evaluateFeel(source, context);
  if (r.ok && JSON.stringify(r.value) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ok    ${source}  =  ${JSON.stringify(r.value)}`);
  } else {
    failed++;
    console.log(`  FEHL  ${source}`);
    console.log(`        erwartet ${JSON.stringify(expected)}, bekommen ${r.ok ? JSON.stringify(r.value) : r.error}`);
  }
}

console.log('\n--- Teilsprache: Fehlerfälle ---\n');
for (const [source, fragment] of scheitert) {
  const r = evaluateFeel(source, context);
  if (!r.ok && (r.error ?? '').includes(fragment)) {
    passed++;
    console.log(`  ok    ${source.padEnd(16)} → ${r.error}`);
  } else {
    failed++;
    console.log(`  FEHL  ${source}`);
    console.log(`        erwartet eine Meldung mit "${fragment}", bekommen ${r.ok ? 'ein Ergebnis: ' + JSON.stringify(r.value) : r.error}`);
  }
}

console.log('\n--- Statische Analyse (Grundlage von EXPR-02 und EXPR-03) ---\n');

const namesParsed = parseFeel('grundmiete * (1 - quote / 100) + max(a, b)');
const names = namesParsed.ok && namesParsed.node ? [...collectNames(namesParsed.node)].sort() : [];
if (JSON.stringify(names) === JSON.stringify(['a', 'b', 'grundmiete', 'quote'])) {
  passed++;
  console.log(`  ok    freie Namen: ${names.join(', ')}`);
} else {
  failed++;
  console.log(`  FEHL  freie Namen: ${names.join(', ')}`);
}

const callsParsed = parseFeel('round(1) + gibtsNicht(2) + max()');
const problems = callsParsed.ok && callsParsed.node ? collectCallProblems(callsParsed.node) : [];
if (problems.length === 2 && problems[0].includes('gibtsNicht') && problems[1].includes('max')) {
  passed++;
  console.log(`  ok    Funktionsprobleme: ${problems.join(' | ')}`);
} else {
  failed++;
  console.log(`  FEHL  Funktionsprobleme: ${problems.join(' | ')}`);
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) process.exitCode = 1;
