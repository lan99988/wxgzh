# 公众号文章工作流技术文档

> 从原始 Markdown 稿件到微信草稿箱的完整技术方案。

---

## 1. 工作流概述

本文档详细描述公众号文章从「配图生成 → 排版美化 → 草稿箱发布」的完整技术流程。

### 核心流程

```
原始 .md 稿件
    │
    ▼
┌─────────────────────┐
│  ① 配图分析          │  baoyu-article-illustrator
│  ② 封面生成          │  baoyu-cover-image
│  ③ 正文配图生成       │  baoyu-image-gen
│  ④ 图片插入          │  insert_images.py
│  ⑤ 图片压缩          │  baoyu-compress-image
└─────────┬───────────┘
          ▼
   _配图版.md + imgs/
          │
          ▼
┌─────────────────────┐
│  ⑥ Markdown → HTML   │  baoyu-markdown-to-html
│                      │  或 aws-wechat-article-formatting
└─────────┬───────────┘
          ▼
   _配图版.html
          │
          ▼
┌─────────────────────┐
│  ⑦ 终审              │  aws-wechat-article-review
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  ⑧ 发布到草稿箱       │  baoyu-post-to-wechat
│                      │  或 aws-wechat-article-publish
└─────────┬───────────┘
          ▼
   微信后台草稿箱 ✓
```

---

## 2. 步骤详解

### 2.1 配图分析（baoyu-article-illustrator）

**输入：** 原始 Markdown 稿件

**过程：**
1. 读取整篇文章，分析段落结构和内容主题
2. 识别需要配图的位置（概念解释、对比、流程图、数据展示等）
3. 为每个配图位置确定 Type × Style × Palette 组合
4. 输出配图方案清单

**输出：** 配图方案 + 每个配图位置的 prompt 文件

### 2.2 封面生成（baoyu-cover-image）

**输入：** 文章标题、摘要

**过程：**
1. 确定封面 5 维参数（Type/Palette/Rendering/Text/Mood）
2. 调用 AI 生图 API 生成封面图

**宽高比：** 2.35:1（微信公众号封面标准比例）

**输出：** `cover.png`

### 2.3 正文配图生成（baoyu-image-gen）

**输入：** 配图方案 + prompt 文件列表

**过程：**
1. 从配图方案中提取所有配图的 prompt
2. 使用 baoyu-image-gen 批量生成图片（支持 12+ 后端）
3. 支持的 AI 后端：DashScope / OpenAI / Google Gemini / Azure / MiniMax 等

**批量模式：**
```bash
bun scripts/main.ts --batchfile batch.json --jobs 4
```

**输出：** `imgs/` 目录下的多张配图

### 2.4 图片插入（insert_images.py）

**输入：** 原始 .md 稿件 + 已生成的配图

**过程：**
1. 在原始 .md 中按标记文字定位配图插入位置
2. 在目标行后插入图片引用 Markdown 语法
3. 从底部到顶部插入（避免行号偏移）

**输出：** `_配图版.md`

### 2.5 图片压缩（baoyu-compress-image）

**输入：** `imgs/` 目录下的 PNG 图片
**过程：** 自动选择最佳工具压缩为 WebP 格式
**输出：** 压缩后的图片文件

### 2.6 Markdown → HTML 排版

**工具一：baoyu-markdown-to-html**
- 4 个内置主题：default(经典蓝)/grace(优雅紫)/simple(极简黑)/modern(暖橙)
- 支持代码高亮、数学公式、Mermaid 图、外链转底部引用

**工具二：aws-wechat-article-formatting**
- Python 纯本地运行，零网络零凭证
- 排版特征：暖白 `#f5f4ed` 背景、580px 居中、宋体标题 + 苹方正文

### 2.7 终审（aws-wechat-article-review）
检查排版完整性、敏感词、错别字、链接有效性

### 2.8 发布到草稿箱

**工具一：baoyu-post-to-wechat**
- 三种方式：api（最快）/ browser（Chrome CDP）/ remote-api（SSH 隧道）

**工具二：aws-wechat-article-publish**
- 三种模式：draft（草稿箱）/ published（直接发布）/ none（跳过微信）

---

## 3. 草稿箱目录结构

```
drafts/YYYYMMDD-文章slug/
├── article.yaml          # 文章元数据（标题/作者/摘要等）
├── article.md            # 含配图引用的 Markdown 版本
├── article.html          # 排版后的 HTML（最终发布内容）
├── cover.png             # 封面图
└── imgs/
    ├── 01-xxx.png
    ├── 02-xxx.png
    └── prompts/
```

**article.yaml 格式：**
```yaml
title: "文章标题"
author: "作者名"
digest: "摘要（128字以内）"
cover_image: "cover.png"
publish_completed: false
publish_method: draft
```

---

## 4. 环境变量配置

### aws.env
```env
WECHAT_1_APPID=wx0000000000000000
WECHAT_1_APPSECRET=your_app_secret_here
WRITING_MODEL_API_KEY=sk-your_key_here
IMAGE_MODEL_API_KEY=sk-your_key_here
```

### .baoyu-skills/.env
```env
DASHSCOPE_API_KEY=sk-your_dashscope_key
GOOGLE_API_KEY=AIza-your_google_key
OPENAI_API_KEY=sk-your_openai_key
WECHAT_APP_ID=wx0000000000000000
WECHAT_APP_SECRET=your_app_secret_here
```

### EXTEND.md
```yaml
default_author: 你的公众号作者名
need_open_comment: 1
only_fans_can_comment: 0
chrome_path: /path/to/your/chrome
default_publish_method: api
```
