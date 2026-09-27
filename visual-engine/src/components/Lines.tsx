// 多行文本渲染：\n → <br>（复刻 render_batch.py 的 lines 语义）
export function TextLines({ text }: { text: string }) {
  const parts = text.split(/\r\n?|\n/)
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

export const Lines = TextLines
