import { useEffect, useMemo, useRef, useState } from "react";
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
import { sanitizeHtml } from "../../core/sanitize";
import { useIsMobile } from "../../components/ui/use-mobile";
import { useAvailableHeight } from "../../components/ui/use-available-height";

// ---------------------------------------------------------------------------
// Persistence
//
// Everything the playground remembers (endpoint, API key, custom headers and
// saved chats) lives in localStorage. Unlike sessionStorage it survives tab
// closes, browser restarts and mobile tab eviction, and unlike a cookie it is
// never attached to requests, so the API key is not leaked to the backend.
// Credentials stay put until the user removes them or saves new ones.
// ---------------------------------------------------------------------------
const STORAGE_PREFIX = "dt_ai_";
const CREDENTIALS_KEY = STORAGE_PREFIX + "credentials_v1";
const CHATS_KEY = STORAGE_PREFIX + "chats_v1";

// Written by older builds (credentials in sessionStorage, chats in cookies).
// Read once for migration, then deleted.
const LEGACY_ENDPOINT_KEY = STORAGE_PREFIX + "endpoint";
const LEGACY_TOKEN_KEY = STORAGE_PREFIX + "token";
const LEGACY_ENDPOINT_HEADERS_KEY = STORAGE_PREFIX + "endpoint_headers";
const LEGACY_MODEL_HEADERS_KEY = STORAGE_PREFIX + "model_headers";
const LEGACY_CHATS_INDEX_KEY = STORAGE_PREFIX + "chats";
const LEGACY_CHAT_KEY = (id: string) => STORAGE_PREFIX + "chat_" + id;

const MAX_STORED_CHAT_BYTES = 4_500_000; // localStorage holds ~5 MB per origin.

interface StoredCredentials {
  endpoint: string;
  token: string;
  endpointHeaders: CustomHeader[];
  modelHeaders: Record<string, CustomHeader[]>;
}

function storageGet(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded or storage unavailable (e.g. blocked private mode).
    return false;
  }
}

function storageRemove(store: "local" | "session", key: string): void {
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).removeItem(key);
  } catch {
    /* ignore */
  }
}

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

// Cookie helpers remain only so we can migrate away from (and clean up) the
// legacy cookie store written by older builds.
function getCookie(name: string) {
  try {
    const pattern = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp("(?:^|; )" + pattern + "=([^;]*)"));
    if (!match) return "";
    try {
      return decodeURIComponent(match[1] || "");
    } catch {
      // Malformed encoding in a legacy cookie — fall back to the raw value.
      return match[1] || "";
    }
  } catch {
    return "";
  }
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "chat_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeHeaders(input: unknown): CustomHeader[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is CustomHeader => !!item && typeof item === "object" && typeof (item as CustomHeader).key === "string")
    .map((item) => ({
      id: item.id || makeId(),
      key: item.key || "",
      value: typeof item.value === "string" ? item.value : "",
      enabled: item.enabled !== false,
    }));
}

function normalizeModelHeaders(input: unknown): Record<string, CustomHeader[]> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, CustomHeader[]> = {};
  for (const [modelId, headers] of Object.entries(input as Record<string, unknown>)) {
    const normalized = normalizeHeaders(headers);
    if (normalized.length) result[modelId] = normalized;
  }
  return result;
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Reads credentials left behind by older builds (sessionStorage + legacy cookies). */
function readLegacyCredentials(): StoredCredentials {
  const sessionOrCookie = (key: string) => storageGet("session", key) ?? (getCookie(key) || null);
  return {
    endpoint: sessionOrCookie(LEGACY_ENDPOINT_KEY) || "",
    token: sessionOrCookie(LEGACY_TOKEN_KEY) || "",
    endpointHeaders: normalizeHeaders(parseJson(sessionOrCookie(LEGACY_ENDPOINT_HEADERS_KEY))),
    modelHeaders: normalizeModelHeaders(parseJson(sessionOrCookie(LEGACY_MODEL_HEADERS_KEY))),
  };
}

function clearLegacyCredentials() {
  for (const key of [LEGACY_ENDPOINT_KEY, LEGACY_TOKEN_KEY, LEGACY_ENDPOINT_HEADERS_KEY, LEGACY_MODEL_HEADERS_KEY]) {
    storageRemove("session", key);
    deleteCookie(key);
  }
}

/** Loads saved credentials. Read-only: nothing is written during render. The
 *  mount effect persists any legacy data it finds here and clears the old
 *  stores, so a failed write can never destroy the legacy copy. */
function loadCredentials(): StoredCredentials {
  const parsed = parseJson(storageGet("local", CREDENTIALS_KEY));
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = parsed as Partial<StoredCredentials>;
    return {
      endpoint: typeof record.endpoint === "string" ? record.endpoint : "",
      token: typeof record.token === "string" ? record.token : "",
      endpointHeaders: normalizeHeaders(record.endpointHeaders),
      modelHeaders: normalizeModelHeaders(record.modelHeaders),
    };
  }
  return readLegacyCredentials();
}

function saveCredentials(credentials: StoredCredentials): boolean {
  return storageSet(CREDENTIALS_KEY, JSON.stringify(credentials));
}

