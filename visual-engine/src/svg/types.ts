// SVG 组件公共 Props（视觉语言硬约束见 docs/notes.md §SVG 视觉语言硬约束）
import type { Density, SvgEdge, SvgNode } from '../lib/types'
import type { PaletteTokens } from '../theme/palettes'

export interface SvgComponentProps {
  title?: string
  nodes: SvgNode[]
  edges?: SvgEdge[]
  density: Density
  tokens: PaletteTokens
  viewW: number
  viewH: number
}

export type { SvgNode, SvgEdge }
export type { PaletteTokens }
