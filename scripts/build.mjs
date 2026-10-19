import {readFile,writeFile,mkdir} from 'node:fs/promises';
const core=await readFile(new URL('../src/core.js',import.meta.url),'utf8');
const card=await readFile(new URL('../src/card.js',import.meta.url),'utf8');
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/open-ecodan-dashboard.js',import.meta.url),'// Open Ecodan Dashboard v0.1.0 | MIT\n{\n'+core.replaceAll(/^export /gm,'')+'\n'+card.replace(/^import .*;\n/,'')+'\n}\n');
