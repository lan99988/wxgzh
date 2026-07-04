# 📋 公众号文章工作流 — WeChat Article Workflow

> 一键式微信公众号文章配图、排版、发布流水线。从 Markdown 稿件到微信草稿箱，全自动化。

本仓库将公众号内容创作中最繁琐的「配图设计 → 排版美化 → 草稿箱发布」环节封装为可复用的 **AI Agent Skills（技能包）**，配合 **WorkBuddy / Claude Code / Cursor** 等支持 Skill 机制的 AI 编程助手使用。

---

## 🚀 快速开始

### 前提条件

- **AI Agent 工具**：WorkBuddy（推荐）、Claude Code、Cursor 或任何支持 Skill/MCP 机制的 AI 助手
- **Bun**（用于 baoyu-image-gen 图片生成）：`npm install -g bun` 或 `curl -fsSL https://bun.sh/install | bash`
- **Python 3.10+**（用于 AWS 脚本）
- **一个微信公众号**（服务号或订阅号均可）
- **一个 AI 图片生成 API**（推荐 DashScope 通义万象、OpenAI GPT Image、Google Gemini）

### 安装步骤

#### 第 1 步：下载本仓库

```bash
git clone https://github.com/lan99988/wx-.git
cd wx-
```

#### 第 2 步：安装 Skills 到你的 Agent

将 `skills/` 目录下的所有 Skill 复制到你的 Agent Skill 目录：

**WorkBuddy 用户：**
```bash
# 复制 baoyu skills（来自 JimLiu/baoyu-skills）
cp -r skills/baoyu/* ~/.workbuddy/skills/宝玉/

# 复制 AWS skills（来自 aiworkskills/wechat-article-skills）
cp -r skills/aws/* ~/.workbuddy/skills/
```

> 也可以直接从源仓库安装最新版：
> - baoyu skills: `git clone https://github.com/JimLiu/baoyu-skills`
> - AWS skills: `git clone https://github.com/aiworkskills/wechat-article-skills`

#### 第 3 步：配置 API 密钥

```bash
# 微信 & 模型密钥
cp config/aws.env.template aws.env
# 编辑 aws.env，填入你的 APPID / APPSECRET / API_KEY

# baoyu 密钥
mkdir -p .baoyu-skills
cp config/baoyu.env.template .baoyu-skills/.env
# 编辑 .baoyu-skills/.env，填入你的 API KEY

# 发布扩展配置
mkdir -p .baoyu-skills/baoyu-post-to-wechat
cp config/baoyu-post-to-wechat/EXTEND.md .baoyu-skills/baoyu-post-to-wechat/

# 工作流配置
cp config/config.yaml.template .aws-article/config.yaml
```

#### 第 4 步：安装 Python 依赖

```bash
pip install html2image  # 用于 convert_html_to_png.py
```

#### 第 5 步：放入你的文章稿件

```
项目根/
├── 待办/          # 待处理的原始稿件
├── 在办/          # 正在配图排版的文章
├── 办结/          # 已发布的文章归档
└── drafts/        # AI 生成的草稿输出目录
```

---

## 📖 完整工作流

```
┌─────────────────────────────────────────────────────────────┐
│                  公众号一条龙工作流                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [1] 选题 & 写稿                                              │
│       └─ aws-wechat-article-topics + writing                 │
│       └─ 产出 topic-card.md + draft.md                       │
│                                                             │
│  [2] 审稿（内容审）                                           │
│       └─ aws-wechat-article-review                           │
│       └─ 产出 article.md（定稿）                              │
│                                                             │
│  [3] 配图分析 & AI 生图                                       │
│       └─ baoyu-article-illustrator（分析文章，确定配图位置）    │
│       └─ baoyu-cover-image（生成封面图）                      │
│       └─ baoyu-image-gen（批量生成正文配图）                   │
│       └─ convert_html_to_png.py（信息图转 PNG）              │
│       └─ baoyu-compress-image（压缩图片适配微信）              │
│       └─ insert_images.py（将图片引用插入文稿）               │
│       └─ 产出 imgs/ 目录 + _配图版.md                        │
│                                                             │
│  [4] Markdown → HTML 排版                                    │
│       └─ baoyu-markdown-to-html                              │
│       └─ 或 aws-wechat-article-formatting                    │
│       └─ 产出 article.html（微信可粘贴的内联样式 HTML）        │
│                                                             │
│  [5] 终审                                                    │
│       └─ aws-wechat-article-review                           │
│       └─ 检查排版完整性、图片就位、发布要素                     │
│                                                             │
│  [6] 发布到微信草稿箱                                         │
│       └─ baoyu-post-to-wechat                                │
│       └─ 或 aws-wechat-article-publish                       │
│       └─ 产物进入微信后台草稿箱，可手动预览后发布               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 文件状态流转

```
  待办/（原始 .md 稿件）
    │
    ▼
  在办/（配图+排版进行中）
    │  imgs/ + prompts/ + article.html
    │
    ▼
  drafts/（草稿箱准备就绪）
    │  article.html + article.yaml + cover.png + imgs/
    │
    ▼
  发布到微信草稿箱
    │
    ▼
  办结/（归档完成）
