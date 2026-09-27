# 批次写作工作包模板

你只负责分配给你的文章目录中的内容文件，不运行会改写共享目录的渲染、收尾、归档脚本。每篇产出 `article.md`、`article.yaml`、`render.json`、`xhs-note.md` 和 `发布清单.txt`。

## 目录与素材

- 项目根目录：`<PROJECT_ROOT>`
- 批次目录：`<PROJECT_ROOT>/批次/批次-<批次号>/<NN-文章slug>/`
- 素材目录：`<PROJECT_ROOT>/素材/批次-<批次号>/<slug>/`（只读）
- 渲染模板：`<PROJECT_ROOT>/render/`
- 配色目录：`<PROJECT_ROOT>/风格/`
- 使用系统中可用的 Python、Node 和浏览器命令；不要写入特定个人机器路径。

## `article.md`

采用“场景钩子 → 通俗解释 → 可执行步骤 → 总结 → 来源”的结构。使用有序二级标题 `## 1.`、`## 2.`；小节数量与 `render.json` 的 cards 数量一致。注明素材来源，不添加未经核实的数字或案例。文末作者名和关注语使用项目本地配置，不在此模板预设真实身份。发布前删除自评表、模式声明等内部元说明。

## `article.yaml`

```yaml
title: <主标题>
author: <项目配置的作者名>
digest: <一句话摘要，不超过 40 字>
```

## `render.json`

```json
{
  "cover": {"template": "cover-research", "palette": "暖灰", "fields": {"title": "标题", "sub": "副标题"}},
  "cards": [
    {"template": "card-definition", "fields": {"no": "01", "en": "BASICS", "title": "概念", "sum": "一句解释"}},
    {"template": "card-checklist", "fields": {"title": "操作步骤", "items": "第一步\n第二步", "tip": "提示"}}
  ]
}
```

字段名以对应 HTML 模板的 class 为准。使用 `render_batch.py` 前检查模板和 JSON 字段；批次中的卡片顺序与文章小节对应。模板支持 `cover_1x1` 与 `xhs_cover` 等可选封面字段，详情见主 Skill。

## `xhs-note.md`

必须有三个二级标题：`## 标题候选`、`## 正文`、`## 标签`。正文独立组织，先给两句钩子，再写 3–5 个要点和互动收尾；按项目规范控制篇幅、Emoji 和标签。不要把公众号长文直接截短复制，也不要在小红书笔记中写入公众号标识或作者个人身份。

## `发布清单.txt`

列出选定标题、正文文件、图片上传顺序、计划时间段和审核状态。具体发布由主控在 G3 总审后处理。

## 汇报

完成后报告每篇文件状态、待核实事实、来源缺失项和图片字段问题。不要运行共享目录脚本。
