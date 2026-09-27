// Framework：框架/层级图（编号行：number + key + desc，分隔细线）
import type { SvgComponentProps } from './types'
import { fs, strokeW } from './helpers'

export function Framework({ title, nodes, density, tokens, viewW, viewH }: SvgComponentProps) {
  const rows = nodes.slice(0, 6)
  const top = viewH * 0.16
  const bottom = viewH * 0.9
  const rowH = rows.length > 1 ? (bottom - top) / (rows.length - 1) : 0
  const numX = viewW * 0.14
  const labelX = viewW * 0.24
  const descX = viewW * 0.5
  const sw = strokeW(1, density)

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {title && (
        <text x={viewW / 2} y={viewH * 0.09} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', letterSpacing: '0.3em', fontSize: fs(24, density) }} fill={tokens.ink2}>
          {title.toUpperCase()}
        </text>
      )}
      {rows.map((n, i) => {
        const y = top + i * rowH
        return (
          <g key={n.id}>
            <text x={numX} y={y} textAnchor="middle" style={{ fontFamily: 'var(--font-en-num)', fontSize: fs(26, density) }} fill={tokens.accent}>
              {String(i + 1).padStart(2, '0')}
            </text>
            <text x={labelX} y={y} style={{ fontFamily: 'var(--font-display)', fontSize: fs(40, density), fontWeight: 600 }} fill={tokens.ink}>
              {n.label}
            </text>
            {n.sub && (
              <text x={descX} y={y} style={{ fontFamily: 'var(--font-en)', fontSize: fs(22, density) }} fill={tokens.ink2}>
                {n.sub}
              </text>
            )}
            <line x1={viewW * 0.12} y1={y + fs(20, density)} x2={viewW * 0.88} y2={y + fs(20, density)} stroke={tokens.ink2} strokeWidth={sw} opacity={0.35} vectorEffect="non-scaling-stroke" />
          </g>
        )
      })}
    </svg>
  )
}
