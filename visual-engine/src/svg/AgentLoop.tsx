// AgentLoop：Agent 循环图（环形 4 阶段 + 循环箭头，如 LLM→Tool→Observe→LLM）
import { useId } from 'react'
import type { SvgComponentProps } from './types'
import { circlePositions, fs, strokeW } from './helpers'

export function AgentLoop({ title, nodes, edges, density, tokens, viewW, viewH }: SvgComponentProps) {
  const uid = useId().replace(/:/g, '')
  const n = Math.max(2, Math.min(nodes.length, 6))
  const cx = viewW / 2
  const cy = viewH / 2
  const r = Math.min(viewW, viewH) * 0.3
  const pts = circlePositions(n, cx, cy, r)
  const nodeR = fs(38, density)
  const sw = strokeW(2, density)
  const arc = r * 0.28

  const ringEdges = edges?.length
    ? edges
    : nodes.map((node, i) => ({ from: node.id, to: nodes[(i + 1) % nodes.length].id }))

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={tokens.ink} />
        </marker>
      </defs>

      {title && (
        <text x={cx} y={viewH * 0.08} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', letterSpacing: '0.3em', fontSize: fs(24, density) }} fill={tokens.ink2}>
          {title.toUpperCase()}
        </text>
      )}

      {/* 循环弧线 */}
      {ringEdges.map((e, i) => {
        const a = pts[nodes.findIndex((x) => x.id === e.from)]
        const b = pts[nodes.findIndex((x) => x.id === e.to)]
        if (!a || !b) return null
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        // 垂直方向偏移形成外凸弧
        const ox = (-dy / len) * arc
        const oy = (dx / len) * arc
        return (
          <g key={i}>
            <path
              d={`M ${a.x} ${a.y} Q ${mx + ox} ${my + oy} ${b.x} ${b.y}`}
              fill="none" stroke={tokens.ink} strokeWidth={sw} markerEnd={`url(#arr-${uid})`}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}

      {nodes.slice(0, n).map((node, i) => {
        const p = pts[i]
        return (
          <g key={node.id}>
            <circle cx={p.x} cy={p.y} r={nodeR} fill={i === 0 ? tokens.accent : 'none'} stroke={tokens.ink} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
            <text x={p.x} y={p.y + fs(7, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', fontSize: fs(20, density) }} fill={i === 0 ? tokens.paperColor : tokens.ink}>
              {String(i + 1).padStart(2, '0')}
            </text>
            <text x={p.x} y={p.y + nodeR + fs(26, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: fs(28, density) }} fill={tokens.ink}>
              {node.label}
            </text>
            {node.sub && (
              <text x={p.x} y={p.y + nodeR + fs(50, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-en)', fontSize: fs(17, density) }} fill={tokens.ink2}>
                {node.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
