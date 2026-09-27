import { useAutoFit } from '../../hooks/useAutoFit'
import { Lines } from '../Lines'
import './covers.css'

export interface SystemCoverProps {
  top?: string
  title: string
  io?: string
}

// cover-system：深色终端风（top 状态栏 + 大标题 + INPUT↓OUTPUT 块）
export function SystemCover({ top, title, io }: SystemCoverProps) {
  const topRef = useAutoFit<HTMLDivElement>({ field: 'cover-system.top' })
  const titleRef = useAutoFit<HTMLDivElement>({ field: 'cover-system.title' })
  const ioRef = useAutoFit<HTMLDivElement>({ field: 'cover-system.io' })
  return (
    <div className="card cover-system">
      <div className="top" ref={topRef} dangerouslySetInnerHTML={{ __html: top ?? '' }} />
      <div className="title" ref={titleRef}>
        <Lines text={title} />
      </div>
      <div className="io" ref={ioRef} dangerouslySetInnerHTML={{ __html: io ?? '' }} />
    </div>
  )
}
