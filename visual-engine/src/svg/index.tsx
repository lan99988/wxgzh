// StructureView：按 kind 分发到具体 SVG 组件（独立导出页 + cover/card 内嵌共用）
import type { Density, PaletteName, SvgEdge, SvgNode, StructureKind } from '../lib/types'
import { PALETTES } from '../theme/palettes'
import { NodeGraph } from './NodeGraph'
import { AgentLoop } from './AgentLoop'
import { Framework } from './Framework'
import { Timeline } from './Timeline'

export interface StructureViewProps {
  kind: StructureKind
  palette: PaletteName
  density: Density
  nodes: SvgNode[]
  edges?: SvgEdge[]
  title?: string
  viewW: number
  viewH: number
}

export function StructureView({ kind, palette, density, nodes, edges, title, viewW, viewH }: StructureViewProps) {
  const tokens = PALETTES[palette]
  const common = { density, tokens, viewW, viewH }
  switch (kind) {
    case 'nodegraph':
      return <NodeGraph title={title} nodes={nodes} edges={edges} {...common} />
    case 'agentloop':
      return <AgentLoop title={title} nodes={nodes} edges={edges} {...common} />
    case 'framework':
      return <Framework title={title} nodes={nodes} edges={edges} {...common} />
    case 'timeline':
      return <Timeline title={title} nodes={nodes} edges={edges} {...common} />
    default:
      return null
  }
}

export const STRUCTURE_KINDS: StructureKind[] = ['nodegraph', 'agentloop', 'framework', 'timeline']
