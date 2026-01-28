---
trigger: always_on
---

# Project Standards Checklist

## Performance
* [ ] **No large JS on homepage:** Keep the initial payload minimal to ensure fast Time to Interactive (TTI).
* [ ] **Lazy-load every tool:** Only fetch the code for specific utilities when they are requested by the user.
* [ ] **`type="module"` + `defer`:** Ensure scripts are executed after the document has been parsed without blocking the initial render.
* [ ] **Web Workers for heavy work:** Move computationally expensive tasks off the main thread to prevent UI freezing.
* [ ] **Use `requestIdleCallback`:** Schedule non-essential background tasks during browser idle periods.

---

## Accessibility
* **Semantic HTML:** Use structural tags like `<main>`, `<nav>`, and `<section>` to provide a clear document outline.
* **Form Labels:** Always associate a `<label>` with every input to ensure screen readers can identify the purpose of the field.
* **Focus States:** Maintain visible and logical focus indicators for keyboard navigation.
* **ARIA:** Use ARIA attributes only when standard HTML elements cannot provide the necessary context.

---

## SEO
* **Static HTML:** Ensure each tool has a dedicated static page for better indexing.
* **Metadata:** Every page must include a unique `<title>` and `<meta description>`.
* **Sitemap.xml:** Maintain an updated map of all tool URLs for search engine crawlers.
* **JSON-LD:** Implement Structured Data using the `Tool` schema to enhance search result snippets.

---

## Best Practices
* [x] **HTTPS Only:**.
* [x] **No Console Errors:** Keep the production console clean of logs, warnings, and errors.
* [x] **No Deprecated APIs:** Regularly audit dependencies and browser APIs to ensure long-term compatibility.