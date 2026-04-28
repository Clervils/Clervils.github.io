# Clervil's Pages

Wenhao Chen 的个人主页，面向博客、科研宣传和个人展示。

## 开发

```bash
python3 -m http.server 5173
```

然后访问 `http://localhost:5173`。

## 构建

```bash
mkdir -p dist && cp index.html dist/ && cp -R src dist/
```

## 内容入口

首版内容集中在 `index.html` 中，样式在 `src/styles.css` 中。后续可以拆分为 Markdown/MDX 博客、论文数据文件和项目配置。
