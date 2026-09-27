---
name: aike-素材采集
description: AI 科普素材自动采集器——读 txt 里的网页链接清单，批量抓取文章正文（Jina Reader），AI 自动识别类别（科普/观点/工具/技术/金句）与主题标签，自动分类归档到 素材\ 目录，独立可单独执行。触发词：「采集素材」「抓素材」「跑素材清单」「待收集.txt」「素材采集」。
---

# aike-素材采集

**独立可执行的素材收集项目**（不依赖公众号写作流程）。输入一个 txt 链接清单 → 输出按类别归档的素材文件夹。

## 快速使用

从项目根目录运行：

```bash
PYTHON_BIN="${PYTHON_BIN:-python3}"
SK="skills/aike/aike-素材采集"
"$PYTHON_BIN" "$SK/scripts/collect.py"
"$PYTHON_BIN" "$SK/scripts/collect.py" <链接清单.txt> --out <素材根目录> --limit 3
```

默认读取项目根目录的 `待收集.txt` 并输出到 `素材/`。代理为可选项，通过 `AIKE_PROXY_URL` 设置。API 环境文件默认从 `~/.baoyu-skills/.env` 读取，也可用 `BAOYU_ENV_FILE` 覆盖。

## 清单格式（待收集.txt）

- 每行一个 URL；`#` 开头的行是注释；空行忽略
- 示例：
  ```
  # AI 职场类
  https://www.36kr.com/p/123456
  https://mp.weixin.qq.com/s/xxxx
  https://www.anthropic.com/news/contextual-retrieval
  ```

## 分类体系（类型 + 主题双层）

**主分类 = 文章类别**（与公众号母版/配色映射联动）：

| 类别 | 定义 | 对应封面母版/配色 |
|---|---|---|
| 科普 | AI 原理/概念/入门 | ① Research Paper / 暖灰 |
| 观点 | 趋势/评论/作者观点 | ② Editorial / 陶土橙 |
| 工具 | 工具介绍/教程/实测 | ③ Field Notes / 鼠尾草绿 |
| 技术 | Agent/编程/自动化/提示词 | ④ System / 深黑 |
| 金句 | 短小金句/爆款文案 | ⑤ Big Statement / 雾霾蓝 |

**副分类 = 主题标签**（2~3 个，如 AI职场/AI工具/AI效率/AI创作/AI编程/AI家庭/AI行业/AI原理/AI成长/AI学习）

## 归档结构

```
ai科普\素材\
├── 科普\ <slug>\   原文.md + 元数据.json + 来源.txt
├── 观点\ <slug>\
├── 工具\ <slug>\
├── 技术\ <slug>\
├── 金句\ <slug>\
└── 未分类\ <slug>\   （分类失败兜底，可手动调整）
```

- `原文.md`：Jina 抓取的正文（含来源链接、抓取时间、发布时间）
- `元数据.json`：url / title / published / category / theme / summary / collected_at —— **后续写作流程直接消费**（选素材、定母版配色、写摘要都用它）
- `来源.txt`：原始链接

## 依赖与原理

| 环节 | 方案 | 说明 |
|---|---|---|
| 抓正文 | Jina Reader（`curl https://r.jina.ai/<URL>`） | 直连优先，失败自动走 配置 `AIKE_PROXY_URL` 后使用代理重试 |
| 分类 | qwen-turbo（DashScope） | 免费、国内直连；key 读 `~/.baoyu-skills/.env` 的 `DASHSCOPE_API_KEY` |
| 归档 | 本地文件夹 | 重复链接自动跳过（同名文件夹已存在） |

## 与其他环节的关系

- 采集是**可独立执行的第 ① 步**；产出 `素材\` 后，写文章时走 `aike-公众号流`（把素材批量挪入 `素材\批次-YYYYMMDD\` 或直接引用）
- 素材类别 → 母版/配色已在元数据里，写作阶段无需重新识别

## 坑库

1. `.env` 文件带 BOM（utf-8-sig），直接 grep 会提取不到 key —— 脚本已用 `utf-8-sig` 解析
2. Jina 对部分网站（微信/知乎等）可能限流或返回空 → 按配置的可选代理重试；仍失败进「抓取失败」报告
3. DashScope 免费层有频率限制 → 脚本内置 2 次重试 + 0.5s 限速；批量过大建议 `--limit` 分批
4. 抓取失败/分类未定**不影响其他 URL**，全部跑完统一在报告里列出
5. Windows 下 urllib 不走代理环境变量 → 抓取用 subprocess 调 curl（脚本已内置），dashscope 国内直连无需代理
