import { Link } from "react-router";
import { 
  Image, 
  Video, 
  Package, 
  Wrench, 
  ArrowRight,
  TrendingUp,
  Zap,
  Users
} from "lucide-react";
import { PluginCard } from "../components/PluginCard";

export function HomePage() {
  const categories = [
    {
      name: "Image Tools",
      icon: Image,
      color: "var(--dt-category-image)",
      count: 12,
      description: "Compress, resize, convert, and optimize images"
    },
    {
      name: "Video Tools",
      icon: Video,
      color: "var(--dt-category-video)",
      count: 8,
      description: "Edit, compress, and convert video files"
    },
    {
      name: "APK/AAB Tools",
      icon: Package,
      color: "var(--dt-category-apk)",
      count: 15,
      description: "Analyze, sign, and modify Android packages"
    },
    {
      name: "Dev Utilities",
      icon: Wrench,
      color: "var(--dt-category-utility)",
      count: 24,
      description: "JSON formatters, encoders, generators, and more"
    }
  ];

  const installedTools = [
    {
      id: "image-compress",
      name: "Image Compressor",
      description: "Compress images with advanced algorithms while maintaining quality",
      category: "image" as const,
      version: "2.1.4",
      author: "DevTools Team",
      downloads: 45230,
      rating: 4.8,
      installed: true,
      enabled: true
    },
    {
      id: "json-formatter",
      name: "JSON Formatter",
      description: "Format, validate, and minify JSON with syntax highlighting",
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
      description: "Analyze APK structure, permissions, and resources",
      category: "apk" as const,
      version: "3.0.2",
      author: "Android Team",
      downloads: 34120,
      rating: 4.7,
      installed: true,
      enabled: false
    }
  ];

  const stats = [
    { label: "Total Tools", value: "59", icon: Package },
    { label: "Active Users", value: "12.4K", icon: Users },
    { label: "Executions Today", value: "2,847", icon: Zap }
  ];

  return (
    <div style={{ padding: "var(--dt-space-8)" }}>
      {/* Hero Section */}
      <div style={{
        marginBottom: "var(--dt-space-8)",
        padding: "var(--dt-space-8)",
        background: "linear-gradient(135deg, var(--dt-bg-secondary) 0%, var(--dt-bg-tertiary) 100%)",
        borderRadius: "var(--dt-radius-xl)",
        border: "1px solid var(--dt-border-primary)"
      }}>
        <h1 style={{
          fontSize: "var(--dt-text-4xl)",
          fontWeight: "var(--dt-font-bold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-4) 0"
        }}>
          Welcome to DevTools Platform
        </h1>
        <p style={{
          fontSize: "var(--dt-text-lg)",
          color: "var(--dt-text-secondary)",
          margin: "0 0 var(--dt-space-6) 0",
          maxWidth: "800px"
        }}>
          A modular, open-source developer toolbox powered by plugins. 
          Execute tools locally or remotely with full control.
        </p>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--dt-space-4)",
          marginBottom: "var(--dt-space-6)"
        }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  padding: "var(--dt-space-4)",
                  backgroundColor: "var(--dt-bg-primary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-lg)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--dt-space-2)", marginBottom: "var(--dt-space-2)" }}>
                  <Icon size={20} color="var(--dt-accent-primary)" />
                  <span style={{ fontSize: "var(--dt-text-xs)", color: "var(--dt-text-tertiary)" }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{
                  fontSize: "var(--dt-text-2xl)",
                  fontWeight: "var(--dt-font-bold)",
                  color: "var(--dt-text-primary)"
                }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          to="/marketplace"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--dt-space-2)",
            padding: "var(--dt-space-3) var(--dt-space-6)",
            backgroundColor: "var(--dt-accent-primary)",
            color: "white",
            borderRadius: "var(--dt-radius-md)",
            textDecoration: "none",
            fontSize: "var(--dt-text-base)",
            fontWeight: "var(--dt-font-semibold)",
            transition: "all var(--dt-transition-fast)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--dt-accent-primary-hover)";
            e.currentTarget.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--dt-accent-primary)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          Browse Marketplace
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: "var(--dt-space-8)" }}>
        <h2 style={{
          fontSize: "var(--dt-text-2xl)",
          fontWeight: "var(--dt-font-semibold)",
          color: "var(--dt-text-primary)",
          margin: "0 0 var(--dt-space-6) 0"
        }}>
          Tool Categories
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--dt-space-4)"
        }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                to="/marketplace"
                style={{
                  padding: "var(--dt-space-6)",
                  backgroundColor: "var(--dt-bg-secondary)",
                  border: "1px solid var(--dt-border-primary)",
                  borderRadius: "var(--dt-radius-lg)",
                  textDecoration: "none",
                  transition: "all var(--dt-transition-base)",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-hover)";
                  e.currentTarget.style.borderColor = category.color;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--dt-shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--dt-bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--dt-border-primary)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: `${category.color}20`,
                  border: `2px solid ${category.color}`,
                  borderRadius: "var(--dt-radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--dt-space-4)"
                }}>
                  <Icon size={24} color={category.color} />
                </div>
                <h3 style={{
                  fontSize: "var(--dt-text-lg)",
                  fontWeight: "var(--dt-font-semibold)",
                  color: "var(--dt-text-primary)",
                  margin: "0 0 var(--dt-space-2) 0"
                }}>
                  {category.name}
                </h3>
                <p style={{
                  fontSize: "var(--dt-text-sm)",
                  color: "var(--dt-text-secondary)",
                  margin: "0 0 var(--dt-space-3) 0",
                  lineHeight: "var(--dt-leading-relaxed)"
                }}>
                  {category.description}
                </p>
                <div style={{
                  fontSize: "var(--dt-text-xs)",
                  color: "var(--dt-text-tertiary)"
                }}>
                  {category.count} tools available
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Installed Tools */}
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--dt-space-6)"
        }}>
          <h2 style={{
            fontSize: "var(--dt-text-2xl)",
            fontWeight: "var(--dt-font-semibold)",
            color: "var(--dt-text-primary)",
            margin: 0
          }}>
            Your Installed Tools
          </h2>
          <Link
            to="/marketplace"
            style={{
              color: "var(--dt-accent-primary)",
              textDecoration: "none",
              fontSize: "var(--dt-text-sm)",
              fontWeight: "var(--dt-font-medium)",
              display: "flex",
              alignItems: "center",
              gap: "var(--dt-space-1)"
            }}
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "var(--dt-space-6)"
        }}>
          {installedTools.map((tool) => (
            <PluginCard key={tool.id} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
