import type { ToolCategory } from "../types/ToolCategory";
import {
    Image,
    Video,
    Package,
    Wrench,
    Italic,
    Code
} from "lucide-react";

class CategoryManager {
    avilableCategories = [{
        id:"image-tools",
        name: "Image Tools",
        icon: Image,
        color: "var(--dt-category-image)",
        description: "Compress, resize, convert, and optimize images"
    },
    {
        id:"video-tools",
        name: "Video Tools",
        icon: Video,
        color: "var(--dt-category-video)",
        description: "Edit, compress, and convert video files"
    },
    {
        id:"apk-aab-tools",
        name: "APK/AAB Tools",
        icon: Package,
        color: "var(--dt-category-apk)",
        description: "Analyze, sign, and modify Android packages"
    },
    {
        id:"dev-utils",
        name: "Dev Utilities",
        icon: Wrench,
        color: "var(--dt-category-utility)",
        description: "JSON formatters, encoders, decoders, and more"
    },
    {
        id:"json-utils",
        name: "JSON",
        icon: Code,
        color: "var(--dt-category-utility)",
        description: "All JSON utilities"
    }];
    getCategories(): ToolCategory[] {
        return this.avilableCategories;
    }
    getCategoryById(categoryId:string):ToolCategory|undefined{
        return this.avilableCategories.find((val)=>val.id===categoryId)
    }
    registerCategory(category: ToolCategory): void {
        this.avilableCategories.push(category);
    }
}

export default new CategoryManager();

const modules = import.meta.glob("../tools/**/*.tsx", { eager: true })