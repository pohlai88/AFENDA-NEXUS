const fs = require('fs');
const dir = 'c:/AI-BOS/NEXUSCANON-AFENDA/packages/db/src/schema/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let total = 0;
files.forEach(f => {
  const c = fs.readFileSync(dir + f, 'utf8');
  const m = [...c.matchAll(/\.table\(\s*['`]([^'`]+)['`]/g)];
  if (m.length > 0) {
    console.log(`${f}: ${m.length} tables`);
    m.forEach(x => console.log(`  - ${x[1]}`));
    total += m.length;
  }
});
console.log(`\nGRAND TOTAL: ${total}`);
