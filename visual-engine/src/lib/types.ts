// 核心类型（Visual JSON v2 + 旧 render.json 兼容 + Workbench 扩展）

export type PaletteName = 'warmgray' | 'inkblack' | 'terracotta' | 'mistblue' | 'sage'
export type Platform = 'gzh' | 'xhs'
export type Density = 'sparse' | 'medium' | 'dense'

export type TemplateName =
  | 'cover-research' | 'cover-editorial' | 'cover-fieldnotes' | 'cover-system' | 'cover-statement'
  | 'card-definition' | 'card-beforeafter' | 'card-framework' | 'card-checklist' | 'card-example' | 'card-statement'
  | 'structure-nodegraph' | 'structure-agentloop' | 'structure-framework' | 'structure-timeline'

export type Category =
  | 'AI原理' | 'AI入门' | 'AI工具' | 'AI Agent' | 'AI编程' | 'AI工作流'
  | 'AI职场' | 'AI趋势' | 'AI观点' | 'AI教程' | 'AI案例'

export type CognitiveMode = 'Explain' | 'Opinion' | 'Experiment' | 'System' | 'Action' | 'Statement'

export type StructureKind = 'nodegraph' | 'agentloop' | 'framework' | 'timeline'

export type TextElement = 'title' | 'subtitle' | 'meta'
export type EditElement = TextElement | 'svg' | 'background' | 'footer' | 'layout' | 'content'

export type Alignment = 'left' | 'center' | 'right'

// ── Workbench 可编辑视觉参数 ──
export interface TypographySpec {
  fontFamily?: string
  fontWeight?: number
  fontSize?: number      // px
  lineHeight?: number  // 倍数，如 1.22
  letterSpacing?: number // em，如 -0.02
  maxWidth?: number    // px
  alignment?: Alignment
}
export interface LayoutSpec {
  x?: number
  y?: number
  width?: number       // 主体最大宽度 px
  spacing?: number     // 元素间间距 px
  padding?: number     // 画布内边距 px
}
export interface SvgSpec {
  scale?: number
  nodeCountBudget?: number
  lineDensity?: number
  opacity?: number
}

// ── 学习数据：修改事件（行为学习原子，由属性面板捕获）──
export interface EditEvent {
  id: string
  ts: number                 // Unix ms
  sessionId: string
  template: string           // 模板名，如 'cover-research'
  element: EditElement
  property: string           // 如 'fontSize' | 'scale' | 'spacing'
  before: unknown
  after: unknown
  reason?: string            // 用户可补填，默认 'unknown'
}

// ── Rule Memory（三层）──
export type RuleScope = 'typography' | 'layout' | 'svg' | 'composition'
export type RuleLevel = 1 | 2 | 3
export type RuleStatus = 'experimental' | 'proposed' | 'approved'
export interface RuleConstraint {
  op: 'value' | 'range' | 'max' | 'min' | 'enum'
  value: unknown
}

// 规则作用域（Rule Scoping）：规则只在 context 命中的语境下套用。
// 缺省/空对象 = 全局规则（向后兼容旧规则）。
// 多个字段同时指定时为 AND；template 由调用方声明（canonical spec 本身不带 template），
// category/palette 直接从 spec.content / spec.style 读取。
export interface RuleContext {
  template?: string      // 如 'cover-research'；不指定 = 所有模板
  category?: string      // 如 'AI入门'；不指定 = 所有内容分类
  palette?: PaletteName  // 如 'inkblack'；不指定 = 所有配色
}

export interface RuleEvidenceTransition { before: unknown; after: unknown; count: number }
export interface Rule {
  id: string
  level: RuleLevel
  scope: RuleScope
  target: string             // 'title.fontSize'
  constraint: RuleConstraint
  description: string
  status: RuleStatus
  evidence: { occurrences: number; transitions: RuleEvidenceTransition[] }
  context?: RuleContext      // 作用域；空/缺省 = 全局
  createdAt: number
  updatedAt: number
}

// ── 版本快照 ──
export interface Version {
  id: string
  label: string              // 'V1'..'Vn'
  ts: number
  spec: VisualSpec
  events: EditEvent[]
  ruleVersion: string
  screenshot?: string
}

// ── v2：content / visual / style 三层 ──
export interface VisualSpec {
  content: {
    category?: Category
    cognitiveMode?: CognitiveMode
    concept?: string
    audience?: string
    title?: string
    subtitle?: string
    meta?: string
    num?: string
  }
  visual: {
    metaphor?: string
    structure?: StructureSpec
    density: Density
  }
  style: {
    palette: PaletteName
    platform: Platform
    // Workbench：每文本元素独立排版；兼容旧 displayWeight/bodyScale
    typography?: Partial<Record<TextElement, TypographySpec>> & { displayWeight?: number; bodyScale?: number }
    layout?: LayoutSpec
    svg?: SvgSpec
  }
}

// 预留槽位：本阶段不实现 LLM 调用
export interface LlmHint { focus?: string; complexity?: Density }

export interface SvgNode { id: string; label: string; sub?: string }
export interface SvgEdge { from: string; to: string; label?: string }

export interface StructureSpec {
  kind: StructureKind
  nodes: SvgNode[]
  edges?: SvgEdge[]
  density: Density
  title?: string
}

// ── 旧格式（向后兼容，原样消费）──
export interface LegacyImage {
  template: TemplateName
  palette?: PaletteName
  fields: Record<string, string>
}
export interface LegacyRenderJson {
  cover?: LegacyImage
  xhs_cover?: LegacyImage
  cover_1x1?: LegacyImage
  cards?: LegacyImage[]
}

// ── v2 作业 ──
export interface JobImage extends Partial<LegacyImage> {
  visual?: VisualSpec
  llm_hint?: LlmHint
}
export interface VisualJob {
  cover?: JobImage
  xhs_cover?: JobImage
  cover_1x1?: JobImage
  cards?: JobImage[]
}

// ── 引擎内部解析结果（RenderPage 与 CLI 的中间形态）──
export type JobKind = 'cover' | 'card' | '1x1'

export interface ResolvedJob {
  kind: JobKind
  template: TemplateName
  palette: PaletteName
  platform: Platform
  background: 'img' | 'color'
  padding: string
  density: Density
  structure?: StructureSpec
  fields: Record<string, string>
}
