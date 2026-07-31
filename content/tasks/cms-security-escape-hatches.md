---
title: Harden the Page Builder's raw-JS escape hatches (stored-XSS risk)
project: cms-page-builder
status: To Do
priority: High
assignee: Sam Okafor
dueDate: 2026-08-22
tags:
  - cms
  - security
  - engineering
---

The Page Builder's "advanced escape hatches" are deliberately unsanitised. `content/docs/PageBuilder.md` says "treat CMS write access the same as code-commit access," but in practice these let any CMS writer run arbitrary JS in every visitor's browser:

- **Button → "Custom onClick"** — the `onclick` field in `public/admin/config.yml`; the `button` renderer in `app/components/page-registry.tsx` spreads it straight onto `<Button>`, so it lands as a raw DOM `onclick` attribute.
- **Field / Textarea → "Validator"** — a raw JS function expression reconstructed client-side via `new Function` (`app/components/ui/field-primitive.tsx:70`); arbitrary code execution.
- **`script` block** — raw `<script dangerouslySetInnerHTML>` in `page-registry.tsx`.
- **`icon` block** — raw SVG via `dangerouslySetInnerHTML`.

There is **no Content-Security-Policy** anywhere in the app (grep for `Content-Security-Policy`/`sanitiz`/`DOMPurify` returns only the `new Function` line). If the CMS is ever opened to a less-trusted editor, or its JSON store writable by anything other than a trusted dev, this is a stored-XSS / arbitrary-code-execution vector.

Harden it: (a) add a CSP (at minimum `script-src 'self'`, ideally with nonces) at the Hono/edge layer so inline `onclick`/`new Function`/`<script>` strings are blocked by the browser; (b) gate the four advanced raw-JS fields behind a role/flag in `public/admin/config.yml` so only trusted "developer" editors even see them; (c) consider replacing the `Validator` `new Function` path with a precompiled/validated expression subset. This is the highest-severity finding on a surface that is supposed to be editor-safe, and should land first.
