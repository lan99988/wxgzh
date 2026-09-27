---
title: aike-栏目皮肤注入（公众号正文排版皮肤 v1.4.1）
version: v1.4.1
date: 2026-08-20
status: 生效（本项目排版 SOT）
owner: public-template
changelog:
  - v1.4.1: System 皮肤删荧光绿 `#39FF14` → Anthropic AI Lab System 深黑档案风（黑模块 `#1A1A1A` / 代码底 `#0D0D0D` 奶字 `#EFEAE0` / 强调 `#D97757` / 关键词 `#8FA9C7`）；新增第一层正文软化（正文 `#141413`→`#252525` 禁纯黑、标题 `#1A1A1A`、辅助 `#6B6B66`）
  - v1.4: 落地「固定阅读基底 + 栏目环境色 + 图片自由」三层配色，kami 后处理按栏目注入皮肤
---

# aike-栏目皮肤注入

> 公众号**正文**（kami 主题产出）的栏目皮肤系统。在 `convert.mjs`(kami) 产出 `article_raw.html` 之后、发布之前，把固定海军蓝 `#1B365D` 替换成「栏目环境色」，实现**同一排版骨架、不同栏目视觉**。
> 这是视觉系统规范「三层配色」的**第二层（栏目环境色）落地脚本**，与封面/卡片母版（第三层·图片自由）是两回事，请勿混淆。

## 何时用本 skill

- 公众号文章 `convert.mjs` 产出 `article_raw.html` 后、**发布前**必须跑本 skill 注入皮肤。
- 不跑 → 文章是 kami 固定海军蓝（旧稿风格）；跑 → 栏目差异化（工具=实验感·科普=知识库感·技术=系统感）。

## 三层配色系统（本项目排版 SOT）

| 层 | 占比 | 范围 | 处理 |
|---|---|---|---|
| 第一层 品牌阅读基底 | 70% | 纸张 `#F7F5EF`（= kami `#f5f4ed`）/ 正文 `#252525`（禁纯黑 `#000`）/ 标题 `#1A1A1A` / 辅助 `#6B6B66` | 固定不动 |
| 第二层 栏目环境色 | 20% | h2 左栏 / 顶标 / strong / 代码块背景 / 引用块 | 本脚本按栏目替换 |
| 第三层 文章图片色 | 10% | 封面 / 卡片图 | render 母版已烘焙（见 `workflow\视觉系统规范-v1.md`），与本脚本无关 |

## 五种皮肤（第二层环境色）

| 皮肤名 | 栏目 | 边框(结构线) | 强调(accent, ≤1%) | 卡/底 | 代码块 |
|---|---|---|---|---|---|
| `research_paper` | AI 原理 / 入门 | 暖灰 `#D8D5CF` | `#BA7517` | `#EFEEE8` | 浅灰底深字 `#1A1A1A` |
| `field_notes` | AI 工具实测 | 鼠尾草绿 `#B8C9B8` | `#6B8A6F` | `#EEF3ED` | 浅绿底深字 `#1A1A1A` |
| `workflow_blue` | AI 工作流教程 | 雾霾蓝 `#8FA9C7` | `#3F5C7A` | `#EEF2F7` | 浅蓝底深字 `#1A1A1A` |
| `system_dark` | AI Agent / Coding | 近黑 `#1A1A1A` | `#D97757`（陶土橙） | 黑模块 `#1A1A1A` / 代码黑底 `#0D0D0D` 奶字 `#EFEAE0` 关键词 `#8FA9C7` | 黑底奶字（**禁荧光绿 `#39FF14`**） |
| `editorial_orange` | AI 观点 / 趋势 | 陶土橙 `#D97757` | `#D97757` | `#F7EDE8` | 浅橙底深字 `#1A1A1A` |

> 浅色栏目：accent 用于「装饰性」左栏（浅，作用于纸面）；ink（深色 `#1A1A1A`）用于 strong/顶标文字保证对比度，避免强调色 flood。
> System：代码区黑底奶字 + 陶土橙强调（AI Lab System 风）；非代码区域保持纸面，仅左栏近黑。

⚠️ **与封面母版区分（重要）**：
- 封面/卡片母版 ④ System 用终端绿 `#39FF14`（那是**图片第三层**，用户 v1.3 定稿保留，render 引擎产出）。
- 本脚本的 `system_dark` 是**正文排版**，改用 Anthropic AI Lab System 深黑档案风（黑底奶字 + 陶土橙强调），**禁用荧光绿**。
- 两者服务对象不同（页面文字 vs 图片），互不冲突；以后别的 AI 不要把封面母版的终端绿也删了。

## 皮肤 ↔ 栏目选择

颜色绑定「认知模式」而非「主题」（见 `workflow\视觉系统规范-v1.md` §5.5：同一对象按文章目的换皮肤）。

