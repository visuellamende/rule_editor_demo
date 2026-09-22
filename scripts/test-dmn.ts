import fs from 'node:fs';
import path from 'node:path';
import { validateDmn } from '../src/utils/validateDmn';
import { exportDmn } from '../src/utils/exportDmn';

function runTests() {
  console.log('=== Running DMN Export & Validation Tests ===\n');

  const filesDir = '/Users/eriklolies/Downloads/files 3';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // --- Test 1: space-zugriff.json ---
  console.log('Test 1: space-zugriff.json');
  const spaceData = JSON.parse(fs.readFileSync(path.join(filesDir, 'space-zugriff.json'), 'utf-8'));
  const spaceFindings = validateDmn(spaceData.nodes, spaceData.edges, spaceData.meta);

  const spaceErrors = spaceFindings.filter((f) => f.level === 'error');
  const spaceWarnings = spaceFindings.filter((f) => f.level === 'warning');
  const spaceHints = spaceFindings.filter((f) => f.level === 'hint');

  assert(spaceErrors.length === 0, `space-zugriff: 0 errors (got ${spaceErrors.length})`);
  assert(spaceWarnings.length === 0, `space-zugriff: 0 warnings (got ${spaceWarnings.length})`);
  assert(spaceHints.length === 1, `space-zugriff: 1 hint (got ${spaceHints.length})`);

  const spaceExport = exportDmn(spaceData.meta, spaceData.nodes, spaceData.edges);
  assert(spaceExport.success === true, 'space-zugriff: export succeeds');
  assert(spaceExport.rows.length === 5, `space-zugriff: 5 rules (got ${spaceExport.rows.length})`);
  assert(spaceExport.columns.length === 4, `space-zugriff: 4 columns (got ${spaceExport.columns.length})`);

  // Check Rule 2 has annotation
  const rule2Notes = spaceExport.rows[1]?.notes?.join(' | ') || '';
  assert(rule2Notes.includes('Notiz #4:'), `space-zugriff: Rule 2 contains 'Notiz #4:' (got: "${rule2Notes}")`);

  // Check XML contains inputData and knowledgeSource
  const xml = spaceExport.xml || '';
  const inputDataMatches = (xml.match(/<inputData/g) || []).length;
  const knowledgeSourceMatches = (xml.match(/<knowledgeSource/g) || []).length;
  assert(inputDataMatches === 4, `space-zugriff: 4 inputData in XML (got ${inputDataMatches})`);
  assert(knowledgeSourceMatches === 1, `space-zugriff: 1 knowledgeSource in XML (got ${knowledgeSourceMatches})`);
  assert(xml.includes('hitPolicy="UNIQUE"'), 'space-zugriff: hitPolicy="UNIQUE" in XML');

  // --- Test 2: test-warnungen.json ---
  console.log('\nTest 2: test-warnungen.json');
  const warnData = JSON.parse(fs.readFileSync(path.join(filesDir, 'test-warnungen.json'), 'utf-8'));
  const warnFindings = validateDmn(warnData.nodes, warnData.edges, warnData.meta);

  const warnErrors = warnFindings.filter((f) => f.level === 'error');
  const warnWarnings = warnFindings.filter((f) => f.level === 'warning');
  const warnHints = warnFindings.filter((f) => f.level === 'hint');

  assert(warnErrors.length === 0, `test-warnungen: 0 errors (got ${warnErrors.length})`);
  assert(warnWarnings.length === 4, `test-warnungen: 4 warnings (got ${warnWarnings.length})`);
  assert(warnHints.length === 2, `test-warnungen: 2 hints (got ${warnHints.length})`);

  // Check finding for duplicate label includes nodeIds 'a2' and 'a5'
  const dupLabelFinding = warnWarnings.find((w) => w.nodeIds.includes('a2') && w.nodeIds.includes('a5'));
  assert(dupLabelFinding !== undefined, `test-warnungen: warning exists referencing nodes a2 and a5 (#2, #5)`);

  const warnExport = exportDmn(warnData.meta, warnData.nodes, warnData.edges);
  assert(warnExport.success === true, 'test-warnungen: export succeeds despite warnings');
  assert(warnExport.rows.length === 3, `test-warnungen: 3 rules (got ${warnExport.rows.length})`);
  assert(warnExport.columns.length === 3, `test-warnungen: 3 columns (got ${warnExport.columns.length})`);

  // --- Test 3: test-fehler.json ---
  console.log('\nTest 3: test-fehler.json');
  const fehlerData = JSON.parse(fs.readFileSync(path.join(filesDir, 'test-fehler.json'), 'utf-8'));
  const fehlerFindings = validateDmn(fehlerData.nodes, fehlerData.edges, fehlerData.meta);

  const fehlerErrors = fehlerFindings.filter((f) => f.level === 'error');
  const fehlerWarnings = fehlerFindings.filter((f) => f.level === 'warning');
  const fehlerHints = fehlerFindings.filter((f) => f.level === 'hint');

  assert(fehlerErrors.length === 7, `test-fehler: 7 errors (got ${fehlerErrors.length})`);
  assert(fehlerWarnings.length === 0, `test-fehler: 0 warnings (got ${fehlerWarnings.length})`);
  assert(fehlerHints.length === 0, `test-fehler: 0 hints (got ${fehlerHints.length})`);

  const fehlerExport = exportDmn(fehlerData.meta, fehlerData.nodes, fehlerData.edges);
  assert(fehlerExport.success === false, 'test-fehler: export blocked (success === false)');
  assert(fehlerExport.xml === null, 'test-fehler: xml is null');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
