// 渲染页：解析 hash → 注入 palette CSS 变量 → 挂载对应组件（预览与 Playwright 导出共用）
import { useMemo, type CSSProperties } from 'react'
import { applyPalette, platformTitleWeight } from '../theme/palettes'
import { SIZES } from '../theme/sizes'
import { REGISTRY } from './registry'
import { fieldsToProps } from '../lib/fieldMap'
import { base64UrlToUtf8 } from '../lib/b64'
import { StructureView } from '../svg'
import { ResearchCover } from '../components/covers/ResearchCover'
import '../svg/svg.css'
import type { ResolvedJob, StructureKind, VisualSpec } from '../lib/types'

interface ParsedSpec {
  size: 'cover' | 'card' | '1x1'
  spec: VisualSpec
}
interface Parsed {
  size: 'cover' | 'card' | '1x1'
  job: ResolvedJob
  spec?: VisualSpec
}

function sizeOf(kind?: string): 'cover' | 'card' | '1x1' {
  return kind === 'card' ? 'card' : kind === '1x1' ? '1x1' : 'cover'
}

function parseHash(): Parsed | null {
  const h = window.location.hash.replace(/^#/, '')
  const [path, query = ''] = h.split('?')
  const params = new URLSearchParams(query)

  if (path === 'render') {
    // 规范形态（工作台闭环用）：#render?spec=<base64url(VisualSpec)>&size=cover
    // 直接挂载 ResearchCover 并注入完整 spec（含 typography/layout 编辑），
    // 与工作台 Canvas.tsx 装配一致 —— 截图能反映属性面板的字号/字重修改。
    const specParam = params.get('spec')
    if (specParam) {
      try {
        const spec = JSON.parse(base64UrlToUtf8(specParam)) as VisualSpec
        return { size: sizeOf(params.get('size') ?? undefined), job: {} as ResolvedJob, spec }
      } catch {
        /* fallthrough 到 job 形态 */
      }
    }
    // 主形态：#render?job=<base64url(JSON ResolvedJob)>
    const jobParam = params.get('job')
    if (jobParam) {
      try {
        const job = JSON.parse(base64UrlToUtf8(jobParam)) as ResolvedJob
        const size = sizeOf(job.kind)
        return { size, job }
      } catch {
        /* fallthrough 到简单形态 */
      }
    }
    // 简单形态（预览用，无 fields）：#render?template=…&palette=…&platform=…&size=…
    const template = params.get('template')
    if (template) {
      const sizeParam = params.get('size')
      const size = sizeParam === 'card' ? 'card' : sizeParam === '1x1' ? '1x1' : 'cover'
      return {
        size,
        job: {
          kind: size,
          template: template as ResolvedJob['template'],
          palette: (params.get('palette') || 'warmgray') as ResolvedJob['palette'],
          platform: params.get('platform') === 'xhs' ? 'xhs' : 'gzh',
          background: params.get('bg') === 'color' ? 'color' : 'img',
          padding: params.get('padding') || '6vh 7vw',
          density: (params.get('density') || 'medium') as ResolvedJob['density'],
          fields: {},
        },
      }
    }
  }
  return null
}

export function RenderPage() {
  const parsed = useMemo(parseHash, [])

  if (!parsed) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>invalid render params</div>
  }
  const { size, job, spec } = parsed
  const sizeSpec = SIZES[size]

  // 规范形态：注入完整 VisualSpec（含排版/布局编辑），与工作台 Canvas 装配一致
  if (spec) {
    const vars = {
      ...applyPalette(spec.style.palette, size),
      '--title-weight': platformTitleWeight(spec.style.platform),
    } as CSSProperties
    return (
      <div className="render-root wb-frame" style={vars}>
        <ResearchCover
          spec={spec}
          palette={spec.style.palette}
          platform={spec.style.platform}
          title={spec.content.title ?? ''}
          sub={spec.content.subtitle}
          meta={spec.content.meta}
          num={spec.content.num}
        />
      </div>
    )
  }

  const vars = {
    ...applyPalette(job.palette, size),
    '--title-weight': platformTitleWeight(job.platform),
  } as CSSProperties

  // 结构图独立页：structure-nodegraph/agentloop/framework/timeline
  if (job.template.startsWith('structure-')) {
    const kind = job.template.slice('structure-'.length) as StructureKind
    return (
      <div className="render-root structure-root" style={vars}>
        <StructureView
          kind={kind}
          palette={job.palette}
          density={job.density}
          nodes={job.structure?.nodes ?? []}
          edges={job.structure?.edges}
          title={job.structure?.title}
          viewW={sizeSpec.cssW}
          viewH={sizeSpec.cssH}
        />
      </div>
    )
  }

  const entry = REGISTRY[job.template]
  if (!entry) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>unknown template: {job.template}</div>
  }

  const props = fieldsToProps(job.template, job.fields, job.palette, job.platform)
  const Comp = entry.Comp

  return (
    <div className="render-root" style={vars}>
      <Comp {...props} />
    </div>
  )
}
