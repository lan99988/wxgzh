// Timeline：阶段/路径/趋势图（横线 + 节点 + 上下交错标签）
import type { SvgComponentProps } from './types'
import { fs, strokeW } from './helpers'

export function Timeline({ title, nodes, density, tokens, viewW, viewH }: SvgComponentProps) {
  const pts = nodes.slice(0, 8)
  const y = viewH * 0.55
  const x0 = viewW * 0.1
  const x1 = viewW * 0.9
  const step = pts.length > 1 ? (x1 - x0) / (pts.length - 1) : 0
  const sw = strokeW(2, density)

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {title && (
        <text x={viewW / 2} y={viewH * 0.12} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', letterSpacing: '0.3em', fontSize: fs(24, density) }} fill={tokens.ink2}>
          {title.toUpperCase()}
        </text>
      )}

      <line x1={x0} y1={y} x2={x1} y2={y} stroke={tokens.ink} strokeWidth={sw} vectorEffect="non-scaling-stroke" />

      {pts.map((n, i) => {
        const x = pts.length === 1 ? viewW / 2 : x0 + i * step
        const above = i % 2 === 0
        return (
          <g key={n.id}>
            <circle cx={x} cy={y} r={fs(13, density)} fill={tokens.accent} stroke={tokens.ink} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
            <line x1={x} y1={y} x2={x} y2={above ? y - fs(22, density) : y + fs(22, density)} stroke={tokens.ink2} strokeWidth={strokeW(1, density)} vectorEffect="non-scaling-stroke" />
            <text x={x} y={above ? y - fs(34, density) : y + fs(52, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: fs(28, density) }} fill={tokens.ink}>
              {n.label}
            </text>
            {n.sub && (
              <text x={x} y={above ? y - fs(60, density) : y + fs(76, density)} textAnchor="middle" style={{ fontFamily: 'var(--font-en)', fontSize: fs(18, density) }} fill={tokens.ink2}>
                {n.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
