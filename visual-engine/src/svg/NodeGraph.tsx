// NodeGraph：概念/实体关系图（环形布局，线稿 + 主题色根节点）
import { useId } from 'react'
import type { SvgComponentProps } from './types'
import { circlePositions, fs, strokeW } from './helpers'

export function NodeGraph({ title, nodes, edges, density, tokens, viewW, viewH }: SvgComponentProps) {
  const uid = useId().replace(/:/g, '')
  const cx = viewW / 2
  const cy = viewH / 2
  const r = Math.min(viewW, viewH) * 0.34
  const pts = circlePositions(nodes.length, cx, cy, r)
  const nodeR = fs(30, density)
  const sw = strokeW(2, density)

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={tokens.ink} />
        </marker>
      </defs>

      {title && (
        <text x={cx} y={viewH * 0.1} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', letterSpacing: '0.3em', fontSize: fs(24, density) }} fill={tokens.ink2}>
          {title.toUpperCase()}
        </text>
      )}

      {(edges ?? []).map((e, i) => {
        const a = pts[nodes.findIndex((n) => n.id === e.from)]
        const b = pts[nodes.findIndex((n) => n.id === e.to)]
        if (!a || !b) return null
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={tokens.ink} strokeWidth={sw} markerEnd={`url(#arr-${uid})`} vectorEffect="non-scaling-stroke" />
            {e.label && (
              <text x={mx} y={my - 12} textAnchor="middle" style={{ fontFamily: 'var(--font-en)', fontSize: fs(18, density) }} fill={tokens.ink2}>
                {e.label}
              </text>
            )}
          </g>
        )
      })}

      {nodes.map((n, i) => {
        const p = pts[i]
        const isRoot = i === 0
        return (
          <g key={n.id}>
            <circle
              cx={p.x} cy={p.y} r={nodeR}
              fill={isRoot ? tokens.accent : 'none'}
              stroke={tokens.ink} strokeWidth={sw}
              vectorEffect="non-scaling-stroke"
            />
            <text x={p.x} y={p.y + nodeR + fs(26, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: fs(28, density) }} fill={tokens.ink}>
              {n.label}
            </text>
            {n.sub && (
              <text x={p.x} y={p.y + nodeR + fs(50, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-en)', fontSize: fs(18, density) }} fill={tokens.ink2}>
                {n.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
