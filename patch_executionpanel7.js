const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Defer into a promise chain so synchronous throws from onExecute are also
    // captured (tools surface their own error state).
    void Promise.resolve().then(() => onExecute(formDataRef.current)).catch(() => { /* handled by tool */ });
  };`,
``
);

code = code.replace(
`    onExecute(formDataRef.current);`,
`    void Promise.resolve().then(() => onExecute(formDataRef.current)).catch(() => { /* handled by tool */ });`
);

fs.writeFileSync(file, code);
