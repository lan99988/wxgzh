import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import './cards.css'

export interface BeforeAfterCardProps {
  before?: string
  after?: string
  sum?: string
}

// card-beforeafter：BEFORE ↓ AFTER 对比 + 总结
export function BeforeAfterCard({ before, after, sum }: BeforeAfterCardProps) {
  const beforeRef = useAutoFit<HTMLDivElement>()
  const afterRef = useAutoFit<HTMLDivElement>()
  const sumRef = useAutoFit<HTMLDivElement>({ field: 'card-beforeafter.sum' })
  return (
    <div className="card card-beforeafter">
      <div className="body">
        <div className="before" ref={beforeRef} dangerouslySetInnerHTML={{ __html: before ?? '' }} />
        <div className="arrow">↓</div>
        <div className="after" ref={afterRef} dangerouslySetInnerHTML={{ __html: after ?? '' }} />
        <hr className="rule" />
        <div className="sum" ref={sumRef}>{sum ?? ''}</div>
      </div>
      <EditorialMotif kind="flow" />
    </div>
  )
}
