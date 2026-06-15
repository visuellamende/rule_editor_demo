const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/id:\s*'e(10|11|12|13)',\s*source:\s*'n(12|13|14|15)',\s*target:\s*'n(2|4|6|7)',\s*type:\s*'labeled',\s*label:\s*null,/g, (match) => {
    return match.replace(/type:\s*'labeled'/, "type: 'default',\n      targetHandle: 'input-target'");
  });
  fs.writeFileSync(file, content);
}

patchFile('src/data/exampleMap.ts');
patchFile('src/data/exampleMapEn.ts');
