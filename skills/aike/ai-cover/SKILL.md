---
# AI 封面生成（Anthropic Research 风格）

## 输入信息

| 字段 | 必填 | 说明 |
|------|------|------|
| 主题 | 是 | 如「AI × 职场」「AI × 成长」「AI × 家庭」 |
| 主标题 | 是 | 封面主标题文字 |
| 副标题 | 否 | 可留空 |
| 核心表达 | 是 | 一句话描述主题想表达的价值 |
| 画幅比例 | 是 | 5:2 / 16:9 / 4:5 / 3:4 / 9:16 |
| 用途 | 是 | X封面 / 文章封面 / 产品介绍 / 教程海报 |

## 主题 → 背景色映射

| 主题 | 背景色 | 文字色 |
|------|--------|--------|
| AI × 职场 | 深黑 `#1A1A1A` | `#EFEAE0` |
| AI × 成长 | 雾霾蓝 `#8FA9C7` | `#1A1A1A` |
| AI × 家庭 | 鼠尾草绿 `#B8C9B8` | `#1A1A1A` |

其他主题：从提示词模板的背景色系统（陶土橙 / 深黑 / 暖灰 / 鼠尾草绿 / 雾霾蓝）中选择。

## 工作流

1. 读取 `references/theme-palette.md` 确定背景色
2. 读取 `references/anthropic-style-prompt.md` 获取完整提示词模板
3. 用输入信息填充模板（主题 / 标题 / 副标题 / 核心表达 / 画幅 / 用途）
4. 运行 `scripts/generate_cover.py --prompt "<完整提示词>" --size <尺寸> --out <输出路径>` 调用 qwen-image-max 生成图片
5. 返回封面图路径

## 生图后端

- 模型：`qwen-image-max`（阿里云百炼）
- 端点：`https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- 凭证：`DASHSCOPE_API_KEY`（从 `~/.baoyu-skills/.env` 读取）
- 尺寸映射：16:9→`1664*928`，9:16→`928*1664`，4:5→`928*1160`，3:4→`928*1232`，5:2→`1664*928`（模型不支持超宽时用 16:9 兜底）
*（内容由AI生成，仅供参考）*
