import { useAutoFit } from '../../hooks/useAutoFit'
import { Lines } from '../Lines'
import './cards.css'

export interface StatementCardProps {
  stmt: string
  foot?: string
}

// card-statement：金句卡（比 cover-statement 字号小，3:4 竖版）
export function StatementCard({ stmt, foot }: StatementCardProps) {
  const stmtRef = useAutoFit<HTMLDivElement>()
  const footRef = useAutoFit<HTMLDivElement>({ field: 'card-statement.foot' })
  return (
    <div className="card card-statement">
      <div className="stmt" ref={stmtRef}>
        <Lines text={stmt} />
      </div>
      <div className="foot" ref={footRef} dangerouslySetInnerHTML={{ __html: foot ?? '' }} />
    </div>
  )
}
