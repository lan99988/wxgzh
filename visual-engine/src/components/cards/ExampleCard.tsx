import { useAutoFit } from '../../hooks/useAutoFit'
import { TextLines } from '../Lines'
import './cards.css'

export interface ExampleCardProps {
  lab?: string
  code?: string
  note?: string
}

// card-example：深色终端风（lab + 用户输入/输出代码块 + 底部提示）
export function ExampleCard({ lab, code, note }: ExampleCardProps) {
  const labRef = useAutoFit<HTMLDivElement>({ field: 'card-example.lab' })
  const codeRef = useAutoFit<HTMLDivElement>()
  const noteRef = useAutoFit<HTMLDivElement>({ field: 'card-example.note' })
  return (
    <div className="card card-example">
      <div className="lab" ref={labRef}><TextLines text={lab ?? ''} /></div>
      <div className="code" ref={codeRef} dangerouslySetInnerHTML={{ __html: code ?? '' }} />
      <div>
        <hr className="rule" />
        <div className="note" ref={noteRef} style={{ marginTop: '1.5vh' }}>
          <TextLines text={note ?? ''} />
        </div>
      </div>
    </div>
  )
}
