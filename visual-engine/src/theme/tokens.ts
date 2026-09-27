// 全局令牌：平台字重 + 密度→padding/字号缩放（供 density 覆盖）
import type { Density, Platform } from '../lib/types'

export const PLATFORM_WEIGHT: Record<Platform, string> = { gzh: '600', xhs: '700' }

export const DENSITY_STYLE: Record<Density, { padding: string; scale: number }> = {
  sparse: { padding: '10vh 10vw', scale: 1.0 },
  medium: { padding: '6vh 7vw', scale: 1.0 },
  dense: { padding: '4vh 5vw', scale: 0.85 },
}
