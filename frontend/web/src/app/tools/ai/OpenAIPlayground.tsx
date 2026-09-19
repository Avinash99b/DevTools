import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { marked } from "marked";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  Gauge,
  Hash,
  ImagePlus,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Send,
  Shield,
  SlidersHorizontal,
  Square,
  Timer,
  Trash2,
  User,
  X,
} from "lucide-react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { useIsMobile } from "../../components/ui/use-mobile";
import { useAvailableHeight } from "../../components/ui/use-available-height";

const COOKIE_PREFIX = "dt_ai_";
const ENDPOINT_COOKIE = COOKIE_PREFIX + "endpoint";
const TOKEN_COOKIE = COOKIE_PREFIX + "token";
const ENDPOINT_HEADERS_COOKIE = COOKIE_PREFIX + "endpoint_headers";
const MODEL_HEADERS_COOKIE = COOKIE_PREFIX + "model_headers";
const CHATS_INDEX_COOKIE = COOKIE_PREFIX + "chats";
const CHAT_COOKIE = (id: string) => COOKIE_PREFIX + "chat_" + id;
const MAX_COOKIE_CHARS = 3500;

export interface CustomHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentPart[];
}

interface Attachment {
  id: string;
  dataUrl: string;
  name: string;
}

interface SavedChat {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
}

