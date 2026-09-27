# AI 科普双平台工作流与 Skills

本目录公开一套可复用的公众号与小红书批量生产方法论、Agent Skills、渲染模板和辅助脚本。账号名称、作者身份、用户目录、批次内容、凭证与私有网络配置均已从公开版移除；实际账号参数由使用者本地填写。

## 从这里开始

1. 阅读 [`工作流方法论`](docs/aike-workflow/methodology.md) 了解批次、阶段与质量门。
2. 在 Agent 中加载 [`aike-公众号流`](skills/aike/aike-公众号流/SKILL.md) 作为主控 Skill。
3. 按需加载 [`素材采集`](skills/aike/aike-素材采集/SKILL.md)、[`写作语言`](skills/aike/aike-写作语言/SKILL.md)、[`栏目皮肤注入`](skills/aike/aike-皮肤注入/SKILL.md) 与 [`AI 封面生成`](skills/aike/ai-cover/SKILL.md)。
4. 查看 [`视觉系统规范`](docs/aike-workflow/visual-system.md)、[`小红书笔记模板`](docs/aike-workflow/xhs-note-template.md) 和 [`多 AI 协作协议`](docs/aike-workflow/multi-agent-protocol.md)。

## 包含内容

- `docs/aike-workflow/`：工作流方法论、视觉规范、小红书模板和多 AI 协议。
- `skills/aike/`：主控批量流水线、素材采集、写作语气、皮肤注入和封面生成 Skills，含可复用脚本与模板。
- `render/`：公众号封面、小红书卡片 HTML 模板及截图工具。
- `visual-engine/`：React + Playwright 第二代批量渲染器，与 HTML 路线共用 `render.json`、文件名和尺寸契约。
- `风格/`：五组配色 Skill 与 CSS 调色板。

## 安装与运行

- 将仓库克隆到内容项目根目录，并从仓库路径加载 `skills/aike/` 下需要的 `SKILL.md`。如果 Agent 只支持个人 Skills 目录，可为仓库内的 Skill 文件夹创建软链接；不要把 `scripts/` 从仓库目录复制或移走，旧版渲染脚本会按仓库结构定位 `render/` 与 `风格/`。
- 将 `render/`、`风格/` 放在你的项目根目录；批次数据按 Skill 指定的目录结构放在项目根目录下。
- 运行任一网页渲染入口前，准备 Node.js 18.18+，并在 `visual-engine/` 执行 `npm ci` 与 `npx playwright install chromium`；旧版 HTML 批量脚本也调用这里的 tsx/Playwright 截图工具。旧版脚本另需 Python 3 与 Pillow，排版转换还需兼容的 Markdown 转微信 HTML 工具。
- React 渲染器运行 `npm run render:batch -- --batch <批次目录> [--only NN] [--out-root <目录>]`；旧 HTML 路线仍用主 Skill 中的 `render_batch.py` 命令。两者共用上面的 Playwright 运行时。
- `finalize_articles.py` 从环境变量读取 `WECHAT_HTML_CONVERTER` 和可选的 `NODE_BINARY`；采集 Skill 用 `BAOYU_ENV_FILE` 定位 API 环境文件、用可选 `AIKE_PROXY_URL` 指定代理；封面脚本支持 `BAOYU_ENV_FILE`。API 密钥、微信凭证和本机路径应留在本地配置中。
- 配色目录只保留了配色规范和颜色值，没有发布个人参考图或底纹图片；两套网页渲染器均以配色纯色作为背景。

现有仓库中的 AWS / Baoyu Skills 请按本仓库原有说明安装。本公开包只补充项目自己的内容生产工作流，不重复打包第三方 Skill。

## 许可与来源

本仓库的整体许可证及第三方依赖声明见仓库根目录。封面提示词参考和模型端点说明保留其公开来源；使用时请遵守相应服务条款与素材来源要求。
