// VisualSpec 工具：默认工厂 + 扁平化 + diff + target 读写（供 eventRecorder / Observer / Designer 共用）
import type {
  VisualSpec, EditElement, EditEvent,
  TypographySpec, LayoutSpec, SvgSpec, TextElement,
} from './types'

// 可编辑目标（element.property），与 EditEvent.element/property 对齐
export type EditableTarget =
  | 'content.title' | 'content.subtitle' | 'content.meta' | 'content.num' | 'content.category' | 'content.cognitiveMode'
  | 'title.fontFamily' | 'title.fontWeight' | 'title.fontSize' | 'title.lineHeight' | 'title.letterSpacing' | 'title.maxWidth' | 'title.alignment'
  | 'subtitle.fontFamily' | 'subtitle.fontWeight' | 'subtitle.fontSize' | 'subtitle.lineHeight' | 'subtitle.letterSpacing' | 'subtitle.maxWidth' | 'subtitle.alignment'
  | 'meta.fontFamily' | 'meta.fontWeight' | 'meta.fontSize' | 'meta.letterSpacing'
  | 'layout.x' | 'layout.y' | 'layout.width' | 'layout.spacing' | 'layout.padding'
  | 'svg.scale' | 'svg.nodeCountBudget' | 'svg.lineDensity' | 'svg.opacity'

export const EDITABLE_TARGETS: EditableTarget[] = [
  'content.title', 'content.subtitle', 'content.meta', 'content.num', 'content.category', 'content.cognitiveMode',
  'title.fontFamily', 'title.fontWeight', 'title.fontSize', 'title.lineHeight', 'title.letterSpacing', 'title.maxWidth', 'title.alignment',
  'subtitle.fontFamily', 'subtitle.fontWeight', 'subtitle.fontSize', 'subtitle.lineHeight', 'subtitle.letterSpacing', 'subtitle.maxWidth', 'subtitle.alignment',
  'meta.fontFamily', 'meta.fontWeight', 'meta.fontSize', 'meta.letterSpacing',
  'layout.x', 'layout.y', 'layout.width', 'layout.spacing', 'layout.padding',
  'svg.scale', 'svg.nodeCountBudget', 'svg.lineDensity', 'svg.opacity',
]

const TEXT_ELEMENTS: TextElement[] = ['title', 'subtitle', 'meta']

export function defaultResearchSpec(): VisualSpec {
  return {
    content: {
      num: '01',
      title: '当 AI 开始\n观察你的修改',
      subtitle: '研究型封面的参数化生成实验',
      meta: 'AI 科普 · 第 01 篇',
      category: 'AI教程',
      cognitiveMode: 'Explain',
    },
    visual: { density: 'medium' },
    style: {
      palette: 'inkblack',
      platform: 'gzh',
      typography: {
        title: { fontFamily: 'Source Han Serif SC', fontWeight: 600, fontSize: 64, lineHeight: 1.22, letterSpacing: 0.01, maxWidth: 620, alignment: 'center' },
        subtitle: { fontFamily: 'Inter', fontWeight: 400, fontSize: 19, lineHeight: 1.4, letterSpacing: 0.04, maxWidth: 620, alignment: 'center' },
        meta: { fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: 16, letterSpacing: 0.08, alignment: 'center' },
      },
      layout: { x: 0, y: 0, width: 620, spacing: 20, padding: 48 },
      svg: { scale: 1, nodeCountBudget: 5, lineDensity: 1, opacity: 1 },
    },
  }
}

