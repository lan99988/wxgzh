import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import { TextLines } from '../Lines'
import './cards.css'

export interface ChecklistCardProps {
  title?: string
  items?: string
  tip?: string
}

// card-checklist：标题 + 勾选清单（.item>.box+文本）+ 底部提示
export function ChecklistCard({ title, items, tip }: ChecklistCardProps) {
  const titleRef = useAutoFit<HTMLDivElement>({ field: 'card-checklist.title' })
  const itemsRef = useAutoFit<HTMLDivElement>({ field: 'card-checklist.items' })
  const tipRef = useAutoFit<HTMLDivElement>({ field: 'card-checklist.tip' })
  return (
    <div className="card card-checklist">
      <div className="title" ref={titleRef}><TextLines text={title ?? ''} /></div>
      <div className="items" ref={itemsRef} dangerouslySetInnerHTML={{ __html: items ?? '' }} />
      <div className="tip" ref={tipRef}><TextLines text={tip ?? ''} /></div>
      <EditorialMotif kind="checklist" />
    </div>
  )
}
