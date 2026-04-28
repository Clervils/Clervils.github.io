import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const collections = [
  ["blogPosts", "content/blog", "blog"],
  ["creations", "content/creations", ""],
];

const generated = [];

for (const [exportName, directory, outputDirectory] of collections) {
  const items = await readCollection(path.join(root, directory), outputDirectory);
  generated.push(`export const ${exportName} = ${JSON.stringify(items, null, 2)};`);

  if (outputDirectory) {
    await writePostPages(items, outputDirectory);
  }
}

await writeFile(
  path.join(root, "src/content.generated.js"),
  `${generated.join("\n\n")}\n`,
);

async function readCollection(directory, outputDirectory) {
  let files = [];

  try {
    files = await readdir(directory);
  } catch {
    return [];
  }

  const entries = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const raw = await readFile(path.join(directory, file), "utf8");
        const { frontmatter, body } = parseFrontmatter(raw);
        const slug = frontmatter.slug || file.replace(/\.md$/, "");
        const title = frontmatter.title || titleFromBody(body) || titleFromFile(file);
        const summary = frontmatter.summary || firstParagraph(body) || "Published note.";
        const rendered = renderMarkdown(stripLeadingTitle(body, title));

        return {
          slug,
          title,
          date: frontmatter.date || "",
          category: frontmatter.category || "Note",
          summary,
          url: outputDirectory ? `./${outputDirectory}/${slug}/` : "",
          html: rendered.html,
          toc: rendered.toc,
        };
      }),
  );

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const end = raw.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const frontmatter = {};
  const header = raw.slice(4, end).trim();

  for (const line of header.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    frontmatter[key] = value;
  }

  return { frontmatter, body: raw.slice(end + 4).trim() };
}

async function writePostPages(items, outputDirectory) {
  for (const item of items) {
    const directory = path.join(root, outputDirectory, item.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), renderPostPage(item));
  }
}

function renderPostPage(post) {
  const toc = post.toc.length
    ? post.toc
        .map((item) => `<a class="toc-link depth-${item.level}" href="#${item.id}">${item.text}</a>`)
        .join("")
    : '<span class="toc-empty">No sections</span>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttribute(post.summary)}" />
    <title>${escapeHtml(post.title)} | Wenhao Chen</title>
    <link rel="stylesheet" href="../../src/styles.css" />
    <script>
      window.MathJax = {
        tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]], displayMath: [["$$", "$$"], ["\\\\[", "\\\\]"]] },
        svg: { fontCache: "global" }
      };
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  </head>
  <body class="article-page">
    <header class="article-topbar">
      <a href="../../">Wenhao Chen</a>
      <a href="../../#blog">All writing</a>
    </header>
    <main class="article-shell">
      <aside class="article-toc" aria-label="Table of contents">
        <p>Contents</p>
        <nav>${toc}</nav>
      </aside>
      <article class="article-content">
        <p class="article-kicker">${escapeHtml(post.category)} / ${escapeHtml(post.date)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="article-summary">${escapeHtml(post.summary)}</p>
        <div class="markdown-body article-markdown">${post.html}</div>
      </article>
    </main>
  </body>
</html>
`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const toc = [];
  let paragraph = [];
  let list = [];
  let orderedList = [];
  let code = [];
  let math = [];
  let inCode = false;
  let inMath = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  const flushOrderedList = () => {
    if (!orderedList.length) return;
    html.push(`<ol>${orderedList.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`);
    orderedList = [];
  };

  for (const line of lines) {
    if (line.trim() === "$$") {
      if (inMath) {
        html.push(`<div class="math-block">$$\n${escapeHtml(math.join("\n"))}\n$$</div>`);
        math = [];
        inMath = false;
      } else {
        flushParagraph();
        flushList();
        flushOrderedList();
        inMath = true;
      }
      continue;
    }

    if (inMath) {
      math.push(line);
      continue;
    }

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        flushOrderedList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushOrderedList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushOrderedList();
      const level = heading[1].length;
      const htmlLevel = level === 1 ? 2 : level;
      const text = stripInlineMarkdown(heading[2]);
      const id = uniqueHeadingId(text, toc);
      toc.push({ id, level, text });
      html.push(`<h${htmlLevel} id="${id}">${inline(heading[2])}</h${htmlLevel}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushOrderedList();
      list.push(bullet[1]);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushList();
      orderedList.push(ordered[1]);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushOrderedList();
      html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushOrderedList();

  if (inMath) {
    html.push(`<div class="math-block">$$\n${escapeHtml(math.join("\n"))}\n$$</div>`);
  }

  return { html: html.join(""), toc };
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

function titleFromBody(body) {
  const match = /^#\s+(.+)$/m.exec(body);
  return match?.[1]?.trim();
}

function titleFromFile(file) {
  return file
    .replace(/\.md$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstParagraph(body) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#"))
    ?.replace(/\s+/g, " ");
}

function stripLeadingTitle(body, title) {
  const lines = body.trim().split("\n");
  const firstLine = lines[0]?.trim();

  if (firstLine === `# ${title}`) {
    return lines.slice(1).join("\n").trim();
  }

  return body.trim();
}

function stripInlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function uniqueHeadingId(text, toc) {
  const base = slugify(text) || "section";
  let id = base;
  let index = 2;

  while (toc.some((item) => item.id === id)) {
    id = `${base}-${index}`;
    index += 1;
  }

  return id;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
