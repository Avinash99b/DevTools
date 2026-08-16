import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Gauge,
  Hash,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Zap,
} from "lucide-react";
import { registerDevTool } from "../../core/DevToolManager";
import { ToolCategories } from "../../core/CategoryManager";
import { useIsMobile } from "../../components/ui/use-mobile";

const MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "claude-3.5-sonnet",
  "llama-3.1-70b",
  "gemini-1.5-pro",
  "mistral-large",
];

const CORPUS = `Tokens are how language models measure the building blocks of text. A token is roughly a short word or a piece of a longer word, and models process input and generate output one token at a time. Faster token generation means responses feel snappier and more natural, which is why tokens per second is one of the most watched metrics for inference servers. Consumer hardware, quantization, batch size, and prompt length all affect how quickly a model streams tokens back to you. This simulator renders a stream of tokens at the rate you configure, so you can get a feel for how different speeds compare side by side. Slow rates read like careful dictation, while high rates flash by almost instantly. Tune the number while the stream is running and watch the output restart automatically from the top. Token count, elapsed time, and the effective throughput update live as the text flows.`;

const WORDS = CORPUS.split(/\s+/);

function TpsSimulator() {
  const isMobile = useIsMobile();

  const [model, setModel] = useState(MODELS[0]);
  const [tps, setTps] = useState(40);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState("");
  const [emitted, setEmitted] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const wordIndexRef = useRef(0);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const tickMs = 1000 / tps;
    const id = setInterval(() => {
      setText((prev) => {
        const word = WORDS[wordIndexRef.current % WORDS.length];
        wordIndexRef.current += 1;
        return prev ? prev + " " + word : word;
      });
      setEmitted((n) => n + 1);
      setElapsed((e) => e + tickMs / 1000);
    }, tickMs);
    return () => clearInterval(id);
  }, [running, tps]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [text]);

  function start() {
    setText("");
    setEmitted(0);
    setElapsed(0);
    wordIndexRef.current = 0;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setText("");
    setEmitted(0);
    setElapsed(0);
    wordIndexRef.current = 0;
  }

  function handleTpsChange(value: string) {
    const next = Math.min(500, Math.max(1, parseFloat(value) || 1));
    setTps(next);
    if (running) {
      setText("");
      setEmitted(0);
      setElapsed(0);
      wordIndexRef.current = 0;
    }
  }

  const effectiveTps = elapsed > 0 ? emitted / elapsed : 0;

  const statCard = (label: string, value: string, icon: React.ReactNode) => (
    <div
      style={{
        flex: 1,
        minWidth: isMobile ? "calc(50% - var(--dt-space-2))" : 0,
        padding: "var(--dt-space-3)",
        backgroundColor: "var(--dt-bg-tertiary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: "var(--dt-radius-md)",
        display: "flex",
        alignItems: "center",
        gap: "var(--dt-space-2)",
      }}
    >
      <span style={{ color: "var(--dt-accent-primary)", display: "inline-flex", flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)", whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontSize: "var(--dt-text-base)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)", fontFamily: "var(--dt-font-mono)" }}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "var(--dt-space-6)", height: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "var(--dt-space-5)" }}>
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
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: "0 0 var(--dt-space-1) 0",
              fontSize: "var(--dt-text-3xl)",
              fontWeight: "var(--dt-font-bold)",
              color: "var(--dt-text-primary)",
            }}
          >
            TPS Simulator
          </h1>
          <p style={{ margin: 0, fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
            Streams tokens in real time at a configurable rate. Changing the TPS instantly clears the output and restarts the simulation.
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
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: running ? "var(--dt-status-running)" : "var(--dt-status-idle)",
              animation: running ? "pulse 1.2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-secondary)" }}>
            {running ? "Streaming" : "Idle"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 360px) 1fr",
          gap: "var(--dt-space-5)",
          height: isMobile ? "auto" : "calc(100dvh - 240px)",
          minHeight: "460px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--dt-space-4)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            padding: "var(--dt-space-5)",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
                marginBottom: "var(--dt-space-2)",
              }}
            >
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: "100%",
                minHeight: "42px",
                padding: "var(--dt-space-2) var(--dt-space-3)",
                backgroundColor: "var(--dt-bg-tertiary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                color: "var(--dt-text-primary)",
                fontSize: "var(--dt-text-sm)",
                fontFamily: "var(--dt-font-mono)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "var(--dt-text-sm)",
                fontWeight: "var(--dt-font-medium)",
                color: "var(--dt-text-primary)",
                marginBottom: "var(--dt-space-2)",
              }}
            >
              Tokens / Second
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
              <input
                type="number"
                min={1}
                max={500}
                step={1}
                value={tps}
                onChange={(e) => handleTpsChange(e.target.value)}
                aria-label="Tokens per second"
                style={{
                  flex: 1,
                  minHeight: "42px",
                  padding: "var(--dt-space-2) var(--dt-space-3)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  color: "var(--dt-text-primary)",
                  fontSize: "var(--dt-text-base)",
                  fontFamily: "var(--dt-font-mono)",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>tps</span>
            </div>
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              value={Math.min(tps, 200)}
              onChange={(e) => handleTpsChange(e.target.value)}
              aria-label="Tokens per second slider"
              style={{ width: "100%", marginTop: "var(--dt-space-3)", accentColor: "var(--dt-accent-primary)" }}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--dt-space-2)" }}>
            {running ? (
              <button
                type="button"
                onClick={pause}
                style={{
                  flex: 1,
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--dt-space-2)",
                  backgroundColor: "var(--dt-accent-warning)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-semibold)",
                  cursor: "pointer",
                }}
              >
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                style={{
                  flex: 1,
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--dt-space-2)",
                  backgroundColor: "var(--dt-accent-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-semibold)",
                  cursor: "pointer",
                }}
              >
                <Play size={16} /> Start
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              title="Reset"
              aria-label="Reset simulation"
              style={{
                minWidth: "44px",
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--dt-bg-tertiary)",
                color: "var(--dt-text-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-md)",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "var(--dt-space-2)", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            {statCard("Tokens", String(emitted), <Hash size={16} />)}
            {statCard("Elapsed", `${elapsed.toFixed(1)}s`, <Timer size={16} />)}
            {statCard("Eff. TPS", effectiveTps.toFixed(1), <Gauge size={16} />)}
          </div>
        </div>

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
              padding: "var(--dt-space-3) var(--dt-space-5)",
              borderBottom: "1px solid var(--dt-border-primary)",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--dt-terminal-red)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--dt-terminal-yellow)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--dt-terminal-green)" }} />
            </div>
            <span style={{ fontSize: "var(--dt-text-sm)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
              Token Stream
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--dt-font-mono)",
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Zap size={12} style={{ color: "var(--dt-accent-warning)" }} /> {tps} tps · {model}
            </span>
          </div>

          <div
            ref={outputRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "var(--dt-space-5)",
              backgroundColor: "var(--dt-bg-primary)",
              fontFamily: "var(--dt-font-mono)",
              fontSize: "var(--dt-text-sm)",
              lineHeight: "var(--dt-leading-relaxed)",
              color: "var(--dt-terminal-green)",
              minHeight: "240px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {text ? (
              <>
                {text}
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "1em",
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                    backgroundColor: "var(--dt-terminal-green)",
                    animation: "blink 1s steps(2, start) infinite",
                  }}
                />
              </>
            ) : (
              <span style={{ color: "var(--dt-text-tertiary)" }}>
                {running ? "Waiting for tokens..." : "Press Start to begin the token stream."}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          to { visibility: hidden; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

registerDevTool({
  author: "System",
  categoryId: ToolCategories.AI,
  description:
    "Simulate realtime token output of a model at a configurable tokens-per-second rate. Changing the TPS clears the stream and restarts instantly.",
  id: "tps-simulator-tool",
  name: "TPS Simulator",
  tool: TpsSimulator,
});