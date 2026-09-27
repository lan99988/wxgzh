// 5 套纯色调色板令牌；不加载个人纹理底图或外部图片资源。
import type { PaletteName, Platform } from '../lib/types'

export interface PaletteTokens {
  paperColor: string
  ink: string
  ink2: string
  accent: string
  accent2: string
  bgDark: string
  termGreen: string
  termGray: string
}

export const PALETTE_NAMES: PaletteName[] = ['warmgray', 'inkblack', 'terracotta', 'mistblue', 'sage']

export const PALETTE_ALIAS_ZH: Record<PaletteName, string> = {
  warmgray: '暖灰',
  inkblack: '深黑',
  terracotta: '陶土橙',
  mistblue: '雾霾蓝',
  sage: '鼠尾草绿',
}

// 旧 render.json 里 palette 可能是中文名/hex，统一归一化
export function normalizePaletteName(input?: string): PaletteName | undefined {
  if (!input) return undefined
  const v = input.trim()
  if ((PALETTE_NAMES as string[]).includes(v)) return v as PaletteName
  for (const [alias, zh] of Object.entries(PALETTE_ALIAS_ZH)) {
    if (v === zh) return alias as PaletteName
  }
  const hexMap: Record<string, PaletteName> = {
    'D8D5CF': 'warmgray', '1A1A1A': 'inkblack', 'D97757': 'terracotta', '8FA9C7': 'mistblue', 'B8C9B8': 'sage',
  }
  const hex = v.replace(/^#/, '').toUpperCase()
  return hexMap[hex]
}

export const PALETTES: Record<PaletteName, PaletteTokens> = {
  warmgray: {
    paperColor: '#D8D5CF', ink: '#1A1A1A', ink2: '#1A1A1A',
    accent: '#CD6F47', accent2: '#CD6F47', bgDark: '#D8D5CF',
    termGreen: '#1A1A1A', termGray: '#1A1A1A',
  },
  inkblack: {
    paperColor: '#1A1A1A', ink: '#EFEAE0', ink2: '#8FA9C7',
    accent: '#CD6F47', accent2: '#CD6F47', bgDark: '#1A1A1A',
    termGreen: '#6B8A6F', termGray: '#8FA9C7',
  },
  terracotta: {
    paperColor: '#D97757', ink: '#1A1A1A', ink2: '#1A1A1A',
    accent: '#EFEAE0', accent2: '#EFEAE0', bgDark: '#D97757',
    termGreen: '#1A1A1A', termGray: '#EFEAE0',
  },
  mistblue: {
    paperColor: '#8FA9C7', ink: '#1A1A1A', ink2: '#1A1A1A',
    accent: '#EFEAE0', accent2: '#EFEAE0', bgDark: '#8FA9C7',
    termGreen: '#1A1A1A', termGray: '#EFEAE0',
  },
  sage: {
    paperColor: '#B8C9B8', ink: '#1A1A1A', ink2: '#1A1A1A',
    accent: '#EFEAE0', accent2: '#EFEAE0', bgDark: '#B8C9B8',
    termGreen: '#1A1A1A', termGray: '#EFEAE0',
  },
}

// 把调色板摊成 CSS 变量；背景由 --paper-color 纯色填充。
export function applyPalette(palette: PaletteName, _kind: 'cover' | 'card' | '1x1'): Record<string, string> {
  const t = PALETTES[palette]
  return {
    '--paper-color': t.paperColor,
    '--ink': t.ink,
    '--ink-2': t.ink2,
    '--accent': t.accent,
    '--accent-2': t.accent2,
    '--bg-dark': t.bgDark,
    '--term-green': t.termGreen,
    '--term-gray': t.termGray,
  }
}

export function platformTitleWeight(platform: Platform): string {
  return platform === 'xhs' ? '700' : '600'
}

// 9 色集合（SVG 颜色断言用：所有 fill/stroke 必须 ∈ 此集合）
export function paletteColorSet(palette: PaletteName): string[] {
  const t = PALETTES[palette]
  return [t.paperColor, t.ink, t.ink2, t.accent, t.accent2, t.bgDark, t.termGreen, t.termGray]
}