interface ModelInfo {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

interface BenchmarkResult {
  model: string;
  totalMs: number;
  ttftMs: number;
  tokens: number;
  tps: number;
  source: "usage" | "chunks";
}

function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 86400}; SameSite=Lax`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1] || "") : "";
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "chat_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadHeadersFromCookie(cookieName: string): CustomHeader[] {
  const raw = getCookie(cookieName);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is CustomHeader => item && typeof item === "object" && typeof item.key === "string")
        .map((item) => ({
          id: item.id || makeId(),
          key: item.key || "",
          value: typeof item.value === "string" ? item.value : "",
          enabled: item.enabled !== false,
        }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

function loadModelHeadersFromCookie(): Record<string, CustomHeader[]> {
  const raw = getCookie(MODEL_HEADERS_COOKIE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: Record<string, CustomHeader[]> = {};
      for (const [modelId, headers] of Object.entries(parsed)) {
        if (Array.isArray(headers)) {
          result[modelId] = headers
            .filter((item): item is CustomHeader => item && typeof item === "object" && typeof item.key === "string")
            .map((item) => ({
              id: item.id || makeId(),
              key: item.key || "",
              value: typeof item.value === "string" ? item.value : "",
              enabled: item.enabled !== false,
            }));
        }
      }
      return result;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function buildHeaderRecord(headers: CustomHeader[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const h of headers) {
    if (h.enabled && h.key.trim()) {
      record[h.key.trim()] = h.value;
    }
  }
  return record;
}

function combineHeaders(
  token: string,
  endpointHeaders: CustomHeader[],
  modelHeaders?: CustomHeader[],
  additionalHeaders?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token.trim()) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }
  const epRec = buildHeaderRecord(endpointHeaders);
  for (const [k, v] of Object.entries(epRec)) {
    headers[k] = v;
  }
  if (modelHeaders) {
    const modelRec = buildHeaderRecord(modelHeaders);
    for (const [k, v] of Object.entries(modelRec)) {
      headers[k] = v;
    }
  }
  if (additionalHeaders) {
    for (const [k, v] of Object.entries(additionalHeaders)) {
      headers[k] = v;
    }
  }
  return headers;
}

function loadChatsFromCookies(): SavedChat[] {
  const indexRaw = getCookie(CHATS_INDEX_COOKIE);
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(indexRaw || "[]");
    if (Array.isArray(parsed)) ids = parsed;
  } catch {
    /* ignore */
  }
  const loaded: SavedChat[] = [];
  for (const id of ids) {
    try {
      const chat = JSON.parse(getCookie(CHAT_COOKIE(id))) as SavedChat;
      if (chat && chat.id && Array.isArray(chat.messages)) loaded.push(chat);
    } catch {
      /* skip corrupt chat */
    }
  }
  return loaded;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong.";
}

const MAX_IMAGE_MB = 4;

function readImageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function contentText(content: string | ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

function ContentParts({ parts }: { parts: ContentPart[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
      {parts.map((part, i) =>
        part.type === "image_url" ? (
          <img
            key={i}
            src={part.image_url.url}
            alt="Attached image"
            style={{
              maxWidth: "240px",
              maxHeight: "200px",
              borderRadius: "var(--dt-radius-md)",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <span key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {part.text}
          </span>
        ),
      )}
    </div>
  );
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchModels(endpoint: string, token: string, customHeaders?: CustomHeader[]): Promise<ModelInfo[]> {
  const headers = combineHeaders(token, customHeaders || []);
  const res = await fetch(endpoint + "/models", {
    headers,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const json = await res.json();
  const data: ModelInfo[] = json?.data || [];
  return data.sort((a, b) => a.id.localeCompare(b.id));
}

function nowMs() {
  return performance.now();
}

const BENCHMARK_PROMPT =
  "You are being benchmarked. Generate a long, coherent essay of roughly 400 words about the history of computing. Write naturally and do not stop early.";

async function streamSSE(
  endpoint: string,
  token: string,
  body: Record<string, unknown>,
  onPayload: (payload: Record<string, unknown>) => void,
  signal?: AbortSignal,
  endpointHeaders?: CustomHeader[],
  modelHeaders?: CustomHeader[],
) {
  const headers = combineHeaders(token, endpointHeaders || [], modelHeaders, {
    "Content-Type": "application/json",
  });
  const res = await fetch(endpoint + "/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const parsed = await res.json();
      message = (parsed as { error?: { message?: string } })?.error?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (!res.body) throw new Error("This endpoint does not support streaming responses.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        onPayload(JSON.parse(payload) as Record<string, unknown>);
      } catch {
        /* partial chunk */
      }
    }
  }
}

function MarkdownContent({ content }: { content: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = escapeHtml(content);
      const parsed = (await Promise.resolve(marked.parse(raw))) as string;
      const safe = parsed.replace(/href="(javascript|data):[^"]*"/gi, 'href="#"');
      if (!cancelled) setHtml(safe);
    })();
    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className="chat-markdown"
      style={{ fontSize: "var(--dt-text-sm)", lineHeight: "var(--dt-leading-relaxed)", wordBreak: "break-word" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function HeadersEditor({
  title,
  subtitle,
  headers,
  onChange,
  onClose,
  inheritedHeaders,
}: {
  title: string;
  subtitle?: string;
  headers: CustomHeader[];
  onChange: (headers: CustomHeader[]) => void;
  onClose?: () => void;
  inheritedHeaders?: CustomHeader[];
}) {
  const addHeader = (key = "", value = "") => {
    onChange([
      ...headers,
      { id: makeId(), key, value, enabled: true },
    ]);
  };

  const updateHeader = (id: string, partial: Partial<CustomHeader>) => {
    onChange(
      headers.map((h) => (h.id === id ? { ...h, ...partial } : h)),
    );
  };

  const removeHeader = (id: string) => {
    onChange(headers.filter((h) => h.id !== id));
  };

  const activeCount = headers.filter((h) => h.enabled && h.key.trim()).length;
  const commonPresets = [
    { label: "HTTP-Referer", key: "HTTP-Referer", placeholder: "https://your-app.com" },
    { label: "X-Title", key: "X-Title", placeholder: "My App Title" },
    { label: "anthropic-version", key: "anthropic-version", placeholder: "2023-06-01" },
    { label: "OpenAI-Beta", key: "OpenAI-Beta", placeholder: "assistants=v2" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dt-space-3)",
        padding: "var(--dt-space-3) var(--dt-space-4)",
        backgroundColor: "var(--dt-bg-tertiary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-md)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--dt-space-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <SlidersHorizontal size={14} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-xs)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
            {title}
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "var(--dt-radius-full)",
              backgroundColor: activeCount > 0 ? "rgba(99, 102, 241, 0.15)" : "var(--dt-bg-elevated)",
              color: activeCount > 0 ? "var(--dt-accent-primary)" : "var(--dt-text-tertiary)",
              fontFamily: "var(--dt-font-mono)",
            }}
          >
            {activeCount} active
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <button
            type="button"
            onClick={() => addHeader()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              backgroundColor: "var(--dt-bg-elevated)",
              border: "1px solid var(--dt-border-secondary)",
              borderRadius: "var(--dt-radius-sm)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-xs)",
              cursor: "pointer",
            }}
          >
            <Plus size={12} /> Add Header
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close headers editor"
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--dt-text-tertiary)",
                cursor: "pointer",
                padding: 2,
                display: "inline-flex",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {subtitle && (
        <p style={{ margin: 0, fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", lineHeight: "var(--dt-leading-normal)" }}>
          {subtitle}
        </p>
      )}

      {headers.length === 0 ? (
        <div
          style={{
            padding: "var(--dt-space-3)",
            textAlign: "center",
            color: "var(--dt-text-tertiary)",
            fontSize: "var(--dt-text-xs)",
            border: "1px dashed var(--dt-border-secondary)",
            borderRadius: "var(--dt-radius-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--dt-space-2)",
            alignItems: "center",
          }}
        >
          <span>No custom headers configured. Click "+ Add Header" or select a preset below:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--dt-space-1)", justifyContent: "center" }}>
            {commonPresets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => addHeader(preset.key, "")}
                style={{
                  padding: "2px 6px",
                  fontSize: "11px",
                  backgroundColor: "var(--dt-bg-elevated)",
                  border: "1px solid var(--dt-border-secondary)",
                  borderRadius: "var(--dt-radius-sm)",
                  color: "var(--dt-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--dt-font-mono)",
                }}
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
          {headers.map((h) => (
            <div
              key={h.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--dt-space-2)",
                opacity: h.enabled ? 1 : 0.6,
              }}
            >
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) => updateHeader(h.id, { enabled: e.target.checked })}
                title={h.enabled ? "Disable header" : "Enable header"}
                style={{ cursor: "pointer", accentColor: "var(--dt-accent-primary)" }}
              />
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                placeholder="Header Name (e.g. HTTP-Referer)"
                spellCheck={false}
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  minHeight: "32px",
                  padding: "4px var(--dt-space-2)",
                  backgroundColor: "var(--dt-bg-secondary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-sm)",
                  color: "var(--dt-text-primary)",
                  fontSize: "var(--dt-text-xs)",
                  fontFamily: "var(--dt-font-mono)",
                  outline: "none",
                }}
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHeader(h.id, { value: e.target.value })}
                placeholder="Header Value"
                spellCheck={false}
                style={{
                  flex: 1.5,
                  boxSizing: "border-box",
                  minHeight: "32px",
                  padding: "4px var(--dt-space-2)",
                  backgroundColor: "var(--dt-bg-secondary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-sm)",
                  color: "var(--dt-text-primary)",
                  fontSize: "var(--dt-text-xs)",
                  fontFamily: "var(--dt-font-mono)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => removeHeader(h.id)}
                title="Remove header"
                aria-label="Remove header"
                style={{
                  minWidth: "28px",
                  height: "28px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  color: "var(--dt-text-tertiary)",
                  cursor: "pointer",
                  borderRadius: "var(--dt-radius-sm)",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {inheritedHeaders && inheritedHeaders.filter((h) => h.enabled && h.key.trim()).length > 0 && (
        <div
          style={{
            marginTop: "var(--dt-space-1)",
            padding: "var(--dt-space-2) var(--dt-space-3)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-secondary)",
            borderRadius: "var(--dt-radius-sm)",
            fontSize: "11px",
            color: "var(--dt-text-tertiary)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
            <Layers size={11} color="var(--dt-accent-primary)" /> Inherited from Endpoint ({inheritedHeaders.filter((h) => h.enabled && h.key.trim()).length}):
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {inheritedHeaders
              .filter((h) => h.enabled && h.key.trim())
              .map((h) => {
                const isOverridden = headers.some((mh) => mh.enabled && mh.key.trim().toLowerCase() === h.key.trim().toLowerCase());
                return (
                  <span
                    key={h.id}
                    title={isOverridden ? "Overridden by model-level header" : undefined}
                    style={{
                      backgroundColor: "var(--dt-bg-elevated)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontFamily: "var(--dt-font-mono)",
                      textDecoration: isOverridden ? "line-through" : "none",
                      opacity: isOverridden ? 0.5 : 1,
                    }}
                  >
                    {h.key}: {h.value || "(empty)"}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function OpenAIPlayground() {
  const isMobile = useIsMobile();
  const availableHeight = useAvailableHeight();

  const [endpoint, setEndpoint] = useState(() => getCookie(ENDPOINT_COOKIE));
  const [token, setToken] = useState(() => getCookie(TOKEN_COOKIE));
  const [endpointHeaders, setEndpointHeaders] = useState<CustomHeader[]>(() =>
    loadHeadersFromCookie(ENDPOINT_HEADERS_COOKIE),
  );
  const [modelHeadersMap, setModelHeadersMap] = useState<Record<string, CustomHeader[]>>(() =>
    loadModelHeadersFromCookie(),
  );
  const [showEndpointHeaders, setShowEndpointHeaders] = useState(false);
  const [showModelHeaders, setShowModelHeaders] = useState(false);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">(() =>
    getCookie(ENDPOINT_COOKIE) && getCookie(TOKEN_COOKIE) ? "connecting" : "idle",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [connectedEndpoint, setConnectedEndpoint] = useState("");
  const [connectedToken, setConnectedToken] = useState("");
  const [connectedEndpointHeaders, setConnectedEndpointHeaders] = useState<CustomHeader[]>(() =>
    loadHeadersFromCookie(ENDPOINT_HEADERS_COOKIE),
  );

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");

  const [temperature, setTemperature] = useState(1);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [chats, setChats] = useState<SavedChat[]>(loadChatsFromCookies);
  const [activeChat, setActiveChat] = useState<SavedChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarkPrompt, setBenchmarkPrompt] = useState("");
  const [benchmarkOutput, setBenchmarkOutput] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const benchmarkAbortRef = useRef<AbortController | null>(null);
  const benchmarkOutputRef = useRef("");
  const autoConnectDoneRef = useRef(false);
  const streamTextRef = useRef("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const currentModelHeaders = selectedModel ? modelHeadersMap[selectedModel] || [] : [];

  function handleEndpointHeadersChange(next: CustomHeader[]) {
    setEndpointHeaders(next);
    setConnectedEndpointHeaders(next);
    setCookie(ENDPOINT_HEADERS_COOKIE, JSON.stringify(next));
  }

  function handleModelHeadersChange(modelId: string, next: CustomHeader[]) {
    const updated = { ...modelHeadersMap, [modelId]: next };
    setModelHeadersMap(updated);
    setCookie(MODEL_HEADERS_COOKIE, JSON.stringify(updated));
  }

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamText, benchmarkOutput, isBenchmarking, benchmarkResult]);

  useEffect(() => {
    if (autoConnectDoneRef.current) return;
    autoConnectDoneRef.current = true;
    const savedEndpoint = getCookie(ENDPOINT_COOKIE);
    const savedToken = getCookie(TOKEN_COOKIE);
    const savedHeaders = loadHeadersFromCookie(ENDPOINT_HEADERS_COOKIE);
    if (savedEndpoint && savedToken) {
      void connectWith(savedEndpoint, savedToken, savedHeaders);
    }
  }, []);

  async function connectWith(ep: string, tk: string, epHeaders: CustomHeader[] = endpointHeaders) {
    const cleanEp = ep.trim().replace(/\/+$/, "");
    const cleanTk = tk.trim();
    if (!cleanEp || !cleanTk) {
      setStatus("error");
      setStatusMessage("Both endpoint URL and API key are required.");
      return;
    }
    setStatus("connecting");
    setStatusMessage("Contacting endpoint...");
    try {
      const data = await fetchModels(cleanEp, cleanTk, epHeaders);
      setModels(data);
      setConnectedEndpoint(cleanEp);
      setConnectedToken(cleanTk);
      setConnectedEndpointHeaders(epHeaders);
      setCookie(ENDPOINT_COOKIE, cleanEp);
      setCookie(TOKEN_COOKIE, cleanTk);
      setCookie(ENDPOINT_HEADERS_COOKIE, JSON.stringify(epHeaders));
      setStatus("connected");
      setStatusMessage(`Connected — ${data.length} model${data.length === 1 ? "" : "s"} available`);
      setError("");
      setNotice(
        "Endpoint, API key, and custom headers stored in browser cookies. Anything sent to the model leaves this page — treat credentials as sensitive.",
      );
    } catch (e: unknown) {
      setConnectedEndpoint("");
      setConnectedToken("");
      setStatus("error");
      setStatusMessage(getErrorMessage(e));
    }
  }

  function connect() {
    void connectWith(endpoint, token, endpointHeaders);
  }

  async function refreshModels() {
    if (!connectedEndpoint || !connectedToken) return;
    setModelsLoading(true);
    try {
      const data = await fetchModels(connectedEndpoint, connectedToken, connectedEndpointHeaders);
      setModels(data);
      setStatus("connected");
      setStatusMessage(`Connected — ${data.length} model${data.length === 1 ? "" : "s"} available`);
      setError("");
    } catch (e: unknown) {
      setStatus("error");
      setStatusMessage(getErrorMessage(e));
    } finally {
      setModelsLoading(false);
    }
  }

  function startChat(model: string) {
    abortRef.current?.abort();
    benchmarkAbortRef.current?.abort();
    setSelectedModel(model);
    setActiveChat({
      id: makeId(),
      title: "New chat",
      model,
      messages: [],
    });
    setMessages([]);
    setInput("");
    setAttachments([]);
    setStreamText("");
    setStreamTextRef("");
    setError("");
    setNotice("");
    setIsBenchmarking(false);
    setBenchmarkResult(null);
    setBenchmarkPrompt("");
    setBenchmarkOutput("");
    benchmarkOutputRef.current = "";
  }

  function newChat() {
    if (!selectedModel) return;
    startChat(selectedModel);
  }

  function loadChat(id: string) {
    abortRef.current?.abort();
    benchmarkAbortRef.current?.abort();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    setActiveChat(chat);
    setMessages(chat.messages);
    setSelectedModel(chat.model);
    setInput("");
    setAttachments([]);
    setStreamText("");
    setStreamTextRef("");
    setError("");
    setNotice("");
    setIsBenchmarking(false);
    setBenchmarkResult(null);
    setBenchmarkPrompt("");
    setBenchmarkOutput("");
    benchmarkOutputRef.current = "";
  }

  function saveCurrentChat() {
    if (!activeChat) return;
    const title =
      activeChat.title === "New chat"
        ? (contentText(messages[0]?.content || "") || "Image chat").slice(0, 42)
        : activeChat.title;
    const chat: SavedChat = { ...activeChat, title, messages };
    const serialized = JSON.stringify(chat);
    const sizeKb = (encodeURIComponent(serialized).length / 1024).toFixed(1);

    const exists = chats.some((c) => c.id === chat.id);
    const next = exists ? chats.map((c) => (c.id === chat.id ? chat : c)) : [...chats, chat];
    setChats(next);
    setActiveChat(chat);
    setCookie(CHAT_COOKIE(chat.id), serialized);
    setCookie(CHATS_INDEX_COOKIE, JSON.stringify(next.map((c) => c.id)));

    if (encodeURIComponent(serialized).length > MAX_COOKIE_CHARS) {
      setNotice(
        `Chat saved but is ~${sizeKb} KB — this may exceed browser cookie limits and could be truncated. Export it soon.`,
      );
    } else {
      setNotice("Chat saved to cookies.");
    }
  }

  function deleteChat(id: string) {
    const next = chats.filter((c) => c.id !== id);
    setChats(next);
    deleteCookie(CHAT_COOKIE(id));
    setCookie(CHATS_INDEX_COOKIE, JSON.stringify(next.map((c) => c.id)));
    if (activeChat?.id === id) {
      setActiveChat(null);
      setMessages([]);
    }
    setNotice("");
  }

  function setStreamTextRef(value: string) {
    streamTextRef.current = value;
  }

  async function sendMessage() {
    const text = input.trim();
    const hasImages = attachments.length > 0;
    if ((!text && !hasImages) || !activeChat || !selectedModel || !connectedEndpoint || isStreaming || isBenchmarking) return;

    const parts: ContentPart[] = [];
    if (text) parts.push({ type: "text", text });
    for (const attachment of attachments) {
      parts.push({ type: "image_url", image_url: { url: attachment.dataUrl } });
    }
    const content: string | ContentPart[] = parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts;

    const userMessage: ChatMessage = { role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setAttachments([]);
    setError("");
    setNotice("");
    setStreamText("");
    setStreamTextRef("");

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      await streamSSE(
        connectedEndpoint,
        connectedToken,
        {
          model: selectedModel,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
          temperature,
        },
        (payload) => {
          const choices = payload.choices as Array<{ delta?: { content?: string } }> | undefined;
          const delta = choices?.[0]?.delta?.content;
          if (typeof delta === "string") {
            streamTextRef.current += delta;
            setStreamText(streamTextRef.current);
          }
        },
        controller.signal,
        connectedEndpointHeaders,
        currentModelHeaders,
      );
      const assistantContent = streamTextRef.current;
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        const assistantContent = streamTextRef.current;
        setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
      } else {
        setError(getErrorMessage(e));
      }
    } finally {
      setIsStreaming(false);
      setStreamText("");
      setStreamTextRef("");
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_MB * 1024 * 1024,
    );
    if (images.length !== files.length) {
      setNotice(`Only image files up to ${MAX_IMAGE_MB} MB can be attached.`);
    }
    const loaded = await Promise.all(
      images.map(async (file) => ({
        id: makeId(),
        name: file.name,
        dataUrl: await readImageData(file),
      })),
    );
    setAttachments((prev) => [...prev, ...loaded]);
  }

  async function runBenchmark() {
    if (!connectedEndpoint || !connectedToken || !selectedModel || isStreaming || isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    setBenchmarkPrompt(BENCHMARK_PROMPT);
    setBenchmarkOutput("");
    benchmarkOutputRef.current = "";
    setError("");
    setNotice("");

    const controller = new AbortController();
    benchmarkAbortRef.current = controller;
    const start = nowMs();
    let firstTokenMs = 0;
    let chunkTokens = 0;
    let usageTokens = 0;

    try {
      await streamSSE(
        connectedEndpoint,
        connectedToken,
        {
          model: selectedModel,
          messages: [{ role: "user", content: BENCHMARK_PROMPT }],
          stream: true,
          temperature: 0.7,
          max_tokens: 512,
          stream_options: { include_usage: true },
        },
        (payload) => {
          const choices = payload.choices as Array<{ delta?: { content?: string } }> | undefined;
          const delta = choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            if (firstTokenMs === 0) firstTokenMs = nowMs() - start;
            chunkTokens += 1;
            benchmarkOutputRef.current += delta;
            setBenchmarkOutput(benchmarkOutputRef.current);
          }
          const usage = payload.usage as { completion_tokens?: number } | undefined;
          if (usage?.completion_tokens) usageTokens = usage.completion_tokens;
        },
        controller.signal,
        connectedEndpointHeaders,
        currentModelHeaders,
      );

      const totalMs = Math.max(1, nowMs() - start);
      const tokens = usageTokens > 0 ? usageTokens : chunkTokens;
      setBenchmarkResult({
        model: selectedModel,
        totalMs,
        ttftMs: firstTokenMs || totalMs,
        tokens,
        tps: tokens / (totalMs / 1000),
        source: usageTokens > 0 ? "usage" : "chunks",
      });
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        setError("Benchmark failed: " + getErrorMessage(e));
      }
    } finally {
      setIsBenchmarking(false);
      benchmarkAbortRef.current = null;
    }
  }

  function stopBenchmark() {
    benchmarkAbortRef.current?.abort();
  }

  const statusColor =
    status === "connected"
      ? "var(--dt-status-success)"
      : status === "connecting"
        ? "var(--dt-status-running)"
        : status === "error"
          ? "var(--dt-status-error)"
          : "var(--dt-status-idle)";

  const activeEndpointHeadersCount = endpointHeaders.filter((h) => h.enabled && h.key.trim()).length;
  const activeModelHeadersCount = currentModelHeaders.filter((h) => h.enabled && h.key.trim()).length;

  const inputRow = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-3)" }}>
      <div style={{ display: "flex", gap: "var(--dt-space-3)", flexWrap: "wrap" }}>
        <div style={{ flex: isMobile ? "1 1 100%" : 1, minWidth: isMobile ? "100%" : "220px" }}>
          <label style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", display: "block", marginBottom: "var(--dt-space-1)" }}>
            Endpoint URL
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.openai.com/v1"
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-sm)",
              fontFamily: "var(--dt-font-mono)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: isMobile ? "1 1 100%" : 1, minWidth: isMobile ? "100%" : "220px" }}>
          <label style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", display: "block", marginBottom: "var(--dt-space-1)" }}>
            API Key
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="sk-..."
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-sm)",
              fontFamily: "var(--dt-font-mono)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--dt-space-2)", alignSelf: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowEndpointHeaders((prev) => !prev)}
            title="Configure custom headers sent with all requests to this endpoint"
            aria-label="Toggle endpoint headers"
            style={{
              minHeight: "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: showEndpointHeaders || activeEndpointHeadersCount > 0 ? "rgba(99, 102, 241, 0.12)" : "var(--dt-bg-tertiary)",
              color: showEndpointHeaders || activeEndpointHeadersCount > 0 ? "var(--dt-accent-primary)" : "var(--dt-text-secondary)",
              border: "1px solid " + (showEndpointHeaders || activeEndpointHeadersCount > 0 ? "var(--dt-accent-primary)" : "var(--dt-border-primary)"),
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
            }}
          >
            <SlidersHorizontal size={15} />
            <span>Headers</span>
            {activeEndpointHeadersCount > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "0 6px",
                  backgroundColor: "var(--dt-accent-primary)",
                  color: "white",
                  borderRadius: "var(--dt-radius-full)",
                  fontWeight: "var(--dt-font-bold)",
                }}
              >
                {activeEndpointHeadersCount}
              </span>
            )}
            {showEndpointHeaders ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={connect}
            disabled={status === "connecting"}
            style={{
              minHeight: "42px",
              padding: "var(--dt-space-2) var(--dt-space-5)",
              backgroundColor: "var(--dt-accent-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-semibold)",
              cursor: status === "connecting" ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-2)",
              opacity: status === "connecting" ? 0.6 : 1,
            }}
          >
            {status === "connecting" ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Connecting
              </>
            ) : (
              <>
                <Shield size={16} /> {status === "connected" ? "Reconnect" : "Connect"}
              </>
            )}
          </button>
        </div>
      </div>

      {showEndpointHeaders && (
        <HeadersEditor
          title="Endpoint-Level Custom Headers"
          subtitle="Sent on /models and inherited by all model completions from this endpoint (e.g. HTTP-Referer, X-Title, organization headers)."
          headers={endpointHeaders}
          onChange={handleEndpointHeadersChange}
          onClose={() => setShowEndpointHeaders(false)}
        />
      )}
    </div>
  );

  const modelsPanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: 1,
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--dt-space-4) var(--dt-space-5)",
          borderBottom: "1px solid var(--dt-border-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <Bot size={16} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
            Available Models
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>{models.length}</span>
          <button
            type="button"
            onClick={refreshModels}
            disabled={!connectedEndpoint || modelsLoading}
            title="Refresh models"
            aria-label="Refresh models"
            style={{
              width: "32px",
              height: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-secondary)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: modelsLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "var(--dt-space-3)" }}>
        {status === "connecting" && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", padding: "var(--dt-space-4)", color: "var(--dt-text-tertiary)", fontSize: "var(--dt-text-sm)" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading models...
          </div>
        )}

        {status === "connected" && models.length === 0 && !modelsLoading && (
          <div style={{ padding: "var(--dt-space-6)", textAlign: "center", color: "var(--dt-text-tertiary)", fontSize: "var(--dt-text-sm)" }}>
            No models returned by this endpoint.
          </div>
        )}

        {status === "connected" && models.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
            {models.map((model) => {
              const active = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => startChat(model.id)}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    padding: "var(--dt-space-3)",
                    backgroundColor: active ? "rgba(99, 102, 241, 0.1)" : "var(--dt-bg-tertiary)",
                    border: active ? "1px solid var(--dt-accent-primary)" : "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    transition: "all var(--dt-transition-fast)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--dt-space-1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--dt-font-mono)",
                      fontSize: "var(--dt-text-sm)",
                      color: active ? "var(--dt-accent-primary)" : "var(--dt-text-primary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {model.id}
                  </span>
                  <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                    {formatDate(model.created)}
                    {model.owned_by ? ` · ${model.owned_by}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {status !== "connected" && status !== "connecting" && (
          <div
            style={{
              padding: "var(--dt-space-8) var(--dt-space-4)",
              textAlign: "center",
              color: "var(--dt-text-tertiary)",
              fontSize: "var(--dt-text-sm)",
              border: "1px dashed var(--dt-border-secondary)",
              borderRadius: "var(--dt-radius-md)",
              marginTop: "var(--dt-space-3)",
            }}
          >
            Connect to an endpoint to see its models.
          </div>
        )}
      </div>
    </div>
  );

  const savedChips = chats.length > 0 && (
    <div
      style={{
        display: "flex",
        gap: "var(--dt-space-2)",
        flexWrap: "wrap",
        alignItems: "center",
        paddingBottom: "var(--dt-space-3)",
        borderBottom: "1px solid var(--dt-border-primary)",
        marginBottom: "var(--dt-space-3)",
      }}
    >
      <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Save size={12} /> Saved:
      </span>
      {chats.map((chat) => {
        const active = activeChat?.id === chat.id;
        return (
          <span
            key={chat.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              padding: "var(--dt-space-1) var(--dt-space-2)",
              backgroundColor: active ? "var(--dt-accent-primary)" : "var(--dt-bg-tertiary)",
              color: active ? "white" : "var(--dt-text-secondary)",
              border: "1px solid " + (active ? "var(--dt-accent-primary)" : "var(--dt-border-primary)"),
              borderRadius: "var(--dt-radius-full)",
              fontSize: "var(--dt-text-xs)",
              cursor: "pointer",
              transition: "all var(--dt-transition-fast)",
              maxWidth: "220px",
            }}
          >
            <span onClick={() => loadChat(chat.id)} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {chat.title}
            </span>
            <button
              type="button"
              onClick={() => deleteChat(chat.id)}
              title="Delete chat"
              aria-label={`Delete ${chat.title}`}
              style={{
                background: "transparent",
                border: "none",
                color: active ? "rgba(255,255,255,0.85)" : "var(--dt-text-tertiary)",
                cursor: "pointer",
                display: "inline-flex",
                padding: 0,
              }}
            >
              <Trash2 size={11} />
            </button>
          </span>
        );
      })}
    </div>
  );

  const chatPanel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--dt-space-3)",
          flexWrap: "wrap",
          padding: "var(--dt-space-3) var(--dt-space-5)",
          borderBottom: "1px solid var(--dt-border-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flex: 1, minWidth: 0 }}>
          <MessageSquare size={16} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
            {activeChat ? (activeChat.title === "New chat" ? "New Chat" : activeChat.title) : "Chat"}
          </span>
          {selectedModel && (
            <span
              style={{
                fontFamily: "var(--dt-font-mono)",
                fontSize: "var(--dt-text-xs)",
                padding: "var(--dt-space-1) var(--dt-space-2)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                border: "1px solid var(--dt-accent-primary)",
                color: "var(--dt-accent-primary)",
                borderRadius: "var(--dt-radius-full)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "260px",
              }}
            >
              {selectedModel}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Temp</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              title={`Temperature: ${temperature.toFixed(1)}`}
              style={{ width: "90px", accentColor: "var(--dt-accent-primary)" }}
            />
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", width: 26 }}>{temperature.toFixed(1)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowModelHeaders((prev) => !prev)}
            disabled={!selectedModel}
            title={selectedModel ? `Configure custom headers specifically for ${selectedModel}` : "Select a model first"}
            aria-label="Model custom headers"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              minHeight: "34px",
              padding: "0 var(--dt-space-2)",
              backgroundColor: showModelHeaders || activeModelHeadersCount > 0 ? "rgba(99, 102, 241, 0.15)" : "var(--dt-bg-tertiary)",
              border: "1px solid " + (showModelHeaders || activeModelHeadersCount > 0 ? "var(--dt-accent-primary)" : "var(--dt-border-primary)"),
              borderRadius: "var(--dt-radius-md)",
              color: showModelHeaders || activeModelHeadersCount > 0 ? "var(--dt-accent-primary)" : "var(--dt-text-secondary)",
              fontSize: "var(--dt-text-xs)",
              fontWeight: "var(--dt-font-medium)",
              cursor: selectedModel ? "pointer" : "not-allowed",
              opacity: selectedModel ? 1 : 0.5,
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Headers</span>
            {activeModelHeadersCount > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "0 5px",
                  backgroundColor: "var(--dt-accent-primary)",
                  color: "white",
                  borderRadius: "var(--dt-radius-full)",
                  fontWeight: "var(--dt-font-bold)",
                }}
              >
                {activeModelHeadersCount}
              </span>
            )}
            {showModelHeaders ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            type="button"
            onClick={isBenchmarking ? stopBenchmark : runBenchmark}
            disabled={!selectedModel || isStreaming}
            title={isBenchmarking ? "Stop benchmark" : "Benchmark output TPS"}
            aria-label={isBenchmarking ? "Stop benchmark" : "Benchmark output TPS"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              minHeight: "34px",
              padding: "0 var(--dt-space-2)",
              backgroundColor: isBenchmarking ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              border: "1px solid " + (isBenchmarking ? "var(--dt-accent-error)" : "var(--dt-accent-success)"),
              borderRadius: "var(--dt-radius-md)",
              color: isBenchmarking ? "var(--dt-accent-error)" : "var(--dt-accent-success)",
              fontSize: "var(--dt-text-xs)",
              fontWeight: "var(--dt-font-medium)",
              cursor: selectedModel && !isStreaming ? "pointer" : "not-allowed",
              opacity: selectedModel && !isStreaming ? 1 : 0.5,
            }}
          >
            {isBenchmarking ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Stop
              </>
            ) : (
              <>
                <Gauge size={14} /> Benchmark
              </>
            )}
          </button>

          <button
            type="button"
            onClick={newChat}
            disabled={!selectedModel}
            title="New chat"
            aria-label="New chat"
            style={{
              minWidth: "34px",
              height: "34px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-secondary)",
              cursor: selectedModel ? "pointer" : "not-allowed",
              opacity: selectedModel ? 1 : 0.5,
            }}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={saveCurrentChat}
            disabled={!activeChat}
            title="Save chat to cookies"
            aria-label="Save chat"
            style={{
              minWidth: "34px",
              height: "34px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-secondary)",
              cursor: activeChat ? "pointer" : "not-allowed",
              opacity: activeChat ? 1 : 0.5,
            }}
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "var(--dt-space-4) var(--dt-space-5) 0" }}>
        {showModelHeaders && selectedModel && (
          <div style={{ marginBottom: "var(--dt-space-3)" }}>
            <HeadersEditor
              title={`Model Custom Headers (${selectedModel})`}
              subtitle={`Sent with completions & benchmarks for ${selectedModel}. Inherits endpoint headers unless overridden.`}
              headers={currentModelHeaders}
              onChange={(next) => handleModelHeadersChange(selectedModel, next)}
              onClose={() => setShowModelHeaders(false)}
              inheritedHeaders={connectedEndpointHeaders}
            />
          </div>
        )}
        {savedChips}
      </div>

      {!activeChat ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--dt-space-3)",
            padding: "var(--dt-space-8)",
            color: "var(--dt-text-tertiary)",
            textAlign: "center",
          }}
        >
          <MessageSquare size={40} style={{ opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: "var(--dt-text-base)", color: "var(--dt-text-secondary)" }}>
            Select a model from the dashboard to start chatting.
          </p>
          <p style={{ margin: 0, fontSize: "var(--dt-text-sm)" }}>Streaming responses and image attachments are supported.</p>
        </div>
      ) : (
        <>
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "var(--dt-space-4) var(--dt-space-5)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--dt-space-4)",
            }}
          >
            {(isBenchmarking || benchmarkResult || benchmarkPrompt) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--dt-space-4)",
                  padding: "var(--dt-space-4)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-secondary)",
                  borderRadius: "var(--dt-radius-lg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                  <Gauge size={16} color={isBenchmarking ? "var(--dt-accent-primary)" : "var(--dt-accent-success)"} />
                  <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
                    TPS Benchmark
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--dt-font-mono)",
                      fontSize: "var(--dt-text-xs)",
                      padding: "var(--dt-space-1) var(--dt-space-2)",
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid var(--dt-accent-primary)",
                      color: "var(--dt-accent-primary)",
                      borderRadius: "var(--dt-radius-full)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "220px",
                    }}
                  >
                    {selectedModel}
                  </span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                    {isBenchmarking ? (
                      <button
                        type="button"
                        onClick={stopBenchmark}
                        title="Stop benchmark"
                        aria-label="Stop benchmark"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--dt-space-1)",
                          minHeight: "32px",
                          padding: "0 var(--dt-space-3)",
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid var(--dt-accent-error)",
                          borderRadius: "var(--dt-radius-md)",
                          color: "var(--dt-accent-error)",
                          fontSize: "var(--dt-text-xs)",
                          fontWeight: "var(--dt-font-medium)",
                          cursor: "pointer",
                        }}
                      >
                        <X size={14} /> Stop
                      </button>
                    ) : (
                      benchmarkResult && (
                        <button
                          type="button"
                          onClick={runBenchmark}
                          title="Run benchmark again"
                          aria-label="Run benchmark again"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--dt-space-1)",
                            minHeight: "32px",
                            padding: "0 var(--dt-space-3)",
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid var(--dt-accent-success)",
                            borderRadius: "var(--dt-radius-md)",
                            color: "var(--dt-accent-success)",
                            fontSize: "var(--dt-text-xs)",
                            fontWeight: "var(--dt-font-medium)",
                            cursor: "pointer",
                          }}
                        >
                          <RefreshCw size={14} /> Run again
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--dt-space-2)" }}>
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "var(--dt-space-3) var(--dt-space-4)",
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-sm) var(--dt-radius-lg)",
                      color: "var(--dt-text-primary)",
                      fontSize: "var(--dt-text-sm)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: "var(--dt-leading-relaxed)",
                    }}
                  >
                    {benchmarkPrompt}
                  </div>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: "var(--dt-accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={14} color="white" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "var(--dt-space-2)", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: "var(--dt-bg-elevated)",
                      border: "1px solid var(--dt-border-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot size={14} color="var(--dt-accent-primary)" />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "var(--dt-space-3) var(--dt-space-4)",
                      backgroundColor: "var(--dt-bg-secondary)",
                      border: "1px solid var(--dt-border-primary)",
                      borderRadius: "var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-sm)",
                    }}
                  >
                    {benchmarkOutput ? (
                      <MarkdownContent content={benchmarkOutput} />
                    ) : isBenchmarking ? (
                      <span style={{ display: "inline-flex", gap: 4, padding: "4px 0" }}>
                        <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                        <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                        <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                      </span>
                    ) : (
                      <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>No output captured.</span>
                    )}
                  </div>
                </div>

                {benchmarkResult && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                        gap: "var(--dt-space-2)",
                      }}
                    >
                      <div style={{ padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
                        <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Hash size={12} /> Tokens
                        </div>
                        <div style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", fontFamily: "var(--dt-font-mono)" }}>
                          {benchmarkResult.tokens}
                        </div>
                      </div>
                      <div style={{ padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
                        <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>Output TPS</div>
                        <div style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-accent-success)", fontFamily: "var(--dt-font-mono)" }}>
                          {benchmarkResult.tps.toFixed(1)}
                        </div>
                      </div>
                      <div style={{ padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
                        <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Timer size={12} /> Total
                        </div>
                        <div style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", fontFamily: "var(--dt-font-mono)" }}>
                          {(benchmarkResult.totalMs / 1000).toFixed(2)}s
                        </div>
                      </div>
                      <div style={{ padding: "var(--dt-space-3)", backgroundColor: "var(--dt-bg-secondary)", border: "1px solid var(--dt-border-primary)", borderRadius: "var(--dt-radius-md)" }}>
                        <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>TTFT</div>
                        <div style={{ fontSize: "var(--dt-text-lg)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", fontFamily: "var(--dt-font-mono)" }}>
                          {benchmarkResult.ttftMs.toFixed(0)}ms
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                      Token count from {benchmarkResult.source === "usage" ? "server-reported usage" : "streamed chunks (usage not reported by this endpoint)"}.
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((msg, index) =>
              msg.role === "user" ? (
                <div key={index} style={{ display: "flex", justifyContent: "flex-end", gap: "var(--dt-space-2)" }}>
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "var(--dt-space-3) var(--dt-space-4)",
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                      borderRadius: "var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-sm) var(--dt-radius-lg)",
                      color: "var(--dt-text-primary)",
                      fontSize: "var(--dt-text-sm)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: "var(--dt-leading-relaxed)",
                    }}
                  >
                    {Array.isArray(msg.content) ? <ContentParts parts={msg.content} /> : msg.content}
                  </div>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: "var(--dt-accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={14} color="white" />
                  </div>
                </div>
              ) : (
                <div key={index} style={{ display: "flex", gap: "var(--dt-space-2)", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: "var(--dt-bg-tertiary)",
                      border: "1px solid var(--dt-border-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot size={14} color="var(--dt-accent-primary)" />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "var(--dt-space-3) var(--dt-space-4)",
                      backgroundColor: "var(--dt-bg-tertiary)",
                      border: "1px solid var(--dt-border-primary)",
                      borderRadius: "var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-sm)",
                    }}
                  >
                    {Array.isArray(msg.content) ? <ContentParts parts={msg.content} /> : <MarkdownContent content={msg.content} />}
                  </div>
                </div>
              ),
            )}

            {isStreaming && (
              <div style={{ display: "flex", gap: "var(--dt-space-2)", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                    borderRadius: "50%",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={14} color="var(--dt-accent-primary)" />
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "var(--dt-space-3) var(--dt-space-4)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-lg) var(--dt-radius-sm)",
                  }}
                >
                  {streamText ? (
                    <MarkdownContent content={streamText} />
                  ) : (
                    <span style={{ display: "inline-flex", gap: 4, padding: "4px 0" }}>
                      <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                      <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                      <span className="stream-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--dt-text-tertiary)" }} />
                    </span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: "var(--dt-space-3) var(--dt-space-4)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--dt-accent-error)",
                  color: "var(--dt-accent-error)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            )}

            </div>

          <div
            style={{
              padding: "var(--dt-space-4) var(--dt-space-5)",
              borderTop: "1px solid var(--dt-border-primary)",
            }}
          >
            {notice && (
              <div
                style={{
                  padding: "var(--dt-space-2) var(--dt-space-3)",
                  marginBottom: "var(--dt-space-3)",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid var(--dt-accent-info)",
                  color: "var(--dt-accent-info)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-xs)",
                }}
              >
                {notice}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--dt-space-2)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)",
                padding: "var(--dt-space-2)",
              }}
            >
              {attachments.length > 0 && (
                <div style={{ display: "flex", gap: "var(--dt-space-2)", flexWrap: "wrap" }}>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} style={{ position: "relative" }}>
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        title={attachment.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--dt-radius-md)",
                          objectFit: "cover",
                          border: "1px solid var(--dt-border-primary)",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        title={`Remove ${attachment.name}`}
                        aria-label={`Remove ${attachment.name}`}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: "20px",
                          height: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "var(--dt-bg-elevated)",
                          border: "1px solid var(--dt-border-primary)",
                          borderRadius: "50%",
                          color: "var(--dt-text-secondary)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--dt-space-2)", alignItems: "flex-end" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    void handleImageFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!activeChat || isStreaming}
                  title="Attach images"
                  aria-label="Attach images"
                  style={{
                    minWidth: "44px",
                    height: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-secondary)",
                    cursor: activeChat && !isStreaming ? "pointer" : "not-allowed",
                    opacity: activeChat && !isStreaming ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                >
                  <ImagePlus size={16} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    selectedModel ? "Type a message... (Enter to send, Shift+Enter for newline)" : "Select a model to begin chatting."
                  }
                  rows={2}
                  disabled={!selectedModel}
                style={{
                  flex: 1,
                  resize: "none",
                  minHeight: "44px",
                  maxHeight: "160px",
                  padding: "var(--dt-space-2) var(--dt-space-3)",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--dt-text-primary)",
                  fontSize: "var(--dt-text-sm)",
                  fontFamily: "var(--dt-font-sans)",
                  lineHeight: "var(--dt-leading-normal)",
                }}
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  title="Stop generating"
                  aria-label="Stop generating"
                  style={{
                    minWidth: "44px",
                    height: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--dt-accent-error)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--dt-radius-md)",
                    cursor: "pointer",
                  }}
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!selectedModel || (!input.trim() && attachments.length === 0) || !activeChat}
                  title="Send"
                  aria-label="Send"
                  style={{
                    minWidth: "44px",
                    height: "44px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--dt-accent-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--dt-radius-md)",
                    cursor: "pointer",
                    opacity: !selectedModel || (!input.trim() && attachments.length === 0) || !activeChat ? 0.5 : 1,
                  }}
                >
                  <Send size={16} />
                </button>
              )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const workspace = isMobile ? (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
      <div style={{ height: "300px", display: "flex", flexShrink: 0 }}>{modelsPanel}</div>
      <div style={{ height: "min(72dvh, 640px)", display: "flex", flexShrink: 0 }}>{chatPanel}</div>
    </div>
  ) : (
    <div
      style={{
        flex: "1 0 0%",
        minHeight: "380px",
        display: "grid",
        gridTemplateColumns: "minmax(300px, 360px) 1fr",
        gap: "var(--dt-space-5)",
        overflow: "hidden",
      }}
    >
      {modelsPanel}
      {chatPanel}
    </div>
  );

  return (
    <div
      style={{
        padding: "var(--dt-space-6)",
        height: isMobile ? "auto" : availableHeight ? `${availableHeight}px` : "calc(100dvh - 64px)",
        minHeight: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: "var(--dt-space-5)", flexShrink: 0 }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            color: "var(--dt-text-tertiary)",
            textDecoration: "none",
            fontSize: "var(--dt-text-sm)",
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--dt-space-3)",
          flexWrap: "wrap",
          marginBottom: "var(--dt-space-5)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: "0 0 var(--dt-space-1) 0", fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)" }}>
            OpenAI Playground
          </h1>
          <p style={{ margin: 0, fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
            Connect to any OpenAI-compatible endpoint, browse its models, and chat with streaming responses. Settings and chats persist in your browser cookies.
          </p>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            padding: "var(--dt-space-2) var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-full)",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: statusColor }} />
          <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {status === "connected"
              ? `Connected · ${connectedEndpoint}`
              : status === "error"
                ? statusMessage
                : status === "connecting"
                  ? "Connecting..."
                  : "Not connected"}
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
          padding: "var(--dt-space-4) var(--dt-space-5)",
          marginBottom: "var(--dt-space-5)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", marginBottom: "var(--dt-space-3)" }}>
          <Shield size={14} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
            Connection
          </span>
          {status === "error" && (
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-accent-error)" }}>{statusMessage}</span>
          )}
        </div>
        {inputRow}
      </div>

      {workspace}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .stream-dot {
          animation: streamBounce 1.2s infinite ease-in-out;
        }
        .stream-dot:nth-child(2) { animation-delay: 0.15s; }
        .stream-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes streamBounce {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        .chat-markdown p { margin: 0 0 8px 0; }
        .chat-markdown p:last-child { margin-bottom: 0; }
        .chat-markdown h1, .chat-markdown h2, .chat-markdown h3,
        .chat-markdown h4, .chat-markdown h5, .chat-markdown h6 {
          margin: 12px 0 6px 0; line-height: 1.3; color: var(--dt-text-primary);
        }
        .chat-markdown ul, .chat-markdown ol { margin: 0 0 8px 0; padding-left: 20px; }
        .chat-markdown code {
          font-family: var(--dt-font-mono);
          font-size: 0.85em;
          backgroundColor: var(--dt-bg-elevated);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--dt-terminal-cyan);
        }
        .chat-markdown pre {
          backgroundColor: var(--dt-bg-primary);
          border: 1px solid var(--dt-border-primary);
          borderRadius: 8px;
          padding: 10px 12px;
          overflow-x: auto;
          margin: 0 0 8px 0;
        }
        .chat-markdown pre code {
          backgroundColor: transparent;
          padding: 0;
          color: var(--dt-text-primary);
        }
        .chat-markdown a { color: var(--dt-accent-primary); }
        .chat-markdown blockquote {
          margin: 0 0 8px 0;
          padding-left: 12px;
          border-left: 3px solid var(--dt-border-secondary);
          color: var(--dt-text-secondary);
        }
        .chat-markdown table { border-collapse: collapse; margin: 0 0 8px 0; }
        .chat-markdown th, .chat-markdown td {
          border: 1px solid var(--dt-border-secondary);
          padding: 4px 8px;
        }
        .chat-markdown img { max-width: 100%; border-radius: 8px; }
        .chat-markdown hr { border: none; border-top: 1px solid var(--dt-border-primary); margin: 12px 0; }
      `}</style>
    </div>
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.AI,
  description:
    "Connect to any OpenAI-compatible endpoint, browse available models, and chat with streaming responses. Endpoint, API key, and chats are stored in browser cookies.",
  id: "openai-playground-tool",
  name: "OpenAI Playground",
  tool: OpenAIPlayground,
});