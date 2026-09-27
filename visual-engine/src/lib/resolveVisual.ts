// Visual JSON v2 / 旧 render.json → NamedJob（引擎中间形态 + 输出文件名契约）
// 文件名契约与 render_batch.py 一致：cover.png / xhs-cover.png / cover-1x1.png / card-01..NN.png
import type { Density, JobImage, PaletteName, ResolvedJob, TemplateName, VisualJob } from './types'
import { resolveCategory } from '../theme/categoryMap'
import { normalizePaletteName } from '../theme/palettes'
import { DENSITY_STYLE } from '../theme/tokens'

const FALLBACK_PALETTE: PaletteName = 'warmgray'

export interface NamedJob {
  name: string // 'cover' | 'xhs-cover' | 'cover-1x1' | 'card-01' …
  job: ResolvedJob
}

function paletteOf(img: JobImage, fallback: PaletteName): PaletteName {
  return (
    normalizePaletteName(img.visual?.style.palette) ??
    normalizePaletteName(img.palette) ??
    fallback
  )
}

function platformOf(img: JobImage): 'gzh' | 'xhs' {
  return img.visual?.style.platform ?? 'gzh'
}

function densityOf(img: JobImage): Density {
  return img.visual?.visual.density ?? 'medium'
}

function templateOf(img: JobImage, fallback: TemplateName): TemplateName {
  if (img.template) return img.template
  if (img.visual?.visual.structure) {
    const kind = img.visual.visual.structure.kind
    const map: Record<string, TemplateName> = {
      nodegraph: 'structure-nodegraph',
      agentloop: 'structure-agentloop',
      framework: 'structure-framework',
      timeline: 'structure-timeline',
    }
    return map[kind] ?? fallback
  }
  return fallback
}

export function resolveImage(img: JobImage, kind: ResolvedJob['kind'], fallbackPalette: PaletteName): ResolvedJob {
  const spec = resolveCategory(img.visual?.content.category)
  return {
    kind,
    template: templateOf(img, spec.cover),
    palette: paletteOf(img, img.visual?.content.category ? spec.main : fallbackPalette),
    platform: platformOf(img),
    background: 'img',
    padding: DENSITY_STYLE[densityOf(img)].padding,
    density: densityOf(img),
    structure: img.visual?.visual.structure,
    fields: img.fields ?? {},
  }
}

export function resolveVisualJob(job: VisualJob): NamedJob[] {
  const out: NamedJob[] = []
  const batchPalette = job.cover ? paletteOf(job.cover, FALLBACK_PALETTE) : FALLBACK_PALETTE
  if (job.cover) out.push({ name: 'cover', job: resolveImage(job.cover, 'cover', batchPalette) })
  if (job.xhs_cover) out.push({ name: 'xhs-cover', job: resolveImage(job.xhs_cover, 'card', batchPalette) })
  if (job.cover_1x1) out.push({ name: 'cover-1x1', job: resolveImage(job.cover_1x1, '1x1', batchPalette) })
  for (const [i, c] of (job.cards ?? []).entries()) {
    out.push({ name: `card-${String(i + 1).padStart(2, '0')}`, job: resolveImage(c, 'card', batchPalette) })
  }
  return out
}
