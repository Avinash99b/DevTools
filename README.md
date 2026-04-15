# DevTools

> An open-source, ad-free, modular collection of developer utilities for Android, Web, and future self-hosted environments.

DevTools is a modular developer toolbox where every tool is a self-contained module that registers itself into a central tool manager.

The goal is to make it easy to:

* Add new tools without touching the core UI
* Organize tools into categories
* Keep the codebase scalable as the number of tools grows
* Support future backend-compatible tools without changing the core architecture

---

# Why This Exists

Most developer utility apps are either:

* Bloated
* Filled with ads
* Closed source
* Focused on only one type of utility

DevTools aims to be a single place for the small utilities developers repeatedly need:

* JSON formatting and conversion
* Image resizing and conversion
* Video tools
* APK / AAB utilities
* Text encoders and decoders
* AI token estimation
* File conversion
* Regex and developer utilities

All while remaining:

* Open source
* Ad free
* Fast
* Modular

---

# Core Idea

Every tool is simply a React component plus some metadata.

Tools register themselves into a central manager:

```ts
registerDevTool({
    id: "json-tool",
    name: "JSON Utilities",
    author: "Avinash",
    categoryId: "json-utils",
    description: "Contains all utilities for JSON",
    tool: JsonTool
})
```

The application automatically discovers and loads tools from the `/tools` directory.

```ts
const modules = import.meta.glob("../tools/**/*.tsx", { eager: true })
```

This means that adding a new tool is usually as simple as:

1. Creating a new file inside `/tools`
2. Creating the UI component
3. Calling `registerDevTool(...)`

No extra routing or manual configuration should be needed.

---

# Architecture

```text
src/
├── core/
│   ├── DevToolManager.ts
│   └── CategoryManager.ts
├── tools/
│   ├── json/
│   ├── image/
│   ├── video/
│   └── ...
├── components/
├── pages/
└── types/
```

The application is centered around two managers:

* `DevToolManager`
* `CategoryManager`

## DevToolManager

The `DevToolManager` stores and manages all available tools.

Responsibilities:

* Register tools
* Prevent duplicate tool IDs
* Retrieve tools by category
* Retrieve a tool by ID
* Notify the UI when tools change

Example:

```ts
registerDevTool(devTool)
```

Available methods:

* `registerTool(...)`
* `getToolById(...)`
* `getToolsByCategoryId(...)`
* `getToolCountByCategoryId(...)`
* `getAllTools()`

---

## CategoryManager

The `CategoryManager` controls how tools are grouped.

Current built-in categories:

* Image Tools
* Video Tools
* APK / AAB Tools
* Dev Utilities
* JSON Utilities

Categories are defined using:

```ts
{
    id: "json-utils",
    name: "JSON",
    icon: Code,
    color: "var(--dt-category-utility)",
    description: "All JSON utilities"
}
```

New categories can also be registered dynamically:

```ts
categoryManager.registerCategory(...)
```

---

# Tool Structure

A tool is defined using the `DevTool` type:

```ts
export type DevTool = {
    id: string
    name: string
    author: string
    categoryId: string
    description: string
    tool: ComponentType<any>
}
```

Each tool is responsible for:

* Rendering its own UI
* Handling its own execution logic
* Returning its own output
* Displaying logs and execution state

Example output type:

```ts
export type DevToolOutput = {
    type: "file" | "code" | "image" | "video"
    data: any
}
```

---

# Example Tool

Current example: JSON Utilities

Features planned inside the JSON tool:

* Format JSON
* Minify JSON
* JSON → TSON
* TSON → JSON
* JSON validation
* JS object → JSON conversion

The current implementation already uses:

* `ExecutionPanel`
* Live logs
* Output viewer
* Execution state tracking

---

# Planned Categories

## Developer Utilities

* JSON formatter
* Base64 encode/decode
* Hash generator
* Regex tester
* UUID generator
* AI token estimator
* Text diff

## Image Tools

* Resize image
* Compress image
* Convert PNG/JPG/WebP
* Metadata extraction

## Video Tools

* Video conversion
* Compression
* Extract audio
* Frame extraction

## APK / AAB Tools

* APK information viewer
* APK signing
* AAB → APK conversion
* Manifest viewer

---

# Future Backend Compatibility

The first versions of DevTools are focused on tools that run directly in the frontend.

In the future, some tools may optionally support backend execution.

Examples:

* Video conversion
* AI utilities
* APK / AAB processing
* Large file operations

The architecture is being designed so a tool can later choose between:

* Frontend-only execution
* Backend execution
* Both

Possible future backend stack:

* entity["software","FastAPI","python web framework"]
* Docker
* REST API
* Optional self-hosting

---

# Design Principles

DevTools follows a few strict principles:

1. Open source first
2. Ad free forever
3. Modular architecture
4. Minimal core
5. Tools should be easy to add
6. No unnecessary abstraction
7. Future backend support without breaking existing tools

---

# Contributing

Contributions are welcome.

To add a new tool:

1. Create a new `.tsx` file inside `/tools`
2. Build the tool UI
3. Register it using `registerDevTool(...)`
4. Add it to the correct category

A typical tool should:

* Have a unique ID
* Avoid duplicate registrations
* Use `ExecutionPanel`
* Return structured output
* Provide meaningful logs

---

# Roadmap

## Phase 1

* Core tool manager
* Category manager
* JSON tools
* Base64 tools
* Basic UI

## Phase 2

* More tool categories
* Better output handling
* Search and filtering
* Image tools

## Phase 3

* Video tools
* APK / AAB tools
* AI token estimation

## Phase 4

* Optional backend support
* Self-hosted mode
* Remote execution

---

# Status

The project is currently in early development.

The current focus is:

* Building a clean modular architecture
* Creating the first set of tools
* Keeping the system easy to extend

The foundation is intentionally simple so future tools can be added quickly without rewriting the core.
