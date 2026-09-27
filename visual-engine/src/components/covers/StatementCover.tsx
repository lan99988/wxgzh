import { useAutoFit } from '../../hooks/useAutoFit'
import { Lines } from '../Lines'
import './covers.css'

export interface StatementCoverProps {
  stmt: string
  foot?: string
}

// cover-statement：金句大字 + 底部双栏脚注
export function StatementCover({ stmt, foot }: StatementCoverProps) {
  const stmtRef = useAutoFit<HTMLDivElement>()
  const footRef = useAutoFit<HTMLDivElement>({ field: 'cover-statement.foot' })
  return (
    <div className="card cover-statement">
      <div className="stmt" ref={stmtRef}>
        <Lines text={stmt} />
      </div>
      <div className="foot" ref={footRef} dangerouslySetInnerHTML={{ __html: foot ?? '' }} />
    </div>
  )
}
