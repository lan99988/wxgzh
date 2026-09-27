// 模板 → 字段类型映射（text | lines | html），兼容旧 render.json 的 class-keyed fields
import type { PaletteName, Platform, TemplateName } from './types'

export type FieldSpec = 'text' | 'lines' | 'html'

export const FIELD_MAP: Record<TemplateName, Record<string, FieldSpec>> = {
  'cover-research': { num: 'text', title: 'lines', sub: 'text', meta: 'text' },
  'cover-editorial': { issue: 'text', title: 'lines', foot: 'text' },
  'cover-fieldnotes': { num: 'text', body: 'html', flow: 'html', obs: 'text' },
  'cover-system': { top: 'html', title: 'lines', io: 'html' },
  'cover-statement': { stmt: 'lines', foot: 'text' },
  'card-definition': { no: 'text', en: 'text', title: 'lines', sum: 'text' },
  'card-beforeafter': { lab: 'text', before: 'html', arrow: 'html', after: 'html', sum: 'text' },
  'card-framework': { name: 'text', items: 'html', sum: 'text' },
  'card-checklist': { title: 'text', items: 'html', tip: 'text' },
  'card-example': { lab: 'text', code: 'html', note: 'text' },
  'card-statement': { stmt: 'lines', foot: 'text' },
  'structure-nodegraph': { title: 'text' },
  'structure-agentloop': { title: 'text' },
  'structure-framework': { title: 'text' },
  'structure-timeline': { title: 'text' },
}

// 旧 render.json fields → 组件 props（附带 palette/platform）
export function fieldsToProps(
  template: TemplateName,
  fields: Record<string, string>,
  palette: PaletteName,
  platform: Platform,
): Record<string, unknown> {
  const spec = FIELD_MAP[template] ?? {}
  const out: Record<string, unknown> = { palette, platform }
  for (const [k, v] of Object.entries(fields)) {
    out[k] = v // 'lines' 由组件自行 split('\n')；'html' 由组件 dangerouslySetInnerHTML
  }
  return out
}