// 把 VisualSpec 摊成可编辑目标 → 值 的扁平表（仅含已定义值）
export function flattenSpec(spec: VisualSpec): Partial<Record<EditableTarget, number | string>> {
  const out: Partial<Record<EditableTarget, number | string>> = {}
  const c = spec.content
  if (c) {
    for (const k of ['title', 'subtitle', 'meta', 'num', 'category', 'cognitiveMode'] as const) {
      if (c[k] !== undefined) out[`content.${k}` as EditableTarget] = c[k] as string
    }
  }
  const typo = spec.style.typography
  if (typo) {
    for (const el of TEXT_ELEMENTS) {
      const t = typo[el]
      if (!t) continue
      if (t.fontFamily !== undefined) out[`${el}.fontFamily` as EditableTarget] = t.fontFamily
      if (t.fontWeight !== undefined) out[`${el}.fontWeight` as EditableTarget] = t.fontWeight
      if (t.fontSize !== undefined) out[`${el}.fontSize` as EditableTarget] = t.fontSize
      if (t.lineHeight !== undefined) out[`${el}.lineHeight` as EditableTarget] = t.lineHeight
      if (t.letterSpacing !== undefined) out[`${el}.letterSpacing` as EditableTarget] = t.letterSpacing
      if (t.maxWidth !== undefined) out[`${el}.maxWidth` as EditableTarget] = t.maxWidth
      if (t.alignment !== undefined) out[`${el}.alignment` as EditableTarget] = t.alignment
    }
  }
  const layout = spec.style.layout
  if (layout) {
    if (layout.x !== undefined) out['layout.x'] = layout.x
    if (layout.y !== undefined) out['layout.y'] = layout.y
    if (layout.width !== undefined) out['layout.width'] = layout.width
    if (layout.spacing !== undefined) out['layout.spacing'] = layout.spacing
    if (layout.padding !== undefined) out['layout.padding'] = layout.padding
  }
  const svg = spec.style.svg
  if (svg) {
    if (svg.scale !== undefined) out['svg.scale'] = svg.scale
    if (svg.nodeCountBudget !== undefined) out['svg.nodeCountBudget'] = svg.nodeCountBudget
    if (svg.lineDensity !== undefined) out['svg.lineDensity'] = svg.lineDensity
    if (svg.opacity !== undefined) out['svg.opacity'] = svg.opacity
  }
  return out
}

// 比较两个 spec，返回变化的 {element, property, before, after}（不含 id/ts 等元数据）
export function diffSpecs(
  before: VisualSpec,
  after: VisualSpec,
): Array<{ element: EditElement; property: string; before: unknown; after: unknown }> {
  const a = flattenSpec(before)
  const b = flattenSpec(after)
  const events: Array<{ element: EditElement; property: string; before: unknown; after: unknown }> = []
  for (const target of EDITABLE_TARGETS) {
    const bv = b[target]
    if (bv === undefined) continue
    const av = a[target]
    if (av === undefined || av !== bv) {
      const [element, property] = target.split('.') as [EditElement, string]
      events.push({ element, property, before: av ?? null, after: bv })
    }
  }
  return events
}

export function getTarget(spec: VisualSpec, target: string): unknown {
  const [el, prop] = target.split('.')
  if (el === 'content') return (spec.content as Record<string, unknown> | undefined)?.[prop]
  if (el === 'layout') return (spec.style.layout as LayoutSpec | undefined)?.[prop as keyof LayoutSpec]
  if (el === 'svg') return (spec.style.svg as SvgSpec | undefined)?.[prop as keyof SvgSpec]
  if (el === 'title' || el === 'subtitle' || el === 'meta') {
    return (spec.style.typography as Partial<Record<TextElement, TypographySpec>> | undefined)?.[el as TextElement]?.[prop as keyof TypographySpec]
  }
  return undefined
}

// 不可变写入：返回带新目标值的新 spec
export function applyTarget(spec: VisualSpec, target: string, value: unknown): VisualSpec {
  const next: VisualSpec = structuredClone(spec)
  const [el, prop] = target.split('.')
  if (el === 'content') {
    next.content = { ...(next.content ?? {}), [prop]: value } as VisualSpec['content']
  } else if (el === 'layout') {
    next.style.layout = { ...(next.style.layout ?? {}), [prop]: value } as LayoutSpec
  } else if (el === 'svg') {
    next.style.svg = { ...(next.style.svg ?? {}), [prop]: value } as SvgSpec
  } else if (el === 'title' || el === 'subtitle' || el === 'meta') {
    const t = (next.style.typography ?? {}) as Partial<Record<TextElement, TypographySpec>>
    t[el as TextElement] = { ...(t[el as TextElement] ?? {}), [prop]: value } as TypographySpec
    next.style.typography = t
  }
  return next
}

// 把事件列表打包成完整 EditEvent（补 id/ts/sessionId/template）
export function toEditEvents(
  diffs: Array<{ element: EditElement; property: string; before: unknown; after: unknown }>,
  meta: { sessionId: string; template: string; ts?: number },
): EditEvent[] {
  const ts = meta.ts ?? Date.now()
  return diffs.map((d, i) => ({
    id: `${meta.sessionId}-${ts}-${i}`,
    ts,
    sessionId: meta.sessionId,
    template: meta.template,
    element: d.element,
    property: d.property,
    before: d.before,
    after: d.after,
    reason: 'unknown',
  }))
}
