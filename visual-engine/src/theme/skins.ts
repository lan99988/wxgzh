// 5 正文皮肤映射（正文排版皮肤，为 Phase 4/5 联动预留）
export type SkinName = 'research_paper' | 'field_notes' | 'workflow_blue' | 'system_dark' | 'editorial_orange'

export const SKINS: Record<SkinName, { palette: string; cover: string }> = {
  research_paper: { palette: 'warmgray', cover: 'cover-research' },
  field_notes: { palette: 'sage', cover: 'cover-fieldnotes' },
  workflow_blue: { palette: 'mistblue', cover: 'cover-research' },
  system_dark: { palette: 'inkblack', cover: 'cover-system' },
  editorial_orange: { palette: 'terracotta', cover: 'cover-editorial' },
}
