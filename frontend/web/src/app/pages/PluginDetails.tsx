import { useParams, Link } from "react-router";
import { ArrowLeft, Download, Star, GitBranch, Users, Calendar, Globe, Github, ExternalLink, Play, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

export function PluginDetails() {
  const { id } = useParams();
  const [isInstalled, setIsInstalled] = useState(true);

  // Mock plugin data
  const plugin = {
    name: "Image Compressor",
    description: "Advanced image compression tool with support for JPEG, PNG, and WebP formats. Utilizes state-of-the-art algorithms to reduce file size while maintaining visual quality.",
    category: "Image Tools",
    version: "2.1.4",
    author: "DevTools Team",
    downloads: 45230,
    rating: 4.8,
    lastUpdated: "2026-03-15",
    repository: "https://github.com/devtools/image-compressor",
    website: "https://devtools.example.com",
    license: "MIT",
    longDescription: `
This plugin provides powerful image compression capabilities with fine-grained control over output quality and format. Perfect for optimizing images for web, mobile apps, or storage.

**Features:**
- Support for JPEG, PNG, and WebP formats
- Adjustable quality settings (1-100)
- Batch processing capability
- Preserve EXIF metadata option
- Multiple compression algorithms
- Real-time preview
- Automatic format recommendations

**Use Cases:**
- Website optimization
- Mobile app asset preparation
- Bulk photo processing
- Storage space reduction
    `,
    changelog: [
      { version: "2.1.4", date: "2026-03-15", changes: "Fixed WebP encoding bug, improved performance" },
      { version: "2.1.0", date: "2026-02-20", changes: "Added WebP format support" },
      { version: "2.0.0", date: "2026-01-10", changes: "Complete rewrite with new compression engine" }
    ],
    dependencies: [
      { name: "sharp", version: "^0.32.0" },
      { name: "imagemin", version: "^8.0.1" }
    ]
  };

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--dt-space-6)" }}>
        <Link
          to="/marketplace"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            color: "var(--dt-text-tertiary)",
            textDecoration: "none",
            fontSize: "var(--dt-text-sm)",
            transition: "color var(--dt-transition-fast)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--dt-accent-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--dt-text-tertiary)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Marketplace
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--dt-space-8)" }}>
        {/* Main Content */}
        <div>
          {/* Header */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            marginBottom: "var(--dt-space-6)"
          }}>
            <div style={{
              display: "inline-block",
              padding: "var(--dt-space-1) var(--dt-space-3)",
              backgroundColor: "rgba(236, 72, 153, 0.1)",
              border: "1px solid var(--dt-category-image)",
              borderRadius: "var(--dt-radius-full)",
              fontSize: "var(--dt-text-xs)",
              fontWeight: "var(--dt-font-medium)",
              color: "var(--dt-category-image)",
              marginBottom: "var(--dt-space-4)"
            }}>
              {plugin.category}
            </div>

            <h1 style={{
              fontSize: "var(--dt-text-3xl)",
              fontWeight: "var(--dt-font-bold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-2) 0"
            }}>
              {plugin.name}
            </h1>

            <p style={{
              fontSize: "var(--dt-text-base)",
              color: "var(--dt-text-secondary)",
              margin: "0 0 var(--dt-space-5) 0"
            }}>
              {plugin.description}
            </p>

            {/* Stats Row */}
            <div style={{
              display: "flex",
              gap: "var(--dt-space-6)",
              paddingTop: "var(--dt-space-4)",
              borderTop: "1px solid var(--dt-border-primary)",
              fontSize: "var(--dt-text-sm)",
              color: "var(--dt-text-tertiary)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                <Star size={16} fill="var(--dt-accent-warning)" color="var(--dt-accent-warning)" />
                <span style={{ color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                  {plugin.rating}
                </span>
                <span>rating</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                <Download size={16} />
                <span style={{ color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                  {plugin.downloads.toLocaleString()}
                </span>
                <span>downloads</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)" }}>
                <GitBranch size={16} />
                <span style={{ color: "var(--dt-text-primary)", fontWeight: "var(--dt-font-medium)" }}>
                  v{plugin.version}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            marginBottom: "var(--dt-space-6)"
          }}>
            <h2 style={{
              fontSize: "var(--dt-text-xl)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-4) 0"
            }}>
              About
            </h2>
            <div style={{
              fontSize: "var(--dt-text-sm)",
              color: "var(--dt-text-secondary)",
              lineHeight: "var(--dt-leading-relaxed)",
              whiteSpace: "pre-line"
            }}>
              {plugin.longDescription}
            </div>
          </div>

          {/* Changelog */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)"
          }}>
            <h2 style={{
              fontSize: "var(--dt-text-xl)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-4) 0"
            }}>
              Changelog
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-4)" }}>
              {plugin.changelog.map((entry) => (
                <div key={entry.version} style={{
                  padding: "var(--dt-space-4)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  borderLeft: "3px solid var(--dt-accent-primary)",
                  borderRadius: "var(--dt-radius-md)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-3)", marginBottom: "var(--dt-space-2)" }}>
                    <span style={{
                      fontSize: "var(--dt-text-sm)",
                      fontWeight: "var(--dt-font-semibold)",
                      color: "var(--dt-text-primary)",
                      fontFamily: "var(--dt-font-mono)"
                    }}>
                      v{entry.version}
                    </span>
                    <span style={{
                      fontSize: "var(--dt-text-xs)",
                      color: "var(--dt-text-tertiary)"
                    }}>
                      {entry.date}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "var(--dt-text-sm)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                  }}>
                    {entry.changes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Action Buttons */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            marginBottom: "var(--dt-space-6)"
          }}>
            {isInstalled ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-3)" }}>
                <Link
                  to={`/tool/${id}`}
                  style={{
                    padding: "var(--dt-space-3)",
                    backgroundColor: "var(--dt-accent-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--dt-radius-md)",
                    fontSize: "var(--dt-text-base)",
                    fontWeight: "var(--dt-font-semibold)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--dt-space-2)",
                    textDecoration: "none"
                  }}
                >
                  <Play size={18} />
                  Run Tool
                </Link>
                <button style={{
                  padding: "var(--dt-space-3)",
                  backgroundColor: "var(--dt-bg-tertiary)",
                  color: "var(--dt-text-secondary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--dt-space-2)"
                }}>
                  <Settings size={16} />
                  Configure
                </button>
                <button 
                  onClick={() => setIsInstalled(false)}
                  style={{
                    padding: "var(--dt-space-3)",
                    backgroundColor: "transparent",
                    color: "var(--dt-status-error)",
                    border: "1px solid var(--dt-status-error)",
                    borderRadius: "var(--dt-radius-md)",
                    fontSize: "var(--dt-text-sm)",
                    fontWeight: "var(--dt-font-medium)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--dt-space-2)"
                  }}
                >
                  <Trash2 size={16} />
                  Uninstall
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsInstalled(true)}
                style={{
                  width: "100%",
                  padding: "var(--dt-space-3)",
                  backgroundColor: "var(--dt-accent-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-base)",
                  fontWeight: "var(--dt-font-semibold)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--dt-space-2)"
                }}
              >
                <Download size={18} />
                Install Plugin
              </button>
            )}
          </div>

          {/* Info */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            marginBottom: "var(--dt-space-6)"
          }}>
            <h3 style={{
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-4) 0"
            }}>
              Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-3)" }}>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  Author
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-primary)",
                  fontWeight: "var(--dt-font-medium)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--dt-space-2)"
                }}>
                  <Users size={14} />
                  {plugin.author}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  Last Updated
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-primary)",
                  fontWeight: "var(--dt-font-medium)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--dt-space-2)"
                }}>
                  <Calendar size={14} />
                  {plugin.lastUpdated}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-muted)",
                  marginBottom: "var(--dt-space-1)"
                }}>
                  License
                </div>
                <div style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-primary)",
                  fontWeight: "var(--dt-font-medium)"
                }}>
                  {plugin.license}
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)",
            marginBottom: "var(--dt-space-6)"
          }}>
            <h3 style={{
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-4) 0"
            }}>
              Links
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
              <a
                href={plugin.repository}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--dt-space-2)",
                  padding: "var(--dt-space-2)",
                  color: "var(--dt-text-secondary)",
                  textDecoration: "none",
                  fontSize: "var(--dt-text-sm)",
                  borderRadius: "var(--dt-radius-sm)",
                  transition: "all var(--dt-transition-fast)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-tertiary)";
                  e.currentTarget.style.color = "var(--dt-accent-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--dt-text-secondary)";
                }}
              >
                <Github size={16} />
                Repository
                <ExternalLink size={12} style={{ marginLeft: "auto" }} />
              </a>
              <a
                href={plugin.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--dt-space-2)",
                  padding: "var(--dt-space-2)",
                  color: "var(--dt-text-secondary)",
                  textDecoration: "none",
                  fontSize: "var(--dt-text-sm)",
                  borderRadius: "var(--dt-radius-sm)",
                  transition: "all var(--dt-transition-fast)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-tertiary)";
                  e.currentTarget.style.color = "var(--dt-accent-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--dt-text-secondary)";
                }}
              >
                <Globe size={16} />
                Website
                <ExternalLink size={12} style={{ marginLeft: "auto" }} />
              </a>
            </div>
          </div>

          {/* Dependencies */}
          <div style={{
            padding: "var(--dt-space-6)",
            backgroundColor: "var(--dt-bg-secondary)",
            border: "1px solid var(--dt-border-primary)",
            borderRadius: "var(--dt-radius-lg)"
          }}>
            <h3 style={{
              fontSize: "var(--dt-text-base)",
              fontWeight: "var(--dt-font-semibold)",
              color: "var(--dt-text-primary)",
              margin: "0 0 var(--dt-space-4) 0"
            }}>
              Dependencies
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--dt-space-2)" }}>
              {plugin.dependencies.map((dep) => (
                <div
                  key={dep.name}
                  style={{
                    padding: "var(--dt-space-2)",
                    backgroundColor: "var(--dt-bg-tertiary)",
                    borderRadius: "var(--dt-radius-sm)",
                    fontSize: "var(--dt-text-xs)",
                    fontFamily: "var(--dt-font-mono)",
                    color: "var(--dt-text-secondary)"
                  }}
                >
                  {dep.name} <span style={{ color: "var(--dt-text-muted)" }}>{dep.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
