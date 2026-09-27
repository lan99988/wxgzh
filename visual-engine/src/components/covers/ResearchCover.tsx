// ResearchCover — cover-research（可编辑版：优先从 VisualSpec.style 注入排版/布局/SVG，兼容旧 props）
import { useAutoFit } from '../../hooks/useAutoFit'
import type { PaletteName, Platform, VisualSpec } from '../../lib/types'
import './research.css'

export interface ResearchCoverProps {
  num?: string
  title: string
  sub?: string
  meta?: string
  palette: PaletteName
  platform: Platform
  padding?: string
  // 工作台注入：完整 VisualSpec，覆盖上面的排版/布局
  spec?: VisualSpec
}

export function ResearchCover({ num, title, sub, meta, palette, platform, padding, spec }: ResearchCoverProps) {
  const titleRef = useAutoFit<HTMLDivElement>({ field: 'cover-research.title' })
  const subRef = useAutoFit<HTMLDivElement>({ field: 'cover-research.subtitle' })
  const lines = (title ?? '').split('\n')

  // 从 spec 解析可编辑排版（缺省回退到 props/CSS）
  const tTitle = spec?.style?.typography?.title
  const tSub = spec?.style?.typography?.subtitle
  const tMeta = spec?.style?.typography?.meta
  const layout = spec?.style?.layout
  const content = spec?.content

  const titleStyle: React.CSSProperties = {
    fontSize: tTitle?.fontSize ? `${tTitle.fontSize}px` : undefined,
    lineHeight: tTitle?.lineHeight,
    fontWeight: tTitle?.fontWeight,
    letterSpacing: tTitle?.letterSpacing !== undefined ? `${tTitle.letterSpacing}em` : undefined,
    textAlign: tTitle?.alignment ?? 'center',
  }
  const bodyStyle: React.CSSProperties = {
    maxWidth: layout?.width ? `${layout.width}px` : (tTitle?.maxWidth ? `${tTitle.maxWidth}px` : undefined),
  }
  const rootStyle: React.CSSProperties = {
    padding: layout?.padding ? `${layout.padding}px` : (padding ? padding : undefined),
  }
  const subStyle: React.CSSProperties = {
    fontSize: tSub?.fontSize ? `${tSub.fontSize}px` : undefined,
    lineHeight: tSub?.lineHeight,
    fontWeight: tSub?.fontWeight,
    letterSpacing: tSub?.letterSpacing !== undefined ? `${tSub.letterSpacing}em` : undefined,
    textAlign: tSub?.alignment ?? 'center',
  }
  const metaStyle: React.CSSProperties = {
    fontSize: tMeta?.fontSize ? `${tMeta.fontSize}px` : undefined,
    fontWeight: tMeta?.fontWeight,
    letterSpacing: tMeta?.letterSpacing !== undefined ? `${tMeta.letterSpacing}em` : undefined,
    textAlign: tMeta?.alignment ?? 'center',
  }

  return (
    <div className="card cover-research" style={rootStyle}>
      <div className="meta" style={metaStyle}>
        <span>{content?.num ?? num ?? ''}</span>
        <span>{content?.meta ?? meta ?? ''}</span>
      </div>
      <div className="body" style={bodyStyle}>
        <div className="title" ref={titleRef} style={titleStyle}>
          {lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </div>
        <hr className="rule" />
        <div className="sub" ref={subRef} style={subStyle}>{content?.subtitle ?? sub ?? ''}</div>
      </div>
    </div>
  )
}
