// 模板/结构 → React 组件注册表（structure-* 由 RenderPage 单独分发，不入此表）
import type { ComponentType } from 'react'
import type { TemplateName } from '../lib/types'
import { ResearchCover } from '../components/covers/ResearchCover'
import { EditorialCover } from '../components/covers/EditorialCover'
import { FieldNotesCover } from '../components/covers/FieldNotesCover'
import { SystemCover } from '../components/covers/SystemCover'
import { StatementCover } from '../components/covers/StatementCover'
import { DefinitionCard } from '../components/cards/DefinitionCard'
import { BeforeAfterCard } from '../components/cards/BeforeAfterCard'
import { FrameworkCard } from '../components/cards/FrameworkCard'
import { ChecklistCard } from '../components/cards/ChecklistCard'
import { ExampleCard } from '../components/cards/ExampleCard'
import { StatementCard } from '../components/cards/StatementCard'

export interface RegistryEntry {
  kind: 'cover' | 'card'
  Comp: ComponentType<any>
}

export const REGISTRY: Partial<Record<TemplateName, RegistryEntry>> = {
  'cover-research': { kind: 'cover', Comp: ResearchCover },
  'cover-editorial': { kind: 'cover', Comp: EditorialCover },
  'cover-fieldnotes': { kind: 'cover', Comp: FieldNotesCover },
  'cover-system': { kind: 'cover', Comp: SystemCover },
  'cover-statement': { kind: 'cover', Comp: StatementCover },
  'card-definition': { kind: 'card', Comp: DefinitionCard },
  'card-beforeafter': { kind: 'card', Comp: BeforeAfterCard },
  'card-framework': { kind: 'card', Comp: FrameworkCard },
  'card-checklist': { kind: 'card', Comp: ChecklistCard },
  'card-example': { kind: 'card', Comp: ExampleCard },
  'card-statement': { kind: 'card', Comp: StatementCard },
}
