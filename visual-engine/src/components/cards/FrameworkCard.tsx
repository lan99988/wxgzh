import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import './cards.css'

export interface FrameworkCardProps {
  name?: string
  items?: string
  sum?: string
}

// card-framework：框架名 + items 列表（编号/key/desc，由调用方传 HTML）
export function FrameworkCard({ name, items, sum }: FrameworkCardProps) {
  const nameRef = useAutoFit<HTMLDivElement>({ field: 'card-framework.name' })
  const itemsRef = useAutoFit<HTMLDivElement>({ field: 'card-framework.items' })
  const sumRef = useAutoFit<HTMLDivElement>({ field: 'card-framework.sum' })
  return (
    <div className="card card-framework">
      <div className="name" ref={nameRef}>{name ?? ''}</div>
      <div className="items" ref={itemsRef} dangerouslySetInnerHTML={{ __html: items ?? '' }} />
      <div>
        <hr className="rule" />
        <div className="sum" ref={sumRef}>{sum ?? ''}</div>
      </div>
      <EditorialMotif kind="framework" />
    </div>
  )
}
