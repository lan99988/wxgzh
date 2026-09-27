# React + Playwright 渲染器

此目录只发布参数化图片渲染所需的前端与截图代码，不含原工作台、工作台数据、本机字体、纸纹图片或样稿。

## 安装

需要 Node.js 18+ 与 Python 3。首次使用：

```bash
npm ci
npx playwright install chromium
```

## 批量导出

```bash
npm run render:batch -- --batch <批次目录> [--only 02] [--out-root <临时输出目录>] [--rebuild]
```

批量入口读取每篇目录中的 `render.json`，支持 `cover`、`cover_1x1`、`xhs_cover` 与 `cards`，沿用 `cover.png`、`cover-1x1.png`、`xhs-cover.png`、`card-NN.png` 文件名。尺寸分别为 2048×880、2048×2048 与 1242×1656。`--out-root` 可用于与 HTML 引擎并排验收；省略后写入文章目录的 `imgs/`。

仅渲染一个 `render.json`：

```bash
npm run render -- --job <render.json> --out <输出目录> [--rebuild]
```

渲染先等待 Web 字体与自动适配完成；字段最多缩小 15%，仍溢出则该图失败并报告字段。无本地字体时使用系统字体回退。
