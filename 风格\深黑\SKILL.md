---
name: 深黑
description: AI 科普封面·深黑配色方案。背景 #1A1A1A + 文字 #EFEAE0，大面积纯色背景，装饰符号/色块仅限 5 色板且面积 <5%。制作方法：选母版模板 → 注入本目录 palette.css → Chrome headless 截图。触发词：深黑封面、黑底封面、inkblack 封面、终端封面。
---

# AI 科普封面 · 深黑配色（Ink Black）

## 配色令牌（固定，禁止更改）

| 令牌 | 值 | 用途 |
|---|---|---|
| 背景 `--paper` | `#1A1A1A` | 整图大面积纯色背景 |
| 主文字 `--ink` | `#EFEAE0` | 标题/正文/分隔线/边框 |
| 次级文字 `--ink-2` | `#8FA9C7` | 编号/副标/脚注（雾霾蓝做层次） |
| 强调 `--accent` | `#CD6F47` | 箭头/编号/标签/Field Notes 红标（陶土橙） |
| System 底 `--bg-dark` | `#1A1A1A` | System 母版背景（同主背景） |
| System 绿 `--term-green` | `#6B8A6F` | System INPUT/OUTPUT 标签（绿感） |
| System 灰 `--term-gray` | `#8FA9C7` | System 次级信息 |

## 装饰色板（装饰/符号/色块**只能用这 5 色**）

```
#EFEAE0  #CD6F47  #6B8A6F  #8FA9C7  #1A1A1A
```

**纪律**：色块面积 < 画面 5%；禁止使用色板外任何颜色（含渐变、降低透明度混合色）。

## 适用母版（推荐）

| 母版 | 适配度 | 场景 |
|---|---|---|
| ④ System | ★★★★★ | Agent/编程/自动化（原生终端黑） |
| ⑤ Big Statement | ★★★★★ | 爆款金句（黑底白字冲击） |
| ① Research Paper | ★★★★ | 科普/原理 |
| ③ Field Notes | ★★★★ | 工具实验（暗夜笔记感） |
| ② Editorial | ★★★ | 观点/趋势 |

## 字数 ↔ 图片空间自适应（内置，2026-08-15 新增）

模板已内置 `_fit.js` 自动缩放：带 `data-fit` 属性的文本元素（标题/正文/代码区）渲染时自动检测是否超出父容器，超出则逐步缩小字号（每次 0.5px，**只缩不放**，不破坏设计字号）。

- **无需手动调字号**：内容越多自动越小，保证文字不跳出画面
- 若某张图文字仍溢出：检查该元素是否漏加 `data-fit`（见 render 模板）；若文字过小，减少该元素内容或调整换行
- 依赖文件：`ai科普\render\_fit.js`（与模板同目录，勿删）；渲染时由模板自动引入

## 制作方法

1. 从 `render/` 复制母版 HTML（如 `cover-system.html`）
2. 注入本目录 `palette.css`：`cp <skill目录>\palette.css <render目录>\_palette.css`
3. Chrome headless 截图（见 `render\shot.sh`，传配色名 `inkblack`）
4. 目检：背景是否大面积纯色、装饰是否只用色板色

## 渲染命令

```bash
bash "render/shot.sh" 深黑
# 或单张：
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --force-device-scale-factor=2 --window-size=1024,440 \
  --screenshot="out/cover-system-inkblack-2351.png" \
  "file://$PWD/render/cover-system.html"
```

## 硬约束

- 禁止随机改变颜色；背景必须大面积纯色（无渐变/纹理/杂色）
- 装饰（箭头/符号/色块）只能从装饰色板 5 色中选，面积 <5%
- 文字色固定 `#EFEAE0`（次级 `#8FA9C7`），不得引入色板外颜色
