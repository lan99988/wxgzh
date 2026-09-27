import { useAutoFit } from '../../hooks/useAutoFit'
import { EditorialMotif } from '../EditorialMotif'
import { Lines } from '../Lines'
import './covers.css'

export interface EditorialCoverProps {
  issue?: string
  title: string
  foot?: string
}

// cover-editorial：右上期刊栏 + 左对齐断行大标题 + 底部脚注；横版居中放大
export function EditorialCover({ issue, title, foot }: EditorialCoverProps) {
  const titleRef = useAutoFit<HTMLDivElement>({ field: 'cover-editorial.title' })
  return (
    <div className="card cover-editorial">
      <div className="issue" dangerouslySetInnerHTML={{ __html: issue ?? '' }} />
      <div className="title" ref={titleRef}>
        <Lines text={title} />
      </div>
      <div className="foot" dangerouslySetInnerHTML={{ __html: foot ?? '' }} />
      <EditorialMotif />
    </div>
  )
}