function removeStoredCredentials() {
  storageRemove("local", CREDENTIALS_KEY);
  clearLegacyCredentials();
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

function isValidChat(chat: unknown): chat is SavedChat {
  return (
    !!chat &&
    typeof chat === "object" &&
    typeof (chat as SavedChat).id === "string" &&
    Array.isArray((chat as SavedChat).messages)
  );
}

/** Reads chats left in cookies by older builds. Does not delete them — that
 *  only happens once the migrated copy has been written successfully. */
function readLegacyChats(): SavedChat[] {
  const index = parseJson(getCookie(LEGACY_CHATS_INDEX_KEY));
  const chats: SavedChat[] = [];
  if (Array.isArray(index)) {
    for (const id of index) {
      if (typeof id !== "string") continue;
      const parsed = parseJson(getCookie(LEGACY_CHAT_KEY(id)));
      if (isValidChat(parsed)) chats.push(parsed);
    }
  }
  return chats;
}

/** Removes the legacy per-chat cookies left by older builds. */
function clearLegacyChats() {
  const index = parseJson(getCookie(LEGACY_CHATS_INDEX_KEY));
  if (Array.isArray(index)) {
    for (const id of index) {
      if (typeof id === "string") deleteCookie(LEGACY_CHAT_KEY(id));
    }
  }
  deleteCookie(LEGACY_CHATS_INDEX_KEY);
}

/** Loads saved chats from localStorage. Read-only: the mount effect migrates
 *  any legacy cookie chats and cleans up the old cookies. */
function loadChats(): SavedChat[] {
  const parsed = parseJson(storageGet("local", CHATS_KEY));
  if (Array.isArray(parsed)) return parsed.filter(isValidChat);
  return readLegacyChats();
}

function saveChats(chats: SavedChat[]): boolean {
  return storageSet(CHATS_KEY, JSON.stringify(chats));
}

/** Replaces inline image data with a short marker before persisting. A single
 *  4 MB screenshot becomes ~5 MB of base64, which on its own would exhaust the
 *  origin's storage quota and stop credential writes too. Returns the original
 *  array when nothing needed stripping. */
function stripEmbeddedImages(messages: ChatMessage[]): ChatMessage[] {
  let changed = false;
  const next = messages.map((message) => {
    if (typeof message.content === "string") return message;
    if (!message.content.some((part) => part.type === "image_url")) return message;
    changed = true;
    const text = message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();
    return { role: message.role, content: text ? `${text}\n\n_[image not saved]_` : "_[image not saved]_" };
  });
  return changed ? next : messages;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong.";
}

const MAX_IMAGE_MB = 4;
const CONNECT_TIMEOUT_MS = 20_000;

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

async function fetchModels(
  endpoint: string,
  token: string,
  customHeaders?: CustomHeader[],
  signal?: AbortSignal,
): Promise<ModelInfo[]> {
  const headers = combineHeaders(token, customHeaders || []);
  const res = await fetch(endpoint + "/models", {
    headers,
    signal,
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
  // Parse and sanitize with the shared DOMPurify helper rather than a bespoke
  // regex, so dangerous URLs/handlers can't slip through. Computed during
  // render so streaming updates paint without an extra state round-trip.
  const html = useMemo(() => sanitizeHtml(marked.parse(escapeHtml(content)) as string), [content]);

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
            className="dt-hdr-btn"
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
              aria-label="Close headers editor"
              className="dt-hdr-btn"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--dt-text-tertiary)",
                cursor: "pointer",
                padding: 2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
                className="dt-hdr-btn"
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
              className="dt-hdr-row"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--dt-space-2)",
                opacity: h.enabled ? 1 : 0.6,
              }}
            >
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) => updateHeader(h.id, { enabled: e.target.checked })}
                title={h.enabled ? "Disable header" : "Enable header"}
                aria-label={`${h.enabled ? "Disable" : "Enable"} header ${h.key || ""}`.trim()}
                className="dt-hdr-check"
                style={{ cursor: "pointer", accentColor: "var(--dt-accent-primary)" }}
              />
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                placeholder="Header Name (e.g. HTTP-Referer)"
                aria-label="Header name"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                className="dt-hdr-input"
                style={{
                  flex: 1,
                  minWidth: 0,
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
                aria-label="Header value"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                className="dt-hdr-input"
                style={{
                  flex: 1.5,
                  minWidth: 0,
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
                className="dt-hdr-btn"
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

  // Credentials are read from localStorage once at mount; later edits are
  // committed by commitCredentials() (blur / header change / connect / page-hide).
  const [initialCredentials] = useState(loadCredentials);

  const [endpoint, setEndpoint] = useState(initialCredentials.endpoint);
  const [token, setToken] = useState(initialCredentials.token);
  const [endpointHeaders, setEndpointHeaders] = useState<CustomHeader[]>(initialCredentials.endpointHeaders);
  const [modelHeadersMap, setModelHeadersMap] = useState<Record<string, CustomHeader[]>>(
    initialCredentials.modelHeaders,
  );
  const [showEndpointHeaders, setShowEndpointHeaders] = useState(false);
  const [showModelHeaders, setShowModelHeaders] = useState(false);
  const [connectionExpanded, setConnectionExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">(() =>
    initialCredentials.endpoint.trim() && initialCredentials.token.trim() ? "connecting" : "idle",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [connectedEndpoint, setConnectedEndpoint] = useState("");
  const [connectedToken, setConnectedToken] = useState("");
  const [connectedEndpointHeaders, setConnectedEndpointHeaders] = useState<CustomHeader[]>(
    initialCredentials.endpointHeaders,
  );

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");

  const [temperature, setTemperature] = useState(1);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [chats, setChats] = useState<SavedChat[]>(loadChats);
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
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const connectAbortRef = useRef<AbortController | null>(null);
  const connectEpochRef = useRef(0);
  const lastConnectedRef = useRef<{ endpoint: string; token: string; headers: CustomHeader[] } | null>(null);
  const streamFrameRef = useRef<number | null>(null);
  const benchmarkFrameRef = useRef<number | null>(null);
  const focusRevealTimerRef = useRef<number | null>(null);
  const [credentialsStored, setCredentialsStored] = useState(() =>
    Boolean(
      initialCredentials.endpoint.trim() ||
        initialCredentials.token.trim() ||
        initialCredentials.endpointHeaders.length ||
        Object.keys(initialCredentials.modelHeaders).length,
    ),
  );
  const [credentialError, setCredentialError] = useState("");
  const [chatError, setChatError] = useState("");

  const currentModelHeaders = selectedModel ? modelHeadersMap[selectedModel] || [] : [];
  const hasSavedCredentials =
    Boolean(endpoint.trim() || token.trim() || endpointHeaders.length || Object.keys(modelHeadersMap).length);
  // Removing credentials should be possible whenever a record exists in
  // storage, even if the in-memory fields are empty (e.g. a stale connect).
  const canRemoveCredentials = credentialsStored || hasSavedCredentials;

  // Live mirror of the credential fields so a flush on page-hide can read the
  // latest typed values without re-subscribing on every keystroke.
  const credentialsRef = useRef({ endpoint, token, endpointHeaders, modelHeadersMap });
  useEffect(() => {
    credentialsRef.current = { endpoint, token, endpointHeaders, modelHeadersMap };
  }, [endpoint, token, endpointHeaders, modelHeadersMap]);

  /**
   * Writes the current credentials to localStorage. Called when a field is
   * committed (blur), when headers change, when a connection succeeds, and when
   * the page is hidden. Deliberately NOT called on every keystroke: that would
   * overwrite a working API key with a half-typed replacement.
   */
  function commitCredentials(): boolean {
    const { endpoint: ep, token: tk, endpointHeaders: eh, modelHeadersMap: mh } = credentialsRef.current;
    const empty = !ep.trim() && !tk.trim() && eh.length === 0 && Object.keys(mh).length === 0;
    if (empty) {
      // Never treat blanked-out fields as a removal: the user clearing a field
      // to paste a new value (often while switching windows, which triggers the
      // flush) must not wipe the saved credential. Removal is only ever the
      // explicit Remove-credentials action.
      setCredentialError("");
      return true;
    }
    const saved = saveCredentials({ endpoint: ep, token: tk, endpointHeaders: eh, modelHeaders: mh });
    setCredentialsStored(saved);
    setCredentialError(
      saved
        ? ""
        : "Couldn't save credentials — browser storage is unavailable or full. Free up space (delete saved chats) or check browser settings, then try again.",
    );
    return saved;
  }

  // Flush pending edits when the tab is hidden or closed so nothing typed is
  // lost, while still avoiding a write per keystroke.
  useEffect(() => {
    const flush = () => commitCredentials();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") commitCredentials();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Client-side navigation unmounts without pagehide/visibilitychange, so
      // flush directly (without setState) to avoid losing an unblurred edit.
      const { endpoint: ep, token: tk, endpointHeaders: eh, modelHeadersMap: mh } = credentialsRef.current;
      if (ep.trim() || tk.trim() || eh.length || Object.keys(mh).length) {
        saveCredentials({ endpoint: ep, token: tk, endpointHeaders: eh, modelHeaders: mh });
      }
    };
  }, []);

  // One-time migration: persist anything loaded from the legacy stores, then
  // drop the old keys/cookies. Guarded so legacy data is only cleared after the
  // new copy is safely written, and idempotent so a StrictMode double-run or a
  // remount cannot lose data.
  useEffect(() => {
    if (commitCredentials()) clearLegacyCredentials();
    // Persist legacy cookie chats only if the new store has not been created
    // yet, and keep the legacy cookies until that write succeeds.
    const chatsPersisted = storageGet("local", CHATS_KEY) !== null;
    if (!chatsPersisted && chats.length > 0) {
      if (saveChats(chats)) clearLegacyChats();
    } else {
      clearLegacyChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep other tabs in sync. Values (not timestamps) are compared so two tabs
  // converge instead of ping-ponging writes at each other.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // Another tab cleared storage entirely.
      if (event.key === null) {
        connectEpochRef.current += 1;
        lastConnectedRef.current = null;
        setEndpoint("");
        setToken("");
        setEndpointHeaders([]);
        setModelHeadersMap({});
        setCredentialsStored(false);
        setConnectedEndpoint("");
        setConnectedToken("");
        setConnectedEndpointHeaders([]);
        setModels([]);
        setModelsLoading(false);
        setSelectedModel("");
        setStatus("idle");
        setStatusMessage("");
        setChats(loadChats());
        return;
      }
      // Keep saved chats in sync so a stale tab cannot overwrite another tab's
      // saved chat on its next write.
      if (event.key === CHATS_KEY) {
        setChats(loadChats());
        return;
      }
      if (event.key !== CREDENTIALS_KEY) return;
      const next = loadCredentials();
      const hasAny = Boolean(
        next.endpoint.trim() || next.token.trim() || next.endpointHeaders.length || Object.keys(next.modelHeaders).length,
      );
      setEndpoint((prev) => (prev === next.endpoint ? prev : next.endpoint));
      setToken((prev) => (prev === next.token ? prev : next.token));
      setEndpointHeaders((prev) =>
        JSON.stringify(prev) === JSON.stringify(next.endpointHeaders) ? prev : next.endpointHeaders,
      );
      setModelHeadersMap((prev) =>
        JSON.stringify(prev) === JSON.stringify(next.modelHeaders) ? prev : next.modelHeaders,
      );
      setCredentialsStored(hasAny);
      // If another tab removed the credentials, drop this tab's live connection
      // too so it cannot keep using a key that no longer exists.
      if (!hasAny) {
        connectEpochRef.current += 1;
        connectAbortRef.current?.abort();
        connectAbortRef.current = null;
        lastConnectedRef.current = null;
        setConnectedEndpoint("");
        setConnectedToken("");
        setConnectedEndpointHeaders([]);
        setModels([]);
        setModelsLoading(false);
        setSelectedModel("");
        setStatus("idle");
        setStatusMessage("");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const headerCommitTimerRef = useRef<number | null>(null);
  /** Debounces header commits so typing a header value does not write to
   *  localStorage on every keystroke. The page-hide/unmount flush covers the
   *  pending write. */
  function scheduleCommitCredentials() {
    if (headerCommitTimerRef.current !== null) window.clearTimeout(headerCommitTimerRef.current);
    headerCommitTimerRef.current = window.setTimeout(() => {
      headerCommitTimerRef.current = null;
      commitCredentials();
    }, 300);
  }

  function handleEndpointHeadersChange(next: CustomHeader[]) {
    setEndpointHeaders(next);
    setConnectedEndpointHeaders(next);
    credentialsRef.current = { ...credentialsRef.current, endpointHeaders: next };
    scheduleCommitCredentials();
  }

  function handleModelHeadersChange(modelId: string, next: CustomHeader[]) {
    const updated = { ...modelHeadersMap, [modelId]: next };
    setModelHeadersMap(updated);
    credentialsRef.current = { ...credentialsRef.current, modelHeadersMap: updated };
    scheduleCommitCredentials();
  }

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamText, benchmarkOutput, isBenchmarking, benchmarkResult]);

  useEffect(() => {
    if (autoConnectDoneRef.current) return;
    autoConnectDoneRef.current = true;
    if (endpoint.trim() && token.trim()) {
      void connectWith(endpoint, token, endpointHeaders);
    }
    // Intentionally runs once on mount with the credentials loaded at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWith(ep: string, tk: string, epHeaders: CustomHeader[] = endpointHeaders) {
    const cleanEp = ep.trim().replace(/\/+$/, "");
    const cleanTk = tk.trim();
    if (!cleanEp || !cleanTk) {
      setStatus("error");
      setStatusMessage("Both endpoint URL and API key are required.");
      return;
    }

    // Supersede any in-flight attempt and stamp this one, so a slow response
    // can never resurrect credentials after the user removed them.
    connectAbortRef.current?.abort();
    const controller = new AbortController();
    connectAbortRef.current = controller;
    const epoch = ++connectEpochRef.current;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CONNECT_TIMEOUT_MS);
    const isStale = () => epoch !== connectEpochRef.current;

    setStatus("connecting");
    setStatusMessage("Contacting endpoint...");
    try {
      const data = await fetchModels(cleanEp, cleanTk, epHeaders, controller.signal);
      if (isStale()) return;
      setModels(data);
      setConnectedEndpoint(cleanEp);
      setConnectedToken(cleanTk);
      setConnectedEndpointHeaders(epHeaders);
      lastConnectedRef.current = { endpoint: cleanEp, token: cleanTk, headers: epHeaders };
      // Merge into the live ref instead of replacing it: header edits made while
      // the connect was in flight must not be reverted in storage.
      credentialsRef.current = { ...credentialsRef.current, endpoint: cleanEp, token: cleanTk };
      const saved = commitCredentials();
      setStatus("connected");
      setStatusMessage(`Connected — ${data.length} model${data.length === 1 ? "" : "s"} available`);
      setError("");
      setNotice(
        saved
          ? "Credentials saved in this browser and kept until you remove them."
          : "Connected, but credentials could not be saved — browser storage is unavailable or full.",
      );
    } catch (e: unknown) {
      if (isStale()) return;
      // Any settled attempt leaves no live connection, so the UI cannot keep
      // sending to a stale endpoint while showing a failed connect.
      lastConnectedRef.current = null;
      setConnectedEndpoint("");
      setConnectedToken("");
      setStatus("error");
      setStatusMessage(
        e instanceof Error && e.name === "AbortError" && timedOut
          ? `Connection timed out after ${CONNECT_TIMEOUT_MS / 1000}s. Check the endpoint URL and try again.`
          : getErrorMessage(e),
      );
    } finally {
      window.clearTimeout(timeout);
      // A connect supersedes any in-flight refresh and owns the loading flag;
      // release it only if no newer request has taken the controller.
      if (connectAbortRef.current === controller) {
        connectAbortRef.current = null;
        setModelsLoading(false);
      }
    }
  }

  function connect() {
    void connectWith(endpoint, token, endpointHeaders);
  }

  /** Cancels an in-flight connection attempt, reverting to the last live
   *  connection if there was one. Restoring the endpoint/key too (not just the
   *  status) keeps the connection state and the UI in agreement, so Send and
   *  Benchmark keep working against the endpoint that is actually live. */
  function cancelConnect() {
    connectEpochRef.current += 1;
    connectAbortRef.current?.abort();
    connectAbortRef.current = null;
    setError("");
    setModelsLoading(false);
    const last = lastConnectedRef.current;
    if (last) {
      // Revert inputs, stored credential and active transport together, so a
      // cancelled change does not leave storage pointing at an unverified
      // endpoint while the live connection still uses the old one.
      setEndpoint(last.endpoint);
      setToken(last.token);
      setEndpointHeaders(last.headers);
      setConnectedEndpoint(last.endpoint);
      setConnectedToken(last.token);
      setConnectedEndpointHeaders(last.headers);
      credentialsRef.current = {
        ...credentialsRef.current,
        endpoint: last.endpoint,
        token: last.token,
        endpointHeaders: last.headers,
      };
      commitCredentials();
      setStatus("connected");
      setStatusMessage("");
    } else {
      setStatus("idle");
      setStatusMessage("");
    }
  }

  /** Clears every saved credential from the browser and resets the connection. */
  function removeCredentials() {
    abortRef.current?.abort();
    benchmarkAbortRef.current?.abort();
    // Invalidate and cancel any in-flight connect so it cannot write the
    // just-removed credentials back into storage.
    connectEpochRef.current += 1;
    connectAbortRef.current?.abort();
    connectAbortRef.current = null;
    lastConnectedRef.current = null;
    removeStoredCredentials();
    credentialsRef.current = { endpoint: "", token: "", endpointHeaders: [], modelHeadersMap: {} };
    setEndpoint("");
    setToken("");
    setEndpointHeaders([]);
    setModelHeadersMap({});
    setShowEndpointHeaders(false);
    setShowModelHeaders(false);
    setConnectedEndpoint("");
    setConnectedToken("");
    setConnectedEndpointHeaders([]);
    setModels([]);
    setModelsLoading(false);
    setSelectedModel("");
    setStatus("idle");
    setStatusMessage("");
    setError("");
    setCredentialError("");
    setCredentialsStored(false);
    setConfirmRemove(false);
    setConnectionExpanded(true);
    setNotice("Saved credentials removed from this browser.");
  }

  async function refreshModels() {
    if (!connectedEndpoint || !connectedToken) return;
    // Share the connect abort/epoch discipline so a refresh that lands after
    // the credentials were removed cannot rebuild the "connected" UI.
    const epoch = ++connectEpochRef.current;
    const isStale = () => epoch !== connectEpochRef.current;
    connectAbortRef.current?.abort();
    const controller = new AbortController();
    connectAbortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CONNECT_TIMEOUT_MS);

    setModelsLoading(true);
    try {
      const data = await fetchModels(connectedEndpoint, connectedToken, connectedEndpointHeaders, controller.signal);
      if (isStale()) return;
      setModels(data);
      setStatus("connected");
      setStatusMessage(`Connected — ${data.length} model${data.length === 1 ? "" : "s"} available`);
      setError("");
    } catch (e: unknown) {
      if (isStale()) return;
      if (e instanceof Error && e.name === "AbortError" && timedOut) {
        setStatus("error");
        setStatusMessage("Refreshing models timed out. Try again.");
        return;
      }
      setStatus("error");
      setStatusMessage(getErrorMessage(e));
    } finally {
      window.clearTimeout(timeout);
      if (connectAbortRef.current === controller) connectAbortRef.current = null;
      if (!isStale()) setModelsLoading(false);
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
    scrollChatIntoView();
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
    scrollChatIntoView();
  }

  /** On phones the model list and the chat live in separate panes, so bring the
   *  chat pane into view once the user picks a model or opens a saved chat. */
  function scrollChatIntoView() {
    if (!isMobile) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      chatPanelRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  /** Brings the composer into view after the soft keyboard resizes the viewport,
   *  cancelling any previously queued reveal. */
  function revealComposer() {
    cancelComposerReveal();
    if (!isMobile) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    focusRevealTimerRef.current = window.setTimeout(() => {
      focusRevealTimerRef.current = null;
      chatPanelRef.current?.scrollIntoView({ block: "end", behavior: reduceMotion ? "auto" : "smooth" });
    }, 250);
  }

  function cancelComposerReveal() {
    if (focusRevealTimerRef.current !== null) {
      window.clearTimeout(focusRevealTimerRef.current);
      focusRevealTimerRef.current = null;
    }
  }

  useEffect(() => cancelComposerReveal, []);

  function saveCurrentChat() {
    if (!activeChat) return;
    const title =
      activeChat.title === "New chat"
        ? (contentText(messages[0]?.content || "") || "Image chat").slice(0, 42)
        : activeChat.title;

    const persistMessages = stripEmbeddedImages(messages);
    const stored: SavedChat = { ...activeChat, title, messages: persistMessages };
    const inMemory: SavedChat = { ...activeChat, title, messages };

    const exists = chats.some((c) => c.id === stored.id);
    const next = exists ? chats.map((c) => (c.id === stored.id ? stored : c)) : [...chats, stored];
    const serialized = JSON.stringify(next);

    if (!saveChats(next)) {
      setChatError("Couldn't save this chat — browser storage is unavailable or full. Delete a saved chat and try again.");
      return;
    }
    setChatError("");
    setChats(next);
    setActiveChat(inMemory);
    if (serialized.length > MAX_STORED_CHAT_BYTES) {
      setNotice("Chat saved, but storage is nearly full — delete chats you no longer need.");
    } else if (persistMessages !== messages) {
      setNotice("Chat saved without images — attachments are not persisted to keep credentials safe.");
    } else {
      setNotice("Chat saved in this browser.");
    }
  }

  function deleteChat(id: string) {
    const next = chats.filter((c) => c.id !== id);
    // Only update the UI once storage agrees, so a failed write cannot make a
    // deleted chat silently reappear on reload.
    if (!saveChats(next)) {
      setChatError("Couldn't delete this chat — browser storage is unavailable. It may reappear on reload.");
      return;
    }
    setChatError("");
    setChats(next);
    if (activeChat?.id === id) {
      setActiveChat(null);
      setMessages([]);
    }
    setNotice("");
  }

  function setStreamTextRef(value: string) {
    streamTextRef.current = value;
  }

  // Coalesce streaming deltas to one paint per animation frame: re-parsing the
  // whole growing message on every token is the main source of jank on phones.
  function scheduleStreamPaint() {
    if (streamFrameRef.current !== null) return;
    streamFrameRef.current = window.requestAnimationFrame(() => {
      streamFrameRef.current = null;
      setStreamText(streamTextRef.current);
    });
  }

  function scheduleBenchmarkPaint() {
    if (benchmarkFrameRef.current !== null) return;
    benchmarkFrameRef.current = window.requestAnimationFrame(() => {
      benchmarkFrameRef.current = null;
      setBenchmarkOutput(benchmarkOutputRef.current);
    });
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
            scheduleStreamPaint();
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
      if (streamFrameRef.current !== null) {
        window.cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
      }
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
            scheduleBenchmarkPaint();
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
      // Flush the last un-painted tokens before cancelling the frame, so the
      // benchmark transcript is never truncated.
      setBenchmarkOutput(benchmarkOutputRef.current);
      if (benchmarkFrameRef.current !== null) {
        window.cancelAnimationFrame(benchmarkFrameRef.current);
        benchmarkFrameRef.current = null;
      }
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
          <label htmlFor="openai-endpoint" style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", display: "block", marginBottom: "var(--dt-space-1)" }}>
            Endpoint URL
          </label>
          <input
            id="openai-endpoint"
            name="openai-endpoint"
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            onBlur={commitCredentials}
            placeholder="https://api.openai.com/v1"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            inputMode="url"
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: isMobile ? "46px" : "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: isMobile ? "16px" : "var(--dt-text-sm)",
              fontFamily: "var(--dt-font-mono)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ flex: isMobile ? "1 1 100%" : 1, minWidth: isMobile ? "100%" : "220px" }}>
          <label htmlFor="openai-api-key" style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", display: "block", marginBottom: "var(--dt-space-1)" }}>
            API Key
          </label>
          <input
            id="openai-api-key"
            name="openai-api-key"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onBlur={commitCredentials}
            placeholder="sk-..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: isMobile ? "46px" : "42px",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: isMobile ? "16px" : "var(--dt-text-sm)",
              fontFamily: "var(--dt-font-mono)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--dt-space-2)", alignSelf: isMobile ? "stretch" : "flex-end", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : undefined }}>
          <button
            type="button"
            onClick={() => setShowEndpointHeaders((prev) => !prev)}
            title="Configure custom headers sent with all requests to this endpoint"
            aria-label="Toggle endpoint headers"
            aria-expanded={showEndpointHeaders}
            style={{
              minHeight: isMobile ? "46px" : "42px",
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
              justifyContent: "center",
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
            onClick={status === "connecting" ? cancelConnect : connect}
            title={status === "connecting" ? "Cancel this connection attempt" : "Connect to this endpoint"}
            style={{
              flex: isMobile ? "1 1 auto" : undefined,
              minHeight: isMobile ? "46px" : "42px",
              padding: "var(--dt-space-2) var(--dt-space-5)",
              backgroundColor: status === "connecting" ? "var(--dt-bg-elevated)" : "var(--dt-accent-primary)",
              color: status === "connecting" ? "var(--dt-text-primary)" : "white",
              border: status === "connecting" ? "1px solid var(--dt-border-secondary)" : "none",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-semibold)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--dt-space-2)",
            }}
          >
            {status === "connecting" ? (
              <>
                <X size={16} /> Cancel
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
          padding: isMobile ? "var(--dt-space-3)" : "var(--dt-space-4) var(--dt-space-5)",
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
              width: isMobile ? "44px" : "32px",
              height: isMobile ? "44px" : "32px",
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
              padding: "var(--dt-space-1) var(--dt-space-1) var(--dt-space-1) var(--dt-space-3)",
              minHeight: isMobile ? "44px" : "30px",
              backgroundColor: active ? "var(--dt-accent-primary)" : "var(--dt-bg-tertiary)",
              color: active ? "white" : "var(--dt-text-secondary)",
              border: "1px solid " + (active ? "var(--dt-accent-primary)" : "var(--dt-border-primary)"),
              borderRadius: "var(--dt-radius-full)",
              fontSize: "var(--dt-text-xs)",
              maxWidth: isMobile ? "100%" : "220px",
            }}
          >
            <button
              type="button"
              onClick={() => loadChat(chat.id)}
              title={chat.title}
              style={{
                background: "transparent",
                border: "none",
                padding: "var(--dt-space-1) 0",
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                alignSelf: "stretch",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {chat.title}
            </button>
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
                alignItems: "center",
                justifyContent: "center",
                minWidth: isMobile ? "44px" : "20px",
                minHeight: isMobile ? "44px" : "20px",
                padding: 0,
                borderRadius: "var(--dt-radius-full)",
              }}
            >
              <Trash2 size={12} />
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
          padding: isMobile ? "var(--dt-space-3)" : "var(--dt-space-3) var(--dt-space-5)",
          borderBottom: "1px solid var(--dt-border-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flex: isMobile ? "1 1 100%" : 1, minWidth: 0 }}>
          <MessageSquare size={16} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                maxWidth: isMobile ? "55vw" : "260px",
              }}
            >
              {selectedModel}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : undefined }}>
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
              aria-label="Temperature"
              style={{ flex: isMobile ? "1 1 auto" : undefined, width: isMobile ? undefined : "90px", minWidth: "80px", accentColor: "var(--dt-accent-primary)" }}
            />
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", width: 26 }}>{temperature.toFixed(1)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowModelHeaders((prev) => !prev)}
            disabled={!selectedModel}
            title={selectedModel ? `Configure custom headers specifically for ${selectedModel}` : "Select a model first"}
            aria-label="Model custom headers"
            aria-expanded={showModelHeaders}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              minHeight: isMobile ? "44px" : "34px",
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
            disabled={!selectedModel || !connectedEndpoint || isStreaming}
            title={
              isBenchmarking
                ? "Stop benchmark"
                : connectedEndpoint
                  ? "Benchmark output TPS"
                  : "Connect to an endpoint first"
            }
            aria-label={isBenchmarking ? "Stop benchmark" : "Benchmark output TPS"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--dt-space-1)",
              minHeight: isMobile ? "44px" : "34px",
              padding: "0 var(--dt-space-2)",
              backgroundColor: isBenchmarking ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
              border: "1px solid " + (isBenchmarking ? "var(--dt-accent-error)" : "var(--dt-accent-success)"),
              borderRadius: "var(--dt-radius-md)",
              color: isBenchmarking ? "var(--dt-accent-error)" : "var(--dt-accent-success)",
              fontSize: "var(--dt-text-xs)",
              fontWeight: "var(--dt-font-medium)",
              cursor: selectedModel && connectedEndpoint && !isStreaming ? "pointer" : "not-allowed",
              opacity: selectedModel && connectedEndpoint && !isStreaming ? 1 : 0.5,
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
              minWidth: isMobile ? "44px" : "34px",
              height: isMobile ? "44px" : "34px",
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
            title="Save chat to this browser"
            aria-label="Save chat"
            style={{
              minWidth: isMobile ? "44px" : "34px",
              height: isMobile ? "44px" : "34px",
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

      <div style={{ padding: isMobile ? "var(--dt-space-3) var(--dt-space-3) 0" : "var(--dt-space-4) var(--dt-space-5) 0" }}>
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
            className="dt-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: isMobile ? "var(--dt-space-3)" : "var(--dt-space-4) var(--dt-space-5)",
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
                          minHeight: isMobile ? "44px" : "32px",
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
                            minHeight: isMobile ? "44px" : "32px",
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
                      maxWidth: isMobile ? "92%" : "82%",
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
                      maxWidth: isMobile ? "92%" : "82%",
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
                className="dt-alert"
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
              padding: isMobile ? "var(--dt-space-3)" : "var(--dt-space-4) var(--dt-space-5)",
              borderTop: "1px solid var(--dt-border-primary)",
            }}
          >
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
              {!connectedEndpoint && (
                <div style={{ padding: "var(--dt-space-1) var(--dt-space-2) 0", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                  Not connected — press Connect above to enable sending.
                </div>
              )}
              {attachments.length > 0 && (
                <div style={{ display: "flex", gap: isMobile ? "var(--dt-space-4)" : "var(--dt-space-2)", flexWrap: "wrap" }}>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? "var(--dt-space-1)" : 0,
                      }}
                    >
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        title={attachment.name}
                        style={{
                          width: isMobile ? "64px" : "48px",
                          height: isMobile ? "64px" : "48px",
                          borderRadius: "var(--dt-radius-md)",
                          objectFit: "cover",
                          border: "1px solid var(--dt-border-primary)",
                          display: "block",
                        }}
                      />
                      {isMobile ? (
                        // A full-width control below the thumbnail keeps a proper
                        // 44px tap target without covering the image.
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          title={`Remove ${attachment.name}`}
                          aria-label={`Remove ${attachment.name}`}
                          style={{
                            minHeight: "44px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "var(--dt-space-1)",
                            backgroundColor: "var(--dt-bg-elevated)",
                            border: "1px solid var(--dt-border-primary)",
                            borderRadius: "var(--dt-radius-md)",
                            color: "var(--dt-text-secondary)",
                            cursor: "pointer",
                            fontSize: "var(--dt-text-xs)",
                          }}
                        >
                          <X size={14} /> Remove
                        </button>
                      ) : (
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
                      )}
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
                  onFocus={() => {
                    revealComposer();
                  }}
                  onBlur={() => {
                    cancelComposerReveal();
                  }}
                  placeholder={
                    selectedModel
                      ? isMobile
                        ? "Type a message…"
                        : "Type a message... (Enter to send, Shift+Enter for newline)"
                      : "Select a model to begin chatting."
                  }
                  aria-label="Message"
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
                  fontSize: isMobile ? "16px" : "var(--dt-text-sm)",
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
                  disabled={!selectedModel || !connectedEndpoint || (!input.trim() && attachments.length === 0) || !activeChat}
                  title={connectedEndpoint ? "Send" : "Connect to an endpoint first"}
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
                    opacity:
                      !selectedModel || !connectedEndpoint || (!input.trim() && attachments.length === 0) || !activeChat
                        ? 0.5
                        : 1,
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

  const showConnectionEditor = !isMobile || connectionExpanded || status !== "connected";

  const workspace = isMobile ? (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
      <div style={{ height: "min(340px, 40vh)", minHeight: "200px", display: "flex", flexShrink: 0 }}>{modelsPanel}</div>
      <div ref={chatPanelRef} style={{ height: "min(620px, 66vh)", display: "flex", flexShrink: 0, scrollMarginTop: "var(--dt-space-3)" }}>{chatPanel}</div>
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

  const headerGap = isMobile ? "var(--dt-space-3)" : "var(--dt-space-5)";

  return (
    <div
      className="dt-ai-root"
      style={{
        padding: isMobile ? "var(--dt-space-3)" : "var(--dt-space-6)",
        height: isMobile ? "auto" : availableHeight ? `${availableHeight}px` : "calc(100dvh - 64px)",
        minHeight: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: isMobile ? "var(--dt-space-3)" : "var(--dt-space-5)", flexShrink: 0 }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            color: "var(--dt-text-tertiary)",
            textDecoration: "none",
            fontSize: "var(--dt-text-sm)",
            minHeight: isMobile ? "44px" : "28px",
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
          marginBottom: headerGap,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <h1 style={{ margin: "0 0 var(--dt-space-1) 0", fontSize: isMobile ? "var(--dt-text-2xl)" : "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)" }}>
            OpenAI Playground
          </h1>
          <p style={{ margin: 0, fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
            Connect to any OpenAI-compatible endpoint, browse its models, and chat with streaming responses. Credentials are saved in this browser and stay until you remove them.
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
            maxWidth: "100%",
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", maxWidth: isMobile ? "70vw" : "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

      {notice && (
        <div
          role="status"
          style={{
            padding: "var(--dt-space-2) var(--dt-space-3)",
            marginBottom: headerGap,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid var(--dt-accent-info)",
            color: "var(--dt-accent-info)",
            borderRadius: "var(--dt-radius-md)",
            fontSize: "var(--dt-text-xs)",
            flexShrink: 0,
          }}
        >
          {notice}
        </div>
      )}

      {(credentialError || chatError) && (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--dt-space-2)",
            marginBottom: headerGap,
            flexShrink: 0,
          }}
        >
          {[credentialError, chatError].filter(Boolean).map((message) => (
            <div
              key={message}
              className="dt-alert"
              style={{
                padding: "var(--dt-space-2) var(--dt-space-3)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--dt-accent-error)",
                color: "var(--dt-accent-error)",
                borderRadius: "var(--dt-radius-md)",
                fontSize: "var(--dt-text-xs)",
              }}
            >
              {message}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)",
          padding: isMobile ? "var(--dt-space-4)" : "var(--dt-space-4) var(--dt-space-5)",
          marginBottom: headerGap,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flexWrap: "wrap", marginBottom: showConnectionEditor ? "var(--dt-space-3)" : 0 }}>
          <Shield size={14} color="var(--dt-accent-primary)" />
          <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
            Connection
          </span>
          {status === "error" && (
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-accent-error)" }}>{statusMessage}</span>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flexWrap: "wrap" }}>
            {isMobile && status === "connected" && (
              <button
                type="button"
                onClick={() => setConnectionExpanded((prev) => !prev)}
                aria-expanded={connectionExpanded}
                title={connectionExpanded ? "Hide connection settings" : "Edit connection settings"}
                style={{
                  minHeight: isMobile ? "44px" : "36px",
                  padding: "0 var(--dt-space-3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--dt-space-1)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  color: "var(--dt-text-secondary)",
                  fontSize: "var(--dt-text-xs)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={13} />
                {connectionExpanded ? "Hide" : "Edit"}
                {connectionExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

            {canRemoveCredentials && !confirmRemove && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                title="Remove the saved endpoint, API key, and custom headers from this browser"
                style={{
                  minHeight: isMobile ? "44px" : "36px",
                  padding: "0 var(--dt-space-3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--dt-space-1)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--dt-accent-error)",
                  borderRadius: "var(--dt-radius-md)",
                  color: "var(--dt-accent-error)",
                  fontSize: "var(--dt-text-xs)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} /> Remove credentials
              </button>
            )}

            {confirmRemove && (
              <>
                <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)" }}>Remove saved credentials?</span>
                <button
                  type="button"
                  onClick={removeCredentials}
                  style={{
                    minHeight: isMobile ? "44px" : "36px",
                    padding: "0 var(--dt-space-3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--dt-space-1)",
                    backgroundColor: "var(--dt-accent-error)",
                    border: "1px solid var(--dt-accent-error)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "white",
                    fontSize: "var(--dt-text-xs)",
                    fontWeight: "var(--dt-font-semibold)",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  style={{
                    minHeight: isMobile ? "44px" : "36px",
                    padding: "0 var(--dt-space-3)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-md)",
                    color: "var(--dt-text-secondary)",
                    fontSize: "var(--dt-text-xs)",
                    fontWeight: "var(--dt-font-medium)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {showConnectionEditor ? (
          inputRow
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--dt-font-mono)", fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 auto", minWidth: 0 }}>
              {connectedEndpoint || endpoint}
            </span>
            <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", flexShrink: 0 }}>API key saved</span>
          </div>
        )}
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

        /* Keep the long messages scroller from chaining its overscroll to the page. */
        .dt-scroll { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .dt-hdr-row { row-gap: var(--dt-space-2); }
        /* Error text uses a lighter red so it clears WCAG AA on dark surfaces. */
        .dt-ai-root .dt-alert { color: #fca5a5; }

        /* Visible keyboard focus for every control on this screen, replacing the
           inline outline:none used by the credential and header inputs. */
        .dt-ai-root input:focus-visible,
        .dt-ai-root textarea:focus-visible,
        .dt-ai-root select:focus-visible,
        .dt-ai-root button:focus-visible {
          outline: 2px solid var(--dt-accent-primary) !important;
          outline-offset: 2px;
        }

        @media (max-width: 767px) {
          /* 16px stops mobile Safari from zooming the viewport when a field is
             focused; 44px keeps the header editor comfortable to tap. */
          .dt-hdr-input { font-size: 16px !important; min-height: 44px !important; }
          .dt-hdr-btn { min-height: 44px !important; min-width: 44px !important; padding: 0 var(--dt-space-2) !important; }
          .dt-hdr-check { width: 24px; height: 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .stream-dot { animation: none !important; }
          /* Loader spinners are declared inline; neutralise them here. */
          .dt-ai-root [style*="animation"] { animation: none !important; }
          .dt-ai-root { scroll-behavior: auto !important; }
        }
      `}</style>
    </div>
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.AI,
  description:
    "Connect to any OpenAI-compatible endpoint, browse available models, and chat with streaming responses. Credentials and saved chats stay in this browser until you remove them.",
  id: "openai-playground-tool",
  name: "OpenAI Playground",
  tool: OpenAIPlayground,
});