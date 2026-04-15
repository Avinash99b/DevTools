import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ToolCategories } from "../../core/CategoryManager";
import Sketch from "@uiw/react-color-sketch";

export type ColorResult = {
    rgb: RgbColor;
    hsl: HslColor;
    hsv: HsvColor;
    rgba: RgbaColor;
    hsla: HslaColor;
    hsva: HsvaColor;
    xy: XYColor;
    hex: string;
    hexa: string;
};
export interface HsvColor {
    h: number;
    s: number;
    v: number;
}
export interface HsvaColor extends HsvColor {
    a: number;
}
export interface RgbColor {
    r: number;
    g: number;
    b: number;
}
export interface RgbaColor extends RgbColor {
    a: number;
}
export interface XYColor {
    x: number;
    y: number;
    bri?: number;
}export interface HslColor {
    h: number;
    s: number;
    l: number;
}
export interface HslaColor extends HslColor {
    a: number;
}

const defaultColor: ColorResult = {
    rgb: { r: 28, g: 73, b: 115 },
    hsl: { h: 209, s: 61.3, l: 27.9 },
    hsv: { h: 209, s: 76, v: 45 },
    rgba: { r: 28, g: 73, b: 115, a: 1 },
    hsla: { h: 209, s: 61.3, l: 27.9, a: 1 },
    hsva: { h: 209, s: 76, v: 45, a: 1 },
    hex: "#1c4973",
    hexa: "#1c4973ff",
    xy: { x: 0.0595, y: 0.0624, bri: 0.1711 }
};
type DisplayType = "hex" | "rgb" | "hsl";

function ColorTypeDisplay({
    color,
    type
}: {
    color: ColorResult;
    type: DisplayType;
}) {
    let label = "";
    let value = "";

    if (type === "hex") {
        label = "HEX";
        value = color.hex;
    }

    if (type === "rgb") {
        label = "RGB";
        value = `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
    }

    if (type === "hsl") {
        label = "HSL";
        value = `${color.hsl.h}, ${color.hsl.s}, ${color.hsl.l}`;
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--dt-space-2)"
            }}
        >
            <span style={{ fontWeight: "var(--dt-font-medium)" }}>
                {label}:
            </span>

            <span>{value}</span>

            <button
                style={{
                    marginLeft: "auto",
                    padding: "var(--dt-space-1) var(--dt-space-3)",
                    backgroundColor: "var(--dt-accent-primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--dt-radius-sm)",
                    cursor: "pointer"
                }}
                onClick={() => {
                    navigator.clipboard.writeText(value);
                }}
            >
                Copy
            </button>
        </div>
    );
}

function ColorPicker() {

    const [color, setColor] = useState<ColorResult>(defaultColor);

    return (
        <div style={{ padding: "var(--dt-space-8)" }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: "var(--dt-space-6)" }}>
                <Link
                    to="/"
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
                    Back to Home
                </Link>
            </div>

            {/* Tool Header */}
            <div style={{
                marginBottom: "var(--dt-space-8)",
                padding: "var(--dt-space-6)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)"
            }}>
                <div style={{
                    display: "inline-block",
                    padding: "var(--dt-space-1) var(--dt-space-3)",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid var(--dt-accent-primary)",
                    borderRadius: "var(--dt-radius-full)",
                    fontSize: "var(--dt-text-xs)",
                    fontWeight: "var(--dt-font-medium)",
                    color: "var(--dt-accent-primary)",
                    marginBottom: "var(--dt-space-3)"
                }}>
                    Utilities
                </div>

                <h1 style={{
                    fontSize: "var(--dt-text-3xl)",
                    fontWeight: "var(--dt-font-bold)",
                    color: "var(--dt-text-primary)",
                    margin: "0 0 var(--dt-space-2) 0"
                }}>
                    Color Picker Tool
                </h1>

                <p style={{
                    fontSize: "var(--dt-text-base)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                }}>
                    A simple color picker tool that allows you to select and copy colors in various formats (HEX, RGB, HSL). This tool is perfect for developers and designers who need to quickly grab color codes for their projects.
                </p>

            </div>



            {/* Tool Header */}
            <div style={{
                marginBottom: "var(--dt-space-8)",
                padding: "var(--dt-space-6)",
                display: "flex",
                gap: "var(--dt-space-6)",
                backgroundColor: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: "var(--dt-radius-lg)"
            }}>

                <Sketch
                    color={color.hex}
                    onChange={(updatedColor) => {
                        setColor(updatedColor);
                    }}
                />

                <div style={{
                    marginBottom: "var(--dt-space-8)",
                    padding: "var(--dt-space-6)",
                    width: "30%",
                    backgroundColor: color?.hex || "var(--dt-bg-secondary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-lg)"
                }}></div>

                <div style={{
                    marginBottom: "var(--dt-space-8)",
                    padding: "var(--dt-space-6)",
                    display: "flex",
                    width: "50%",
                    gap: "var(--dt-space-6)",
                    backgroundColor: "var(--dt-bg-secondary)",
                    border: "1px solid var(--dt-border-primary)",
                    borderRadius: "var(--dt-radius-lg)"
                }}>


                    {/* Display color codes in different formats and add copy buttons for each format */}

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        justifyContent: "space-between",
                        gap: "var(--dt-space-4)"
                    }}>

                        <ColorTypeDisplay color={color} type="hex" />
                        <ColorTypeDisplay color={color} type="hsl" />
                        <ColorTypeDisplay color={color} type="rgb" />
                    </div>
                </div>
            </div>



        </div>

    );
}

//Filename: ColorPicker.tsx
registerDevTool({
    author: "Avinash",
    categoryId: ToolCategories.DEV_UTILS,
    description: "Contains all Utilities for color picking(HEX, RGB, HSL)",
    id: "color-picker-tool",
    name: "Color Picker Tool",
    tool: ColorPicker
})

console.log("Color picker tool imported")
