// 渲染 CLI：经 renderPipeline 把 VisualJob（render.json / visual.json）批量导出为 PNG
// 用法：tsx scripts/render.ts --job <render.json|visual.json> --out <目录> [--size cover|card|1x1] [--rebuild]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { renderJobToPng, disposeRenderPipeline } from '../server/renderPipeline'
import { resolveVisualJob, type NamedJob } from '../src/lib/resolveVisual'
import { parseRenderArgs } from '../src/lib/renderArgs'
import type { VisualJob } from '../src/lib/types'

async function main() {
  const args = parseRenderArgs(process.argv.slice(2))
  if (!args.job || !args.out) {
    console.error('用法: tsx scripts/render.ts --job <file> --out <dir> [--size cover|card|1x1] [--rebuild]')
    process.exit(1)
  }
  const jobFile = resolve(args.job)
  const outDir = resolve(args.out)
  const sizeFilter = args.size
  const rebuild = args.rebuild

  const raw = JSON.parse(readFileSync(jobFile, 'utf-8')) as VisualJob
  const named: NamedJob[] = resolveVisualJob(raw).filter((n) => !sizeFilter || n.job.kind === sizeFilter)

  mkdirSync(outDir, { recursive: true })
  try {
    for (const n of named) {
      const buf = await renderJobToPng(n.job, (n.job.kind === 'card' ? 'card' : n.job.kind === '1x1' ? '1x1' : 'cover') as 'cover' | 'card' | '1x1', rebuild)
      writeFileSync(join(outDir, `${n.name}.png`), buf)
      console.log(`[render] ${n.name}.png (${n.job.template} ${n.job.palette})`)
    }
    console.log(`[render] done. ${named.length} 张 -> ${outDir}`)
  } finally {
    await disposeRenderPipeline()
  }
}

main().catch((err) => {
  console.error('[render] 失败:', err)
  process.exit(1)
})
