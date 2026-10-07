import DOMPurify from "dompurify";

/**
 * Sanitizes HTML before it is rendered via dangerouslySetInnerHTML. Used for
 * tool outputs such as Markdown previews where inline markup is intentional but
 * scripts, event handlers and dangerous URLs are not.
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html ?? "", {
        USE_PROFILES: { html: true, svg: true },
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "link", "meta", "base"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onstart", "srcdoc"],
        ALLOW_DATA_ATTR: false,
    });
}