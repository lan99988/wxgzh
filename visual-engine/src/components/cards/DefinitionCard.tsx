import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import { Lines, TextLines } from '../Lines'
import './cards.css'

export interface DefinitionCardProps {
  no?: string
  en?: string
  title: string
  sum?: string
}

// card-definition：编号/英文标签 + 定义标题 + 分隔线 + 一句话总结
export function DefinitionCard({ no, en, title, sum }: DefinitionCardProps) {
  const noRef = useAutoFit<HTMLSpanElement>({ field: 'card-definition.no' })
  const enRef = useAutoFit<HTMLSpanElement>({ field: 'card-definition.en' })
  const titleRef = useAutoFit<HTMLDivElement>({ field: 'card-definition.title' })
  const sumRef = useAutoFit<HTMLDivElement>({ field: 'card-definition.sum' })
  return (
    <div className="card card-definition">
      <div className="head">
        <span className="no" ref={noRef}><TextLines text={no ?? ''} /></span>
        <span className="en" ref={enRef}><TextLines text={en ?? ''} /></span>
      </div>
      <div className="body">
        <div className="title" ref={titleRef}>
          <Lines text={title} />
        </div>
        <hr className="rule" />
        <div className="sum" ref={sumRef}><TextLines text={sum ?? ''} /></div>
      </div>
      <EditorialMotif kind="definition" />
    </div>
  )
}
