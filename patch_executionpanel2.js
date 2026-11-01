const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const handleSubmit = (e: React.FormEvent) => {',
  'export const handleSubmitTemp = (e: React.FormEvent) => {' // To be replaced in the next pass
);

code = code.replace(
  'onSubmit={(e) => { e.preventDefault(); onExecute(formDataRef.current); }}',
  'onSubmit={handleSubmit}'
);

if (!code.includes('onSubmit={handleSubmit}')) {
    code = code.replace('onSubmit={(e) => {', 'onSubmit={handleSubmit}\n  // {(e) => {');
}


code = code.replace(
`export const handleSubmitTemp = (e: React.FormEvent) => {
    e.preventDefault();
    if (schema) {
      try {
        schema.parse(formDataRef.current);
        setValidationError(null);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setValidationError(err.errors.map(e => e.message).join(", "));
          return;
        }
      }
    } else {
        setValidationError(null);
    }

    onExecute(formDataRef.current);
  };`,
`const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schema) {
      try {
        schema.parse(formDataRef.current);
        setValidationError(null);
      } catch (err) {
        if (err instanceof z.ZodError) {
          setValidationError(err.errors.map((e: any) => e.message).join(", "));
          return;
        }
      }
    } else {
        setValidationError(null);
    }

    onExecute(formDataRef.current);
  };`
);


fs.writeFileSync(file, code);
