const fs = require('fs');
const file = 'frontend/web/src/app/components/BaseTool.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'error={error}',
  'error={error}\n        schema={toolMeta.schema}'
);

fs.writeFileSync(file, code);