| 文章认知模式 / 栏目 | 皮肤 |
|---|---|
| AI 原理 / 入门（解释世界） | `research_paper` |
| AI 工具实测 / 案例（验证工具） | `field_notes` |
| AI 工作流 / 教程（指导行动） | `workflow_blue` |
| AI Agent / 编程 / 自动化（拆解系统） | `system_dark` |
| AI 观点 / 趋势 / 职场（判断趋势） | `editorial_orange` |

## 调用

```bash
PYTHON_BIN="${PYTHON_BIN:-python3}"
SKIN_DIR="skills/aike/aike-皮肤注入/scripts"
"$PYTHON_BIN" "$SKIN_DIR/fix_skin.py" <文章目录> <skin_name>
```

- **输入**：`<文章目录>/article_raw.html`（`convert.mjs` kami 产出）
- **输出**：`<文章目录>/article.html`（预览/base64 内嵌）+ `<文章目录>/article_publish.html`（发布/相对路径）
- `skin_name` ∈ {`research_paper`, `field_notes`, `workflow_blue`, `system_dark`, `editorial_orange`}

## 发布纪律（紧接本脚本）

1. `cp article_publish.html article.html` —— 发布版相对路径**覆盖**预览版，避免 base64 进草稿（微信草稿图需相对路径）
2. `publish.py full <目录>` —— 新建草稿，不覆盖旧稿
3. **校验**：发布版 `base64=0`、海军蓝 `#1B365D=0`、`system_dark` 无 `#39FF14` 有 `#D97757/#0D0D0D/#EFEAE0`、正文软化 `#252525` 存在

## 小红书（Xiaohongshu）发布纪律

> 本 skill 同时管辖公众号正文皮肤与小红书内容发布流程。小红书**无自动发布 API**，须在 creator center 手动创建笔记。

### 待发布素材folder 规范

所有待发布的小红书笔记素材必须存放在以下结构中，确保版本可追溯：

```
<PROJECT_ROOT>/小红书/待发布/XX-slug\
├─ xhs-note.md          # 正文 + 3 标题候选 + 标签
├─ render.json          # 封面/卡片渲染参数
├─ ims/
│   ├─ cover.png        # 封面图 (16:2.35:1 或 4:3)
│   ├─ card-01.png      # 卡片 1
│   ├─ card-02.png      # 卡片 2
│   ├─ card-03.png      # 卡片 3
│   └─ xhs-cover.png    # 小红书专用封面裁切
```

### 具体工作流

1. **准备素材**：将经皮肤注入后的 `article_publish.html` 对应的内容提取至 `xhs-note.md`，图片从 `convert.mjs` 渲染输出至 `ims/` 文件夹
2. **creator center 发布**：
   - 登录小红书 creator center
   - 点击“创建笔记”，上传封面 `cover.png`，按顺序上传卡片图 `card-01.png` → `card-02.png` → `card-03.png`
   - 在编辑器粘贴 `xhs-note.md` 正文内容
   - 从 3 个标题候选中选 1 发布
3. **发布后归档**：
   - 发布成功后，将整个 `XX-slug` 文件夹**移动**至 `<PROJECT_ROOT>/小红书/已发布/`
   - 禁止直接删除或重复使用同名 folder
   - 如需修订，在 `已发布` 目录下新建修订版 folder，勿覆盖原素材

### 规则记录与责任

- **folder 命名规则**：`XX-slug` 为简短识别码，见 `批次编排表.md` 中对应批次的 `slug` 字段
- **本规则归属**：`aike-皮肤注入` skill（ID: `aike-栏目皮肤注入`）
- **更新纪律**：规则变更须遵循 SOT 审核流程，先提交审核后写入本 skill；勿静默覆盖旧规则
- **跨项目复用**：如有其他项目需要相同流程，请在 skill 创建新条目，勿在本 project skill 中混入无关配置

## 脚本替换顺序敏感性（坑）

`fix_skin.py` 内替换顺序不可乱：
1. inline code 特定替换（`background-color:#EEF2F7;color:#1B365D;` → 栏目代码配色）**必须先于**通用 `color:#1B365D` 替换，否则 System 黑底不可见
2. h1 标题色 `#1A1A1A` 替换**必须先于** blanket `#141413`→`#252525`，否则标题被软化
3. 引用盒 `border-left:2px/4px solid #1B365D` 用正则统一覆盖所有 px 宽度（kami 引用盒是 2px，h2 左栏是 4px，只替换 4px 会漏）

## 文件清单

| 文件 | 内容 |
|---|---|
| `SKILL.md` | 本文 |
| `scripts/fix_skin.py` | v1.4.1 皮肤注入脚本（读取 article_raw.html → 注入皮肤 → 输出双 html） |

> 历史备份仅用于追溯；运行时以本 Skill 和当前脚本为准。
