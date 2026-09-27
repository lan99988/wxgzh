export interface RenderArgs {
  job?: string
  out?: string
  size?: 'cover' | 'card' | '1x1'
  rebuild: boolean
}

export function parseRenderArgs(argv: string[]): RenderArgs {
  const args: RenderArgs = { rebuild: false }
  const valueFlags: Record<string, 'job' | 'out' | 'size'> = {
    '--job': 'job',
    '--out': 'out',
    '--size': 'size',
  }

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--rebuild') {
      args.rebuild = true
      continue
    }

    const key = valueFlags[flag]
    if (!key) throw new Error(`未知参数: ${flag}`)

    const value = argv[++i]
    if (!value || value.startsWith('--')) throw new Error(`${flag} 缺少参数`)
    if (key === 'size' && !['cover', 'card', '1x1'].includes(value)) {
      throw new Error(`无效尺寸: ${value}`)
    }
    if (key === 'size') args.size = value as RenderArgs['size']
    else args[key] = value
  }

  return args
}
