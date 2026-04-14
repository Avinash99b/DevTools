import { useState } from "react";
import { Filter, Download, Star, TrendingUp, Clock } from "lucide-react";
import { PluginCard } from "../components/PluginCard";

export function PluginMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");

  const categories = [
    { id: "all", label: "All Tools", count: 59 },
    { id: "image", label: "Image Tools", count: 12 },
    { id: "video", label: "Video Tools", count: 8 },
    { id: "apk", label: "APK/AAB", count: 15 },
    { id: "utility", label: "Utilities", count: 24 }
  ];

  const sortOptions = [
    { id: "popular", label: "Most Popular", icon: TrendingUp },
    { id: "rating", label: "Highest Rated", icon: Star },
    { id: "downloads", label: "Most Downloaded", icon: Download },
    { id: "recent", label: "Recently Added", icon: Clock }
  ];

  const plugins = [
    {
      id: "image-compress",
      name: "Image Compressor",
      description: "Compress images with advanced algorithms while maintaining quality. Supports JPEG, PNG, WebP formats.",
      category: "image" as const,
      version: "2.1.4",
      author: "DevTools Team",
      downloads: 45230,
      rating: 4.8,
      installed: true,
      enabled: true
    },
    {
      id: "video-transcoder",
      name: "Video Transcoder",
      description: "Convert videos between formats with customizable quality and codec settings.",
      category: "video" as const,
      version: "1.8.0",
      author: "MediaCraft",
      downloads: 32150,
      rating: 4.6,
      installed: false
    },
    {
      id: "json-formatter",
      name: "JSON Formatter",
      description: "Format, validate, and minify JSON with syntax highlighting and error detection.",
      category: "utility" as const,
      version: "1.5.0",
      author: "Community",
      downloads: 78450,
      rating: 4.9,
      installed: true,
      enabled: true
    },
    {
      id: "apk-analyzer",
      name: "APK Analyzer",
      description: "Analyze APK structure, permissions, resources, and detect potential issues.",
      category: "apk" as const,
      version: "3.0.2",
      author: "Android Team",
      downloads: 34120,
      rating: 4.7,
      installed: true,
      enabled: false
    },
    {
      id: "qr-generator",
      name: "QR Code Generator",
      description: "Generate customizable QR codes with various encoding options and styles.",
      category: "utility" as const,
      version: "2.3.1",
      author: "QRTools",
      downloads: 56780,
      rating: 4.8,
      installed: false
    },
    {
      id: "color-picker",
      name: "Advanced Color Picker",
      description: "Extract colors from images, generate palettes, and convert between formats.",
      category: "image" as const,
      version: "1.2.5",
      author: "ColorLab",
      downloads: 23450,
      rating: 4.5,
      installed: false
    },
    {
      id: "apk-signer",
      name: "APK Signer",
      description: "Sign Android packages with custom keystores and verify signatures.",
      category: "apk" as const,
      version: "2.5.0",
      author: "Security Tools",
      downloads: 41200,
      rating: 4.9,
      installed: false
    },
    {
      id: "base64-tool",
      name: "Base64 Encoder/Decoder",
      description: "Encode and decode Base64 strings with support for files and text.",
      category: "utility" as const,
      version: "1.1.0",
      author: "DevUtils",
      downloads: 67890,
      rating: 4.7,
      installed: false
    },
    {
      id: "gif-maker",
      name: "GIF Creator",
      description: "Create animated GIFs from images or video clips with frame control.",
      category: "video" as const,
      version: "1.4.2",
      author: "AnimationStudio",
      downloads: 28340,
      rating: 4.6,
      installed: false
    }
  ];

  const filteredPlugins = selectedCategory === "all" 
    ? plugins 
    : plugins.filter(p => p.category === selectedCategory);

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--dt-space-8)" }}>
        <h1 style={{
          fontSize: "var(--dt-text-3xl)",
          fontWeight: "var(--dt-font-bold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-2) 0"
        }}>
          Plugin Marketplace
        </h1>
        <p style={{
          fontSize: "var(--dt-text-base)",
          color: "var(--dt-text-secondary)",
          margin: 0
        }}>
          Discover and install tools from the community
        </p>
      </div>

      {/* Filters and Sort */}
      <div style={{
        display: "flex",
        gap: "var(--dt-space-6)",
        marginBottom: "var(--dt-space-6)",
        paddingBottom: "var(--dt-space-6)",
        borderBottom: "1px solid var(--dt-border-primary)"
      }}>
        {/* Category Filter */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            marginBottom: "var(--dt-space-3)"
          }}>
            <Filter size={16} color="var(--dt-text-tertiary)" />
            <span style={{
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              color: "var(--dt-text-secondary)"
            }}>
              Category
            </span>
          </div>
          <div style={{
            display: "flex",
            gap: "var(--dt-space-2)",
            flexWrap: "wrap"
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "var(--dt-space-2) var(--dt-space-4)",
                  backgroundColor: selectedCategory === cat.id 
                    ? "var(--dt-accent-primary)" 
                    : "var(--dt-bg-secondary)",
                  color: selectedCategory === cat.id 
                    ? "white" 
                    : "var(--dt-text-secondary)",
                  border: selectedCategory === cat.id 
                    ? "1px solid var(--dt-accent-primary)" 
                    : "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-md)",
                  fontSize: "var(--dt-text-sm)",
                  fontWeight: "var(--dt-font-medium)",
                  cursor: "pointer",
                  transition: "all var(--dt-transition-fast)"
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
                  }
                }}
              >
                {cat.label}
                <span style={{
                  marginLeft: "var(--dt-space-2)",
                  opacity: 0.7,
                  fontSize: "var(--dt-text-xs)"
                }}>
                  ({cat.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div style={{ width: "240px" }}>
          <label style={{
            display: "block",
            fontSize: "var(--dt-text-sm)",
            fontWeight: "var(--dt-font-medium)",
            color: "var(--dt-text-secondary)",
            marginBottom: "var(--dt-space-3)"
          }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--dt-space-2) var(--dt-space-3)",
              backgroundColor: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: "var(--dt-radius-md)",
              color: "var(--dt-text-primary)",
              fontSize: "var(--dt-text-sm)",
              cursor: "pointer"
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        marginBottom: "var(--dt-space-6)",
        fontSize: "var(--dt-text-sm)",
        color: "var(--dt-text-tertiary)"
      }}>
        Showing {filteredPlugins.length} tools
      </div>

      {/* Plugin Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "var(--dt-space-6)"
      }}>
        {filteredPlugins.map((plugin) => (
          <PluginCard key={plugin.id} {...plugin} />
        ))}
      </div>

      {/* Empty State */}
      {filteredPlugins.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "var(--dt-space-16)",
          color: "var(--dt-text-tertiary)"
        }}>
          <p style={{ fontSize: "var(--dt-text-lg)" }}>No plugins found in this category</p>
        </div>
      )}
    </div>
  );
}
