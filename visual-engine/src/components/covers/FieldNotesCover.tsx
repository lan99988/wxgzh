import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import './covers.css'

export interface FieldNotesCoverProps {
  num?: string
  body?: string
  flow?: string
  obs?: string
}

// cover-fieldnotes：编号 + 正文(可含 .hl/.flow 结构) + 底部观察框
export function FieldNotesCover({ num, body, flow, obs }: FieldNotesCoverProps) {
  const numRef = useAutoFit<HTMLDivElement>({ field: 'cover-fieldnotes.num' })
  const bodyRef = useAutoFit<HTMLDivElement>({ field: 'cover-fieldnotes.body' })
  const flowRef = useAutoFit<HTMLDivElement>({ field: 'cover-fieldnotes.flow' })
  const obsRef = useAutoFit<HTMLDivElement>({ field: 'cover-fieldnotes.obs' })
  return (
    <div className="card cover-fieldnotes">
      <div className="num" ref={numRef}>{num ?? ''}</div>
      <div className="body" ref={bodyRef}>
        <div dangerouslySetInnerHTML={{ __html: body ?? '' }} />
        {flow && <div className="flow" ref={flowRef} dangerouslySetInnerHTML={{ __html: flow }} />}
      </div>
      <div className="obs" ref={obsRef}>{obs ?? ''}</div>
      <EditorialMotif kind="flow" />
    </div>
  )
}
