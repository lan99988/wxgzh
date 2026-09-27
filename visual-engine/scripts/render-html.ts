// Existing HTML template renderer: Playwright waits for fonts/layout before 2x capture.
// Usage: tsx scripts/render-html.ts --html <file> --out <png> --size cover|card|1x1
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { disposeRenderPipeline, renderHtmlToPng } from '../server/renderPipeline'

type SizeKey = 'cover' | 'card' | '1x1'

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') args.help = 'true'
    else if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1] ?? ''
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help === 'true') {
    console.log('用法: tsx scripts/render-html.ts --html <file> --out <png> --size cover|card|1x1')
    return
  }
  if (!args.html || !args.out) throw new Error('用法: tsx scripts/render-html.ts --html <file> --out <png> --size cover|card|1x1')
  const size = (args.size || 'cover') as SizeKey
  if (!['cover', 'card', '1x1'].includes(size)) throw new Error(`无效尺寸: ${size}`)
  const htmlFile = resolve(args.html)
  if (!existsSync(htmlFile)) throw new Error(`HTML 文件不存在: ${htmlFile}`)
  const outPath = resolve(args.out)
  await renderHtmlToPng(htmlFile, outPath, size)
  console.log(`[render-html] ${outPath} (${size})`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(async (err) => {
    console.error('[render-html] 失败:', err instanceof Error ? err.message : err)
    await disposeRenderPipeline()
    process.exitCode = 1
  }).finally(() => disposeRenderPipeline())
}
