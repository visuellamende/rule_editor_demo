import fs from 'fs';

function updateMap(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const replacements = {
    'n1': '{ x: 50, y: 360 }',
    'n2': '{ x: 390, y: 420 }',
    'n3': '{ x: 730, y: 460 }',
    'n4': '{ x: 730, y: 320 }',
    'n6': '{ x: 1070, y: 460 }',
    'n7': '{ x: 1070, y: 180 }',
    'n8': '{ x: 1410, y: 470 }',
    'n9': '{ x: 1410, y: 330 }',
    'n10': '{ x: 1410, y: 190 }',
    'n11': '{ x: 1410, y: 50 }',
    'n12': '{ x: 420, y: 300 }',
    'n13': '{ x: 760, y: 200 }',
    'n14': '{ x: 1100, y: 340 }',
    'n15': '{ x: 1100, y: 60 }',
  };

  for (const [id, posStr] of Object.entries(replacements)) {
    const regex = new RegExp(`(id:\\s*'${id}',\\s*type:\\s*'ruleNode',\\s*position:\\s*)\\{[^}]+\\}`, 'g');
    content = content.replace(regex, `$1${posStr}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

updateMap('./src/data/exampleMap.ts');
updateMap('./src/data/exampleMapEn.ts');
