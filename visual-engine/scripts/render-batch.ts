// Batch renderer for legacy render.json files. Keeps the existing output-name contract.
// Usage: tsx scripts/render-batch.ts --batch <dir> [--only NN] [--out-root <dir>|--temp] [--size cover|card|1x1] [--rebuild]
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { disposeRenderPipeline, renderJobToPng } from '../server/renderPipeline'
import { resolveVisualJob, type NamedJob } from '../src/lib/resolveVisual'
import type { VisualJob } from '../src/lib/types'

type SizeKey = 'cover' | 'card' | '1x1'
type BatchOptions = {
  batch?: string
  job?: string
  only?: string
  out?: string
  outRoot?: string
  temp?: boolean
  size?: SizeKey
  rebuild?: boolean
  help?: boolean
}

function parseArgs(argv: string[]): BatchOptions {
  const args: BatchOptions = {}
  const valueFlags: Record<string, keyof BatchOptions> = {
    '--batch': 'batch', '--job': 'job', '--only': 'only', '--out': 'out',
    '--out-root': 'outRoot', '--size': 'size',
  }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--help' || flag === '-h') args.help = true
    else if (flag === '--temp') args.temp = true
    else if (flag === '--rebuild') args.rebuild = true
    else if (flag in valueFlags) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`${flag} 缺少参数`)
      ;(args as Record<string, unknown>)[valueFlags[flag]] = value
    } else {
      throw new Error(`未知参数: ${flag}`)
    }
  }
  return args
}

function discoverRenderJson(batchDir: string): string[] {
  const found: string[] = []
  const ignored = new Set(['node_modules', '.git', 'imgs', '.wb-dist', 'dist', 'render'])
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) walk(join(dir, entry.name))
      } else if (entry.isFile() && entry.name.toLowerCase() === 'render.json') {
        found.push(join(dir, entry.name))
      }
    }
  }
  walk(batchDir)
  return found.sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

function selectOnly(files: string[], batchDir: string, only?: string): string[] {
  if (!only) return files
  const needle = only.replace(/[\\/]+/g, sep).trim().toLowerCase()
  const numericPrefix = /^\d{1,2}$/.test(needle) ? `${needle.padStart(2, '0')}-` : undefined
  return files.filter((file) => {
    const articleDir = relative(batchDir, dirname(file))
    const segments = articleDir.split(sep).map((part) => part.toLowerCase())
    return segments.includes(needle) ||
      (numericPrefix ? segments.some((part) => part.startsWith(numericPrefix)) : false) ||
      articleDir.toLowerCase() === needle ||
      basename(dirname(file)).toLowerCase() === needle
  })
}

function outputDirectory(file: string, batchDir: string | undefined, outRoot: string | undefined, explicitOut: string | undefined): string {
  if (explicitOut) return resolve(explicitOut)
  if (outRoot && batchDir) {
    const rel = relative(batchDir, dirname(file))
    return resolve(outRoot, basename(batchDir), rel === '.' ? '' : rel, 'imgs')
  }
  if (outRoot) return resolve(outRoot, 'imgs')
  return join(dirname(file), 'imgs')
}

async function renderFile(file: string, options: BatchOptions, batchDir: string | undefined, outRoot: string | undefined) {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as VisualJob
  const named: NamedJob[] = resolveVisualJob(raw).filter((item) => !options.size || item.job.kind === options.size)
  if (!named.length) throw new Error(`${file} 没有匹配 ${options.size ?? '全部'} 尺寸的图片任务`)
  const outDir = outputDirectory(file, batchDir, outRoot, options.out)
  mkdirSync(outDir, { recursive: true })
  const failures: string[] = []
  for (const item of named) {
    try {
      const size = item.job.kind === '1x1' ? '1x1' : item.job.kind === 'card' ? 'card' : 'cover'
      const png = await renderJobToPng(item.job, size, options.rebuild)
      const outFile = join(outDir, `${item.name}.png`)
      const staged = `${outFile}.rendering.png`
      writeFileSync(staged, png)
      renameSync(staged, outFile)
      console.log(`[render-batch] ${outFile} (${item.job.template} ${item.job.palette})`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${item.name}: ${message}`)
      console.error(`[render-batch] 失败 ${item.name}: ${message}`)
    }
  }
  return { count: named.length, failures }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('用法: tsx scripts/render-batch.ts --batch <dir> [--only NN] [--out-root <dir>|--temp] [--size cover|card|1x1] [--rebuild]')
    return
  }
  if (options.temp && options.outRoot) throw new Error('--temp 与 --out-root 不能同时使用')
  if (options.out && (options.batch || options.outRoot || options.temp)) throw new Error('--out 仅用于单篇 --job 模式')
  if (options.size && !['cover', 'card', '1x1'].includes(options.size)) throw new Error(`无效尺寸: ${options.size}`)
  if (!!options.batch === !!options.job) throw new Error('必须且只能指定 --batch <dir> 或 --job <render.json>')

  const batchDir = options.batch ? resolve(options.batch) : undefined
  const jobFile = options.job ? resolve(options.job) : undefined
  if (batchDir && !existsSync(batchDir)) throw new Error(`批次目录不存在: ${batchDir}`)
  if (jobFile && !existsSync(jobFile)) throw new Error(`render.json 不存在: ${jobFile}`)

  const outRoot = options.temp
    ? mkdtempSync(join(tmpdir(), 'visual-engine-render-'))
    : options.outRoot ? resolve(options.outRoot) : undefined
  if (outRoot) console.log(`[render-batch] out-root=${outRoot}`)

  const files = jobFile ? [jobFile] : selectOnly(discoverRenderJson(batchDir!), batchDir!, options.only)
  if (!files.length) {
    const found = jobFile ? files : discoverRenderJson(batchDir!)
    if (options.only && found.length) throw new Error(`批次中找不到 --only ${options.only} 对应的 render.json`)
    throw new Error(`目录中找不到 render.json: ${batchDir}`)
  }

  let imageCount = 0
  const failures: string[] = []
  for (const file of files) {
    const result = await renderFile(file, options, batchDir, outRoot)
    imageCount += result.count
    failures.push(...result.failures.map((failure) => `${relative(batchDir ?? dirname(file), dirname(file))}: ${failure}`))
  }
  console.log(`[render-batch] 完成：${files.length} 篇，处理 ${imageCount} 张图片，失败 ${failures.length} 张`)
  if (failures.length) throw new Error(failures.join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(async (err) => {
    console.error('[render-batch] 失败:', err instanceof Error ? err.message : err)
    await disposeRenderPipeline()
    process.exitCode = 1
  }).finally(() => disposeRenderPipeline())
}
