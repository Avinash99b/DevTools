import { Settings } from "lucide-react";
import { ToolCard } from "../components/ToolCard";
import { StatusBadge } from "../components/StatusBadge";
import { TerminalOutput } from "../components/TerminalOutput";

export function DesignSystem() {
  const sampleLogs = [
    { timestamp: "14:32:15", level: "info" as const, message: "Starting process..." },
    { timestamp: "14:32:16", level: "success" as const, message: "Operation completed successfully" },
    { timestamp: "14:32:17", level: "warning" as const, message: "Cache not found, using defaults" },
    { timestamp: "14:32:18", level: "error" as const, message: "Failed to connect to server" }
  ];

  return (
    <div style={{ padding: "var(--dt-space-8)", maxWidth: "1400px" }}>
      <h1 style={{
        fontSize: "var(--dt-text-4xl)",
        fontWeight: "var(--dt-font-bold)",
        color: "var(--dt-text-primary)",
        margin: "0 0 var(--dt-space-2) 0"
      }}>
        DevTools Design System
      </h1>
      <p style={{
        fontSize: "var(--dt-text-lg)",
        color: "var(--dt-text-secondary)",
        margin: "0 0 var(--dt-space-12) 0"
      }}>
        Complete UI/UX design system for the modular developer tools platform
      </p>

      {/* Color Palette */}
      <section style={{ marginBottom: "var(--dt-space-12)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Color Palette
        </h2>

        <div style={{ marginBottom: "var(--dt-space-6)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Primary Colors
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--dt-space-4)" }}>
            {[
              { name: "Primary BG", var: "var(--dt-bg-primary)" },
              { name: "Secondary BG", var: "var(--dt-bg-secondary)" },
              { name: "Tertiary BG", var: "var(--dt-bg-tertiary)" },
              { name: "Elevated BG", var: "var(--dt-bg-elevated)" },
              { name: "Hover BG", var: "var(--dt-bg-hover)" }
            ].map((color) => (
              <div key={color.name}>
                <div style={{
                  height: "80px",
                  backgroundColor: color.var,
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  marginBottom: "var(--dt-space-2)"
                }} />
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                  {color.name}
                </div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {color.var}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "var(--dt-space-6)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Accent Colors
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--dt-space-4)" }}>
            {[
              { name: "Primary Accent", var: "var(--dt-accent-primary)" },
              { name: "Success", var: "var(--dt-accent-success)" },
              { name: "Warning", var: "var(--dt-accent-warning)" },
              { name: "Error", var: "var(--dt-accent-error)" },
              { name: "Info", var: "var(--dt-accent-info)" }
            ].map((color) => (
              <div key={color.name}>
                <div style={{
                  height: "80px",
                  backgroundColor: color.var,
                  borderRadius: "var(--dt-radius-md)",
                  marginBottom: "var(--dt-space-2)"
                }} />
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                  {color.name}
                </div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {color.var}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Category Colors
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--dt-space-4)" }}>
            {[
              { name: "Image Tools", var: "var(--dt-category-image)" },
              { name: "Video Tools", var: "var(--dt-category-video)" },
              { name: "APK Tools", var: "var(--dt-category-apk)" },
              { name: "Utilities", var: "var(--dt-category-utility)" }
            ].map((color) => (
              <div key={color.name}>
                <div style={{
                  height: "80px",
                  backgroundColor: color.var,
                  borderRadius: "var(--dt-radius-md)",
                  marginBottom: "var(--dt-space-2)"
                }} />
                <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
                  {color.name}
                </div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  fontFamily: "var(--dt-font-mono)"
                }}>
                  {color.var}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: "var(--dt-space-12)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Typography
        </h2>

        <div style={{
          padding: "var(--dt-space-6)",
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)"
        }}>
          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <div style={{ fontSize: "var(--dt-text-4xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)" }}>
              Heading 1 (36px)
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-4xl); font-weight: var(--dt-font-bold);
            </div>
          </div>

          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <div style={{ fontSize: "var(--dt-text-3xl)", fontWeight: "var(--dt-font-bold)", color: "var(--dt-text-primary)" }}>
              Heading 2 (30px)
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-3xl); font-weight: var(--dt-font-bold);
            </div>
          </div>

          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <div style={{ fontSize: "var(--dt-text-2xl)", fontWeight: "var(--dt-font-semibold)", color: "var(--dt-text-primary)" }}>
              Heading 3 (24px)
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-2xl); font-weight: var(--dt-font-semibold);
            </div>
          </div>

          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <div style={{ fontSize: "var(--dt-text-base)", color: "var(--dt-text-primary)" }}>
              Body Text (16px) - The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet.
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-base); font-weight: var(--dt-font-normal);
            </div>
          </div>

          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <div style={{ fontSize: "var(--dt-text-sm)", color: "var(--dt-text-secondary)" }}>
              Small Text (14px) - Secondary information and labels
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-sm); color: var(--dt-text-secondary);
            </div>
          </div>

          <div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
              Caption (12px) - Timestamps, metadata, and captions
            </div>
            <div style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-muted)", fontFamily: "var(--dt-font-mono)" }}>
              font-size: var(--dt-text-xs); color: var(--dt-text-tertiary);
            </div>
          </div>
        </div>

        <div style={{
          marginTop: "var(--dt-space-4)",
          padding: "var(--dt-space-6)",
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)"
        }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Monospace Font (JetBrains Mono)
          </h3>
          <div style={{
            fontSize: "var(--dt-text-sm)",
            fontFamily: "var(--dt-font-mono)",
            color: "var(--dt-terminal-green)",
            backgroundColor: "var(--dt-bg-primary)",
            padding: "var(--dt-space-4)",
            borderRadius: "var(--dt-radius-md)"
          }}>
            const devTools = &#123; terminal: true, output: "success" &#125;;
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={{ marginBottom: "var(--dt-space-12)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Spacing System
        </h2>
        <div style={{
          padding: "var(--dt-space-6)",
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)"
        }}>
          {[
            { name: "space-1", value: "4px" },
            { name: "space-2", value: "8px" },
            { name: "space-3", value: "12px" },
            { name: "space-4", value: "16px" },
            { name: "space-5", value: "20px" },
            { name: "space-6", value: "24px" },
            { name: "space-8", value: "32px" },
            { name: "space-10", value: "40px" },
            { name: "space-12", value: "48px" },
            { name: "space-16", value: "64px" }
          ].map((spacing) => (
            <div key={spacing.name} style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-4)",
              marginBottom: "var(--dt-space-3)"
            }}>
              <div style={{
                width: "120px",
                fontSize: "var(--dt-text-sm)",
                fontFamily: "var(--dt-font-mono)",
                color: "var(--dt-text-secondary)"
              }}>
                --dt-{spacing.name}
              </div>
              <div style={{
                width: "60px",
                fontSize: "var(--dt-text-xs)",
                color: "var(--dt-text-tertiary)"
              }}>
                {spacing.value}
              </div>
              <div style={{
                height: "24px",
                width: spacing.value,
                backgroundColor: "var(--dt-accent-primary)",
                borderRadius: "var(--dt-radius-sm)"
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* Components */}
      <section style={{ marginBottom: "var(--dt-space-12)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Components
        </h2>

        {/* Buttons */}
        <div style={{ marginBottom: "var(--dt-space-8)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Buttons
          </h3>
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            display: "flex",
            gap: "var(--dt-space-4)",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <button style={{
              padding: "var(--dt-space-3) var(--dt-space-6)",
              backgroundColor: "var(--dt-accent-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-semibold)",
              cursor: "pointer"
            }}>
              Primary Button
            </button>

            <button style={{
              padding: "var(--dt-space-3) var(--dt-space-6)",
              backgroundColor: "var(--dt-bg-tertiary)",
              color: "var(--dt-text-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer"
            }}>
              Secondary Button
            </button>

            <button style={{
              padding: "var(--dt-space-3) var(--dt-space-6)",
              backgroundColor: "transparent",
              color: "var(--dt-status-error)",
              border: "1px solid var(--dt-status-error)",
              borderRadius: "var(--dt-radius-md)",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              cursor: "pointer"
            }}>
              Danger Button
            </button>

            <button style={{
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-tertiary)",
              color: "var(--dt-text-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ marginBottom: "var(--dt-space-8)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Status Badges
          </h3>
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            display: "flex",
            gap: "var(--dt-space-4)",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <StatusBadge status="running" />
            <StatusBadge status="success" />
            <StatusBadge status="error" />
            <StatusBadge status="warning" />
            <StatusBadge status="idle" />
            <StatusBadge status="queued" />
          </div>
        </div>

        {/* Plugin Card */}
        <div style={{ marginBottom: "var(--dt-space-8)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Plugin Card
          </h3>
          <div style={{ maxWidth: "400px" }}>
            <ToolCard
              id="sample"
              name="Sample Plugin"
              tool={function(){}}
              description="This is a sample plugin demonstrating the card component design"
              categoryId="apk-aab-tools"
              author="DevTools Team"
            />
          </div>
        </div>

        {/* Terminal Output */}
        <div style={{ marginBottom: "var(--dt-space-8)" }}>
          <h3 style={{
            fontSize: "var(--dt-text-lg)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-primary)",
            margin: "0 0 var(--dt-space-4) 0"
          }}>
            Terminal Output
          </h3>
          <TerminalOutput logs={sampleLogs} title="Sample Output" height="200px" />
        </div>
      </section>

      {/* Design Principles */}
      <section style={{ marginBottom: "var(--dt-space-12)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Design Principles
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--dt-space-6)" }}>
          {[
            {
              title: "Minimal & Functional",
              description: "Clean interfaces without clutter. Every element serves a purpose.",
              icon: "🎯"
            },
            {
              title: "Developer-First",
              description: "Terminal-inspired aesthetics with monospace fonts and clear hierarchies.",
              icon: "💻"
            },
            {
              title: "Fast & Responsive",
              description: "Minimal animations, instant feedback, keyboard shortcuts support.",
              icon: "⚡"
            },
            {
              title: "Dark Mode Priority",
              description: "Designed dark-first with optional light theme support.",
              icon: "🌙"
            },
            {
              title: "Modular Architecture",
              description: "Plugin-driven UI components that scale with the platform.",
              icon: "🧩"
            },
            {
              title: "Clear Status",
              description: "Visual feedback for loading, success, error, and warning states.",
              icon: "✅"
            }
          ].map((principle) => (
            <div
              key={principle.title}
              style={{
                padding: "var(--dt-space-6)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)"
              }}
            >
              <div style={{
                fontSize: "var(--dt-text-3xl)",
                marginBottom: "var(--dt-space-3)"
              }}>
                {principle.icon}
              </div>
              <h3 style={{
                fontSize: "var(--dt-text-lg)",
                fontWeight: "var(--dt-font-semibold)",
                color: "var(--dt-text-primary)",
                margin: "0 0 var(--dt-space-2) 0"
              }}>
                {principle.title}
              </h3>
              <p style={{
                fontSize: "var(--dt-text-sm)",
                color: "var(--dt-text-secondary)",
                margin: 0,
                lineHeight: "var(--dt-leading-relaxed)"
              }}>
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Implementation Notes */}
      <section>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Implementation Guidelines
        </h2>
        <div style={{
          padding: "var(--dt-space-6)",
          backgroundColor: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: "var(--dt-radius-lg)"
        }}>
          <div style={{ marginBottom: "var(--dt-space-4)" }}>
            <h3 style={{
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-2) 0"
            }}>
              For Web (React + Tailwind)
            </h3>
            <ul style={{
              fontSize: "var(--dt-text-sm)",
              color: "var(--dt-text-secondary)",
              lineHeight: "var(--dt-leading-relaxed)",
              margin: 0,
              paddingLeft: "var(--dt-space-6)"
            }}>
              <li>Import /src/styles/devtools-theme.css in your main entry point</li>
              <li>Use CSS custom properties (var(--dt-*)) for all theming</li>
              <li>Build reusable components following the examples above</li>
              <li>Maintain component modularity for plugin integration</li>
            </ul>
          </div>
          <div>
            <h3 style={{
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-2) 0"
            }}>
              For Android (Jetpack Compose)
            </h3>
            <ul style={{
              fontSize: "var(--dt-text-sm)",
              color: "var(--dt-text-secondary)",
              lineHeight: "var(--dt-leading-relaxed)",
              margin: 0,
              paddingLeft: "var(--dt-space-6)"
            }}>
              <li>Create Color.kt with matching color values</li>
              <li>Define Typography.kt using similar font scales</li>
              <li>Use MaterialTheme with custom color scheme</li>
              <li>Follow same spacing system (4dp, 8dp, 12dp, etc.)</li>
              <li>Adapt cards, badges, and terminal UI to Compose components</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
