import type { ToolCategory } from "../types/ToolCategory";
import { Image, Video, Package, Wrench, Code } from "lucide-react";

export const ToolCategories = {
    IMAGE: "image-tools",
    VIDEO: "video-tools",
    APK: "apk-aab-tools",
    DEV_UTILS: "dev-utils",
    JSON: "json-utils",
    ENDECODERS: "endecoders",
    NETWORK: "network-tools",
    AI: "ai-tools"
} as const;

class CategoryManager {
    avilableCategories:ToolCategory[] = [
        { id:ToolCategories.IMAGE, name: "Image Tools", icon: Image, color: "var(--dt-category-image)", description: "Compress, resize, convert, and optimize images" },
        { id:ToolCategories.VIDEO, name: "Video Tools", icon: Video, color: "var(--dt-category-video)", description: "Edit, compress, and convert video files" },
        { id:ToolCategories.APK, name: "APK/AAB Tools", icon: Package, color: "var(--dt-category-apk)", description: "Analyze, sign, and modify Android packages" },
        { id:ToolCategories.DEV_UTILS, name: "Dev Utilities", icon: Wrench, color: "var(--dt-category-utility)", description: "JSON formatters, encoders, decoders, and more" },
        { id:ToolCategories.JSON, name: "JSON", icon: Code, color: "var(--dt-category-utility)", description: "All JSON utilities" },
        { id:ToolCategories.ENDECODERS, name: "Encoders/Decoders", icon: Code, color: "var(--dt-category-utility)", description: "Base64, URL encoding, HTML encoding, and more" },
        { id:ToolCategories.NETWORK, name: "Network Tools", icon: Code, color: "var(--dt-category-utility)", description: "Proxy downloader and other network utilities" },
        { id:ToolCategories.AI, name: "AI Utilities", icon: Code, color: "var(--dt-category-utility)", description: "Token estimation and AI helpers" }
    ];
    getCategories(): ToolCategory[] { return this.avilableCategories; }
    getCategoryById(categoryId:string):ToolCategory|undefined{ return this.avilableCategories.find((val)=>val.id===categoryId) }
    registerCategory(category: ToolCategory): void { this.avilableCategories.push(category); }
}
export default new CategoryManager();
