// 渲染尺寸契约（@2x 输出，与 render_batch.py SIZES 一致）
export interface SizeSpec {
  cssW: number
  cssH: number
  outW: number
  outH: number
  ratio: string
}

export const SIZES: Record<'cover' | 'card' | '1x1', SizeSpec> = {
  cover: { cssW: 1024, cssH: 440, outW: 2048, outH: 880, ratio: '2.35:1' },
  card: { cssW: 621, cssH: 828, outW: 1242, outH: 1656, ratio: '3:4' },
  '1x1': { cssW: 1024, cssH: 1024, outW: 2048, outH: 2048, ratio: '1:1' },
}
