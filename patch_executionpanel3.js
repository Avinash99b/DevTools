const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'onSubmit={(e) => { e.preventDefault(); onExecute(formDataRef.current); }}',
  'onSubmit={handleSubmit}'
);

if(code.includes('onSubmit={(e) => { e.preventDefault(); onExecute(formDataRef.current); }}')) {
    console.log("Found raw onSubmit");
} else {
    code = code.replace(/onSubmit=\{\(e\) => \{\s*e\.preventDefault\(\);\s*onExecute\(formDataRef\.current\);\s*\}\}/g, 'onSubmit={handleSubmit}');
}

fs.writeFileSync(file, code);
