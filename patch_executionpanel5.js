const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const submit = \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*onExecute\(formDataRef\.current\);\s*\};/g,
  ''
);

fs.writeFileSync(file, code);
