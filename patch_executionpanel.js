const fs = require('fs');
const file = 'frontend/web/src/app/components/ExecutionPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { z } from "zod";')) {
  code = code.replace('import { useIsMobile } from "./ui/use-mobile";', 'import { useIsMobile } from "./ui/use-mobile";\nimport { z } from "zod";');
}

if (!code.includes('schema?: z.ZodType<any, any, any>;')) {
  code = code.replace('error?: string;', 'error?: string;\n  schema?: z.ZodType<any, any, any>;');
}

if (!code.includes('schema,')) {
    code = code.replace('error }: ExecutionPanelProps) {', 'error, schema }: ExecutionPanelProps) {');
}

code = code.replace('const [error, setError] = useState<string | null>(null);', ''); // Ensure no duplicate error state if it exists

if(!code.includes('const [validationError, setValidationError] = useState<string | null>(null);')) {
    code = code.replace('const formDataRef = useRef(formData);', 'const [validationError, setValidationError] = useState<string | null>(null);\n  const formDataRef = useRef(formData);');
}

const onExecutePatch = `
  const handleSubmit = (e: React.FormEvent) => {
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
  };
`;

if (!code.includes('const handleSubmit =')) {
    code = code.replace('const handleFieldChange = (name: string, value: any) => applyField(name, value);', 'const handleFieldChange = (name: string, value: any) => applyField(name, value);\n' + onExecutePatch);
}


code = code.replace('onSubmit={(e) => { e.preventDefault(); onExecute(formDataRef.current); }}', 'onSubmit={handleSubmit}');


if (code.includes('{error && (')) {
    code = code.replace('{error && (', `{(error || validationError) && (
            <div role="alert" style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
              padding: "var(--dt-space-3)",
              border: "1px solid var(--dt-accent-error)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-accent-error)",
              fontSize: "var(--dt-text-sm)",
              marginBottom: "var(--dt-space-4)"
            }}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{error || validationError}</span>
            </div>
          )}

          {false && (`);
}

fs.writeFileSync(file, code);
