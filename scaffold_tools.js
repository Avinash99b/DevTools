const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend/web/src/app/tools');

const tools = [
  { name: 'TextCaseConverter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Text Case Converter', desc: 'Convert text between different letter cases.' },
  { name: 'TextCleaner', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Text Cleaner', desc: 'Clean, trim, and manipulate whitespace in text.' },
  { name: 'SlugGenerator', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Slug Generator', desc: 'Generate URL-friendly slugs from strings.' },
  { name: 'WordCounter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Word/Character Counter', desc: 'Count characters, words, and lines in a text.' },
  { name: 'JsonToJs', category: 'json-utils', categoryId: 'ToolCategories.JSON', title: 'JSON to JS Object', desc: 'Convert JSON strings into JavaScript objects.' },
  { name: 'JsToJson', category: 'json-utils', categoryId: 'ToolCategories.JSON', title: 'JS Object to JSON', desc: 'Convert JavaScript objects into JSON format.' },
  { name: 'JsonFormatter', category: 'json-utils', categoryId: 'ToolCategories.JSON', title: 'JSON Formatter', desc: 'Format and beautify JSON data.' },
  { name: 'XmlFormatter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'XML Formatter', desc: 'Format and beautify XML data.' },
  { name: 'YamlJsonConverter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'YAML / JSON Converter', desc: 'Convert between YAML and JSON formats.' },
  { name: 'UrlEncoder', category: 'endecoders', categoryId: 'ToolCategories.ENDECODERS', title: 'URL Encoder / Decoder', desc: 'Encode and decode URLs.' },
  { name: 'Base64Encoder', category: 'endecoders', categoryId: 'ToolCategories.ENDECODERS', title: 'Base64 Encoder / Decoder', desc: 'Encode and decode Base64 strings.' },
  { name: 'HtmlEscaper', category: 'endecoders', categoryId: 'ToolCategories.ENDECODERS', title: 'HTML Escaper / Unescaper', desc: 'Escape and unescape HTML entities.' },
  { name: 'RegexTester', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Regex Tester', desc: 'Test regular expressions against text.' },
  { name: 'ColorConverter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Color Converter', desc: 'Convert between different color formats (HEX, RGB, HSL).' },
  { name: 'HashGenerator', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Hash Generator', desc: 'Generate cryptographic hashes (MD5, SHA-1, SHA-256).' },
  { name: 'TimestampConverter', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Timestamp Converter', desc: 'Convert between Unix timestamps and human-readable dates.' },
  { name: 'UuidGenerator', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'UUID Generator', desc: 'Generate random UUIDs.' },
  { name: 'DiffChecker', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Diff Checker', desc: 'Compare text and find differences.' },
  { name: 'MarkdownPreview', category: 'dev-utils', categoryId: 'ToolCategories.DEV_UTILS', title: 'Markdown to HTML', desc: 'Convert Markdown to HTML.' },
  { name: 'ImageResizer', category: 'image-tools', categoryId: 'ToolCategories.IMAGE', title: 'Image Resizer', desc: 'Resize images to exact dimensions.' },
  { name: 'ImageRescaler', category: 'image-tools', categoryId: 'ToolCategories.IMAGE', title: 'Image Rescaler', desc: 'Scale images by percentage.' },
  { name: 'ImageCropper', category: 'image-tools', categoryId: 'ToolCategories.IMAGE', title: 'Image Cropper', desc: 'Crop images based on coordinates.' },
  { name: 'ImageFormatConverter', category: 'image-tools', categoryId: 'ToolCategories.IMAGE', title: 'Image Format Converter', desc: 'Convert images to different formats.' },
  { name: 'QrCodeGenerator', category: 'image-tools', categoryId: 'ToolCategories.IMAGE', title: 'QR Code Generator', desc: 'Generate QR codes from URLs or text.' }
];

tools.forEach(tool => {
  const fileContent = `import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { BaseTool } from "../../components/BaseTool";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";

function ${tool.name}() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<DevToolOutput | undefined>();

  const toolMeta = {
    id: "${tool.name.toLowerCase()}-tool",
    name: "${tool.title}",
    author: "System",
    categoryId: ${tool.categoryId},
    description: "${tool.desc}",
    tool: ${tool.name}
  };

  async function execute(data: Record<string, any>) {
    setIsExecuting(true);
    try {
      // Execution logic goes here
      setOutput({ type: "text", data: "Result pending..." });
      setLogs((val) => [...val, { level: "success", message: "Execution completed", timestamp: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      setLogs((val) => [...val, { level: "error", message: e.message || "Execution Failed", timestamp: new Date().toLocaleTimeString() }]);
    }
    setIsExecuting(false);
  }

  return (
    <BaseTool
      toolMeta={toolMeta}
      isExecuting={isExecuting}
      logs={logs}
      output={output}
      onExecute={execute}
      clearLogs={() => setLogs([])}
      fields={[
         {
          name: "input",
          type: "textarea",
          label: "Input Text",
          placeholder: "Enter text...",
          required: true
        }
      ]}
    />
  );
}

registerDevTool({
  author: "System",
  categoryId: ${tool.categoryId},
  description: "${tool.desc}",
  id: "${tool.name.toLowerCase()}-tool",
  name: "${tool.title}",
  tool: ${tool.name}
});
`;

  const dirPath = path.join(baseDir, tool.category);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${tool.name}.tsx`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileContent);
    console.log(`Created ${filePath}`);
  } else {
      console.log(`Skipped ${filePath} (already exists)`);
  }
});