```

### 单篇文章目录结构

```
在办/01-文章标题/
├── 01-文章标题_v5.3版.md              ← 原始文稿
├── 01-文章标题_v5.3_配图版.md         ← 插入配图后的文稿
├── 01-文章标题_v5.3_配图版.html        ← 排版后的 HTML
└── imgs/
    ├── cover.png                         ← 封面图
    ├── 01-xxx.png                        ← 正文第 1 张配图
    ├── 02-xxx.png
    ├── ...
    └── prompts/                          ← 每张图的 AI 生图 prompt
          ├── 00-cover-xxx.md
          ├── 01-xxx.md
          └── ...
```

---

## 🧩 Skill 清单与声明

### 来自 [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)（MIT License）

| Skill | 用途 | 目录 |
|-------|------|------|
| **baoyu-article-illustrator** | 文章配图分析：Type × Style × Palette 三维配图方案 | `skills/baoyu/baoyu-article-illustrator/` |
| **baoyu-image-gen** | AI 图片生成：支持 13+ 后端（OpenAI/Google/DashScope 等） | `skills/baoyu/baoyu-image-gen/` |
| **baoyu-cover-image** | 封面图生成：5 维度 × 11 调色板 × 7 渲染风格 | `skills/baoyu/baoyu-cover-image/` |
| **baoyu-markdown-to-html** | Markdown → 微信兼容 HTML 排版 | `skills/baoyu/baoyu-markdown-to-html/` |
| **baoyu-post-to-wechat** | 发布到微信公众号（API / 浏览器 / 远程 API） | `skills/baoyu/baoyu-post-to-wechat/` |
| **baoyu-compress-image** | 图片压缩（WebP/PNG/JPEG） | `skills/baoyu/baoyu-compress-image/` |

**作者：** [JimLiu](https://github.com/JimLiu) — 宝玉系列 AI Agent Skills
**仓库：** [baoyu-skills](https://github.com/JimLiu/baoyu-skills)

### 来自 [aiworkskills/wechat-article-skills](https://github.com/aiworkskills/wechat-article-skills)

| Skill | 用途 | 目录 |
|-------|------|------|
| **aws-wechat-article-main** | 公众号一条龙总控入口 | `skills/aws/aws-wechat-article-main/` |
| **aws-wechat-article-topics** | 选题策划 & 标题生成 | `skills/aws/aws-wechat-article-topics/` |
| **aws-wechat-article-writing** | 长文 AI 写作 | `skills/aws/aws-wechat-article-writing/` |
| **aws-wechat-article-review** | 审稿 & 敏感词检测 & 合规检查 | `skills/aws/aws-wechat-article-review/` |
| **aws-wechat-article-formatting** | Markdown → 微信 HTML 排版（Python） | `skills/aws/aws-wechat-article-formatting/` |
| **aws-wechat-article-images** | 封面 & 正文配图工作流编排 | `skills/aws/aws-wechat-article-images/` |
| **aws-wechat-article-publish** | 微信 API 直连发布 | `skills/aws/aws-wechat-article-publish/` |

**作者：** [aiworkskills](https://github.com/aiworkskills) 团队
**仓库：** [wechat-article-skills](https://github.com/aiworkskills/wechat-article-skills)

### 自定义工具脚本

| 脚本 | 用途 |
|------|------|
| `scripts/insert_images.py` | 将 markdown 标记位置替换为图片引用 |
| `scripts/convert_html_to_png.py` | HTML 信息图截图 → PNG |
| `scripts/fix_heights.py` | 修复 PNG 截断问题 |

---

## 💡 使用方式

### 方式一：完整一条龙（推荐）

在你的 AI Agent 中加载 **aws-wechat-article-main** Skill，然后说：

> "帮我写一篇关于 XXX 的文章，配图排版后发到微信草稿箱"

Agent 会自动执行：选题 → 写稿 → 审稿 → 排版 → 配图 → 发布到草稿箱。

### 方式二：单步操作

| 你要做的事 | 加载的 Skill |
|-----------|-------------|
| 已有文章，需要配图 | baoyu-article-illustrator + baoyu-image-gen |
| 已有 .md，需要转 HTML | baoyu-markdown-to-html |
| 已有 article.html，需要发到草稿箱 | baoyu-post-to-wechat |
| 图片太大需要压缩 | baoyu-compress-image |

---

## 🔐 安全说明

- 本仓库**不包含**任何真实的 API 密钥或 Token
- 所有敏感配置通过环境变量文件管理
- 请勿将含有真实密钥的文件提交到 Git 仓库

---

## 📝 许可

- 本仓库自定义代码采用 **MIT License**
- **baoyu-*** series skills © [JimLiu](https://github.com/JimLiu)
- **aws-wechat-article-*** series skills © [aiworkskills](https://github.com/aiworkskills)

---

## 🙏 致谢

- [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills) — 宝玉系列 AI Agent Skills
- [aiworkskills/wechat-article-skills](https://github.com/aiworkskills/wechat-article-skills) — 公众号文章一条龙套件
