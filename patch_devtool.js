const fs = require('fs');
const file = 'frontend/web/src/app/types/DevTool.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { z } from "zod";')) {
  code = 'import { z } from "zod";\n' + code;
}

if (!code.includes('schema?: z.ZodType<any, any, any>;')) {
  code = code.replace('shortcuts?: string[]', 'shortcuts?: string[],\n    schema?: z.ZodType<any, any, any>;');
}

fs.writeFileSync(file, code);
