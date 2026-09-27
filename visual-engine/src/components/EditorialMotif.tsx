import './editorial-motif.css'

export type MotifKind = 'editorial' | 'definition' | 'framework' | 'checklist' | 'flow'

/** Small token-colored line art that adds a visual anchor without competing with copy. */
export function EditorialMotif({ kind = 'editorial' }: { kind?: MotifKind }) {
  return (
    <svg className={`editorial-motif editorial-motif--${kind}`} viewBox="0 0 180 240" fill="none" aria-hidden="true">
      <g className="editorial-motif__lines">
        <path d="M90 20v200M30 60h120M42 180h96" />
        <path d="M48 60c0 24 18 42 42 42s42-18 42-42M48 180c0-24 18-42 42-42s42 18 42 42" />
      </g>
      <g className="editorial-motif__nodes">
        <circle cx="90" cy="20" r="8" />
        <circle cx="30" cy="60" r="8" />
        <circle cx="150" cy="60" r="8" />
        <circle cx="90" cy="102" r="11" />
        <circle cx="48" cy="180" r="8" />
        <circle cx="132" cy="180" r="8" />
        <circle cx="90" cy="220" r="8" />
      </g>
      <path className="editorial-motif__accent" d="M90 91v22M79 102h22" />
    </svg>
  )
}
