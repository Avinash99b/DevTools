const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<form onSubmit={submit}',
  '<form onSubmit={handleSubmit}'
);

code = code.replace(
  'err instanceof z.ZodError',
  'err && typeof err === "object" && "issues" in err'
);

code = code.replace(
  'err.errors.map',
  '(err as z.ZodError).issues.map'
);


fs.writeFileSync(file, code);
