// 11 栏目映射（真源 = 视觉系统规范 §5.5.3 + 风格清单 v1 表；颜色绑定认知模式而非主题）
import type { Category, PaletteName, StructureKind, TemplateName } from '../lib/types'

export interface CategorySpec {
  category: Category
  main: PaletteName
  alt: PaletteName
  cover: TemplateName
  cards: TemplateName[]
  skin: string
  structure?: StructureKind
}

// 卡字母：A=definition B=beforeafter C=framework D=checklist E=example F=statement
// 封面：①research ②editorial ③fieldnotes ④system ⑤statement
export const CATEGORY_MAP: Record<Category, CategorySpec> = {
  'AI原理': {
    category: 'AI原理', main: 'warmgray', alt: 'mistblue',
    cover: 'cover-research', cards: ['card-definition', 'card-framework'],
    skin: 'research_paper', structure: 'framework',
  },
  'AI入门': {
    category: 'AI入门', main: 'warmgray', alt: 'sage',
    cover: 'cover-research', cards: ['card-framework', 'card-example'],
    skin: 'research_paper', structure: 'framework',
  },
  'AI工具': {
    category: 'AI工具', main: 'sage', alt: 'mistblue',
    cover: 'cover-fieldnotes', cards: ['card-example', 'card-checklist'],
    skin: 'field_notes', structure: 'framework',
  },
  'AI Agent': {
    category: 'AI Agent', main: 'inkblack', alt: 'mistblue',
    cover: 'cover-system', cards: ['card-example', 'card-definition'],
    skin: 'system_dark', structure: 'agentloop',
  },
  'AI编程': {
    category: 'AI编程', main: 'inkblack', alt: 'warmgray',
    cover: 'cover-system', cards: ['card-example', 'card-definition'],
    skin: 'system_dark', structure: 'nodegraph',
  },
  'AI工作流': {
    category: 'AI工作流', main: 'mistblue', alt: 'warmgray',
    cover: 'cover-research', cards: ['card-checklist', 'card-example'],
    skin: 'workflow_blue', structure: 'timeline',
  },
  'AI职场': {
    category: 'AI职场', main: 'inkblack', alt: 'terracotta',
    cover: 'cover-statement', cards: ['card-beforeafter', 'card-statement'],
    skin: 'editorial_orange', structure: undefined,
  },
  'AI趋势': {
    category: 'AI趋势', main: 'inkblack', alt: 'terracotta',
    cover: 'cover-editorial', cards: ['card-beforeafter', 'card-statement'],
    skin: 'editorial_orange', structure: 'timeline',
  },
  'AI观点': {
    category: 'AI观点', main: 'terracotta', alt: 'inkblack',
    cover: 'cover-statement', cards: ['card-statement', 'card-beforeafter'],
    skin: 'editorial_orange', structure: undefined,
  },
  'AI教程': {
    category: 'AI教程', main: 'mistblue', alt: 'sage',
    cover: 'cover-research', cards: ['card-checklist', 'card-example'],
    skin: 'workflow_blue', structure: 'timeline',
  },
  'AI案例': {
    category: 'AI案例', main: 'sage', alt: 'terracotta',
    cover: 'cover-fieldnotes', cards: ['card-example', 'card-checklist'],
    skin: 'field_notes', structure: 'framework',
  },
}

export const CATEGORIES = Object.keys(CATEGORY_MAP) as Category[]

export function resolveCategory(category?: Category): CategorySpec {
  if (category && CATEGORY_MAP[category]) return CATEGORY_MAP[category]
  return CATEGORY_MAP['AI原理'] // 兜底
}
