// 渲染管线（Node 侧，Playwright）：把 VisualSpec / ResolvedJob 经已构建的 SPA
// （#render 路由）渲染成 PNG。等价于 doop 的「set_frame_html → get_frame_screenshot」
// 推拉范式，但用本地 React + Playwright 执行，不部署 doop 服务。
//
// 设计要点：
// - 复用 vite build + vite preview 单例（4173）。outDir 用 .wb-dist 而非 dist，
//   以避开 WorkBuddy safe-delete shim 对 dist emptyDir 的拦截。
// - 浏览器实例常驻复用，跨多次截图请求共享。
import { chromium, type Browser } from 'playwright'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SIZES } from '../src/theme/sizes'
import { utf8ToBase64Url } from '../src/lib/b64'
import type { VisualSpec, ResolvedJob } from '../src/lib/types'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = '.wb-dist' // 避开 dist 的 emptyDir 拦截
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`

let previewStop: (() => Promise<void>) | null = null
let browser: Browser | null = null

type SizeKey = 'cover' | 'card' | '1x1'

async function ensureBrowser(): Promise<Browser> {
  if (!browser) browser = await chromium.launch({ headless: true })
  return browser
}

async function waitForRenderReady(page: import('playwright').Page, waitForRoot = false): Promise<void> {
  if (waitForRoot) {
    await page.waitForSelector('.render-root, .structure-root', { state: 'attached', timeout: 15_000 })
  }
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready
  })
  if (!waitForRoot) {
    await page.waitForFunction(() => {
      const root = document.documentElement
      return root.dataset.renderReady === '1' || !!root.dataset.renderError
    }, null, { timeout: 15_000 })
    const renderError = await page.locator('html').getAttribute('data-render-error')
    if (renderError) throw new Error(`HTML 排版适配失败：${renderError}`)
  }
  await page.waitForFunction(() => {
    const fitFields = [...document.querySelectorAll<HTMLElement>('[data-fit-field]')]
    return fitFields.every((el) => el.dataset.fitDone === '1' && !el.dataset.fitPending)
  }, null, { timeout: 15_000 })
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  const overflowFields = await page.locator('[data-fit-overflow="1"]').evaluateAll((els) =>
    els.map((el) => {
      const htmlEl = el as HTMLElement
      const field = htmlEl.dataset.fitField || htmlEl.className || htmlEl.tagName.toLowerCase()
      const size = htmlEl.dataset.fitEnd ? `（已缩至 ${htmlEl.dataset.fitEnd}px）` : ''
      const bounds = htmlEl.dataset.fitMeasured ? ` [${htmlEl.dataset.fitMeasured}]` : ''
      const debug = htmlEl.dataset.fitDebug ? ` {${htmlEl.dataset.fitDebug}}` : ''
      return `${field}${size}${bounds}${debug}`
    }),
  )
  if (overflowFields.length) {
    throw new Error(`Text overflow: 文字在最多 15% 缩放后仍溢出，请精简以下字段：${overflowFields.join('、')}`)
  }
}

async function warnUnavailableFonts(page: import('playwright').Page): Promise<void> {
  const failedFonts = await page.evaluate(() =>
    Array.from(document.fonts)
      .filter((font) => font.status === 'error')
      .map((font) => font.family.replace(/^['"]|['"]$/g, '')),
  )
  if (failedFonts.length) {
    console.warn(`[render] 字体加载失败，已回退到系统字体：${[...new Set(failedFonts)].join('、')}`)
  }
}

async function ensureBuilt(force: boolean) {
  const outIndex = join(ROOT, OUT, 'index.html')
  const stale = force || !existsSync(outIndex)
  if (!stale) return
  console.log(`[render] ${OUT} 缺失/强制，执行 vite build …`)
  const { build } = await import('vite')
  await build({ root: ROOT, build: { outDir: OUT, emptyOutDir: false }, logLevel: 'warn' })
}

async function ensurePreview(forceBuild = false): Promise<void> {
  if (previewStop) return
  await ensureBuilt(forceBuild)
  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(PORT), '--host', '127.0.0.1', '--strictPort', '--outDir', OUT],
    { cwd: ROOT, stdio: 'ignore' },
  )
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE + '/')
      if (res.ok) {
        previewStop = async () => { child.kill() }
        return
      }
    } catch {
      /* 未就绪，重试 */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  child.kill()
  throw new Error('vite preview 启动失败（端口 4173 未就绪）')
}

async function withPage<T>(size: SizeKey, url: string, fn: (page: import('playwright').Page, cssW: number, cssH: number) => Promise<T>): Promise<T> {
  const currentBrowser = await ensureBrowser()
  const spec = SIZES[size]
  const ctx = await currentBrowser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: spec.cssW, height: spec.cssH },
  })
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    await waitForRenderReady(page, true)
    await warnUnavailableFonts(page)
    return await fn(page, spec.cssW, spec.cssH)
  } finally {
    await ctx.close()
  }
}

async function capture(page: import('playwright').Page, cssW: number, cssH: number): Promise<Buffer> {
  // CDP 直接捕获：clip.scale=2 显式输出 2x，绕过 deviceScaleFactor 模拟的兼容问题
  const cdp = await page.context().newCDPSession(page)
  const { data } = (await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: cssW, height: cssH, scale: 2 },
    captureBeyondViewport: false,
  })) as { data: string }
  return Buffer.from(data, 'base64')
}

/** 渲染完整 VisualSpec（含 typography/layout 编辑）→ PNG Buffer。 */
export async function renderSpecToPng(spec: VisualSpec, size: SizeKey = 'cover', rebuild = false): Promise<Buffer> {
  await ensurePreview(rebuild)
  const payload = utf8ToBase64Url(JSON.stringify(spec))
  const url = `${BASE}/#render?spec=${payload}&size=${size}`
  return withPage(size, url, capture)
}

/** 渲染旧式 ResolvedJob（fields 形态）→ PNG Buffer。供 render.ts CLI 复用。 */
export async function renderJobToPng(job: ResolvedJob, size: SizeKey = 'cover', rebuild = false): Promise<Buffer> {
  await ensurePreview(rebuild)
  const payload = utf8ToBase64Url(JSON.stringify(job))
  const url = `${BASE}/#render?job=${payload}`
  return withPage(size, url, capture)
}

/** Render an existing standalone HTML template with the same font/fit checks and 2x size contract. */
export async function renderHtmlToPng(htmlFile: string, outPath: string, size: SizeKey = 'cover'): Promise<void> {
  const spec = SIZES[size]
  const currentBrowser = await ensureBrowser()
  const ctx = await currentBrowser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: spec.cssW, height: spec.cssH },
  })
  const page = await ctx.newPage()
  try {
    await page.goto(pathToFileURL(resolve(htmlFile)).href, { waitUntil: 'load' })
    await waitForRenderReady(page)
    await warnUnavailableFonts(page)
    const png = await capture(page, spec.cssW, spec.cssH)
    mkdirSync(dirname(resolve(outPath)), { recursive: true })
    writeFileSync(resolve(outPath), png)
  } finally {
    await ctx.close()
  }
}

/** 仅供脚本显式关闭（一般随进程退出自动回收）。 */
export async function disposeRenderPipeline(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {})
    browser = null
  }
  if (previewStop) {
    await previewStop()
    previewStop = null
  }
}

export { BASE as RENDER_BASE, OUT as RENDER_OUT }
