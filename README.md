# Clervil's Pages

Wenhao Chen's personal homepage for blog posts, research outreach, and public academic updates.

## Development

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Build

```bash
mkdir -p dist && cp index.html dist/ && cp -R src dist/
```

## Content

The first version keeps page content in `index.html` and styling in `src/styles.css`. Later versions can split blog posts, papers, and projects into Markdown/MDX or structured data files.
