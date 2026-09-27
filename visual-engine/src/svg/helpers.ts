// SVG 组件共享布局工具
import type { Density } from '../lib/types'

export interface Pt { x: number; y: number }

/** 环形布局：n 个节点从正上方顺时针均匀分布 */
export function circlePositions(n: number, cx: number, cy: number, r: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  }
  return pts
}

/** 密度 → 字号/间距缩放：sparse 放大留白，dense 紧凑 */
export const DENSITY_SCALE: Record<Density, number> = { sparse: 1.2, medium: 1, dense: 0.8 }

export function fs(base: number, density: Density): number {
  return Math.round(base * DENSITY_SCALE[density])
}

export function strokeW(base: number, density: Density): number {
  return Math.max(1, Math.round(base * DENSITY_SCALE[density]))
}
