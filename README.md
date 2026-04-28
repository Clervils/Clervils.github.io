# Clervil's Pages

Personal homepage for Wenhao Chen, focused on trustworthy AI, AI alignment, research notes, essays, and selected creative work.

The site is intentionally lightweight: plain HTML, CSS, and a small Node.js content script that turns Markdown files into rendered homepage content.

## Content

Markdown entries live in two public folders:

- `content/blog/` for research notes and essays
- `content/creations/` for creative writing and other work

Each Markdown file can include frontmatter:

```md
---
title: Example Title
date: 2026-04-28
category: Research
summary: A short description shown on the homepage.
---

# Example Title

Write the post in Markdown.
```

Run the content script after adding or editing Markdown:

```bash
npm run content
```

## Development

```bash
npm run dev
```

Then open `http://localhost:5173`.

## Build

```bash
npm run build
```

The build output is written to `dist/`.
