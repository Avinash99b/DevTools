import { useState } from "react";
import { registerDevTool } from "../../core/DevToolManager";
import { ExecutionPanel } from "../../components/ExecutionPanel";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { LogEntry } from "../../components/TerminalOutput";
import type { DevToolOutput } from "../../types/DevToolOutput";
import CategoryManager, { ToolCategories } from "../../core/CategoryManager";
import imageCompression from "browser-image-compression"
import axios from "axios";



function ImageCompressor() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [output, setOutput] = useState<DevToolOutput | undefined>();


    async function compress(imageFiles: File[], quality: number, maxFileSizeKB?: number) {
        // Process image files
        if (imageFiles.length > 0) {
            setLogs((val) => [...val, { level: "info", message: `Compressing ${imageFiles.length} image(s)...`, timestamp: new Date().toLocaleTimeString() }])
            const options = {
                maxSizeMB: maxFileSizeKB ? maxFileSizeKB / 1024 : undefined,
                initialQuality: quality ? quality / 100 : undefined,
                useWebWorker: true
            };
            Promise.all(imageFiles.map(file => imageCompression(file, options)))
                .then(compressedFiles => {
                    setOutput({ type: "images", data: compressedFiles });
                    setLogs((val) => [...val, { level: "success", message: `Image compression completed successfully!`, timestamp: new Date().toLocaleTimeString() }])
                })
                .catch(error => {
                    setLogs((val) => [...val, { level: "error", message: `Image compression failed: ${error.message}`, timestamp: new Date().toLocaleTimeString() }])
                })
                .finally(() => {
                    setIsExecuting(false);
                });
        } else {
            setLogs((val) => [...val, { level: "warning", message: "No valid image files to compress.", timestamp: new Date().toLocaleTimeString() }])
            setIsExecuting(false);
        }
    }
    async function execute(data: Record<string, any>) {
        setIsExecuting(true)
        const { imageUrls, file, quality, maxFileSize } = data;
        const imageFiles: File[] = file ? (Array.isArray(file) ? file : [file]) : [];
        try {
            // Simulate execution with logs
            setLogs((val) => [...val, { level: "info", message: "Starting image compression...", timestamp: new Date().toLocaleTimeString() }])

            // Process text input (image URLs)
            if (imageUrls) {
                const entries = imageUrls.split("\n").map((line: string) => line.trim()).filter((line: string) => line.length > 0);
                await Promise.all(entries.map(async (entry: string, index: number) => {
                    setLogs((val) => [...val, { level: "info", message: `Processing entry ${index + 1}: ${entry}`, timestamp: new Date().toLocaleTimeString() }])
                    //Use Axios or Fetch to get the image file from the URL and then cadd it to imageFiles array
                    const response = await axios.get(entry, { responseType: 'blob' });
                    const urlParts = entry.split("/");
                    const fileName = urlParts[urlParts.length - 1] || `image_${index + 1}`;
                    const file = new File([response.data], fileName, { type: response.data.type });
                    imageFiles.push(file);
                    setLogs((val) => [...val, { level: "success", message: `Successfully fetched image from URL: ${entry}`, timestamp: new Date().toLocaleTimeString() }])
                }));
                await compress(imageFiles, quality, maxFileSize);
            } else {
                setLogs((val) => [...val, { level: "warning", message: "No image URLs provided, skipping URL processing.", timestamp: new Date().toLocaleTimeString() }])
                await compress(imageFiles, quality, maxFileSize);
            }



        } catch (e) {
            setLogs((val) => [...val, { level: "error", message: "Execution Failed", timestamp: new Date().toLocaleTimeString() }])
        }
        setIsExecuting(false)
    }

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
                    {CategoryManager.getCategoryById(ToolCategories.IMAGE)?.name}
                </div>

                <h1 style={{
                    fontSize: "var(--dt-text-3xl)",
                    fontWeight: "var(--dt-font-bold)",
                    color: "var(--dt-text-primary)",
                    margin: "0 0 var(--dt-space-2) 0"
                }}>
                    Image Compressor
                </h1>

                <p style={{
                    fontSize: "var(--dt-text-base)",
                    color: "var(--dt-text-secondary)",
                    margin: 0
                }}>
                    Compress and optimize images with ease. Perfect for developers, designers, and anyone working with image assets.
                </p>

            </div>

            {/* Execution Panel */}
            <ExecutionPanel
                isRemoteAvailable={true}
                isExecuting={isExecuting}
                toolName={'image-compressor-tool'}
                fields={[
                    {
                        name: "imageUrls",
                        type: "textarea",
                        required: false,
                        label: "Image URL's",
                        placeholder: "Enter an image URL's seperated by new lines",
                    }, {
                        name: "file",
                        type: "file",
                        required: false,
                        label: "Upload Image",
                        fileOptions: {
                            accept: "image/*",
                            multiple: true
                        },
                        placeholder: "Or upload an image file to compress"
                    }, {
                        name: "quality",
                        type: "seekbar",
                        required: false,
                        label: "Quality (1-100)",
                        placeholder: "Set the compression quality (1-100)",
                        seekbarOptions: {
                            min: 1,
                            max: 100,
                            step: 1
                        }
                    }, {
                        name: "maxFileSize",
                        type: "number",
                        required: false,
                        label: "Max File Size (KB)",
                        placeholder: "Set the maximum file size after compression in KB"
                    }

                ]}
                executeButtonVisible={true}
                logs={logs}
                onExecute={execute}
                output={output}
                clearLogs={()=>setLogs([])}
            />
        </div>
    );
}

//Filename: ImageCompressor.tsx
registerDevTool({
    author: "Avinash",
    categoryId: ToolCategories.IMAGE,
    description: "Contains utilities for compressing and optimizing images, supporting formats like JPEG, PNG, and GIF. Ideal for web developers and designers looking to reduce image file sizes without sacrificing quality.",
    id: "image-compressor-tool",
    name: "Image Compressor",
    tool: ImageCompressor
})

console.log("Image Compressor tool imported")
