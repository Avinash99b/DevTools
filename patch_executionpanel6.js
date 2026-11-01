const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const submit = (e: React.FormEvent) => {\n    e.preventDefault();\n    onExecute(formDataRef.current);\n  };',
  ''
);

fs.writeFileSync(file, code);
