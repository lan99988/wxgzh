// React 版 _fit.js：只缩不放、0.5px 步进、≤60 次、下限 max(minPx, 初始×minRatio)
// 元素溢出父容器时缩小字号；完成后打 data-fit-done 供导出端等待
import { useLayoutEffect, useRef } from 'react'

export interface AutoFitOptions {
  minRatio?: number
  step?: number
  field?: string
}

export interface FitResult {
  fontSize: number
  fits: boolean
}

function textOverflowsBounds(root: HTMLElement): boolean {
  const bounds = root.getBoundingClientRect()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (!node.textContent?.trim()) continue
    let ancestor = node.parentElement
    let belongsToNestedFit = false
    while (ancestor && ancestor !== root) {
      if (ancestor.hasAttribute('data-fit-field')) {
        belongsToNestedFit = true
        break
      }
      ancestor = ancestor.parentElement
    }
    if (belongsToNestedFit) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = range.getClientRects()
    for (let index = 0; index < rects.length; index++) {
      const rect = rects[index]
      if (rect.width === 0 && rect.height === 0) continue
      if (rect.left < bounds.left - 4 || rect.top < bounds.top - 4 ||
          rect.right > bounds.right + 4 || rect.bottom > bounds.bottom + 4) return true
    }
  }
  return false
}

/** Find the largest fitting font size while enforcing a hard lower ratio. */
export function fitFontSize(
  initialFontSize: number,
  fitsAtSize: (fontSize: number) => boolean,
  minRatio = 0.85,
  step = 0.5,
): FitResult {
  const initial = Math.max(1, initialFontSize)
  const minimum = initial * Math.min(1, Math.max(0.01, minRatio))
  if (fitsAtSize(initial)) return { fontSize: initial, fits: true }

  let size = initial
  while (size - step > minimum) {
    size = Math.max(minimum, size - step)
    if (fitsAtSize(size)) return { fontSize: size, fits: true }
  }
  if (size !== minimum && fitsAtSize(minimum)) return { fontSize: minimum, fits: true }
  return { fontSize: minimum, fits: false }
}

export function useAutoFit<T extends HTMLElement>(opts: AutoFitOptions = {}) {
  const ref = useRef<T>(null)
  const { minRatio = 0.85, step = 0.5, field } = opts

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return
    const initFs = parseFloat(getComputedStyle(el).fontSize) || 16
    const inferredField = `${el.closest('.card')?.classList[1] ?? 'text'}.${[...el.classList].join('.') || 'content'}`
    el.dataset.fitField = field ?? inferredField
    el.dataset.fitPending = '1'
    delete el.dataset.fitDone
    delete el.dataset.fitOverflow

    let disposed = false
    const fit = () => {
      if (disposed) return
      const maxH = Math.max(1, parent.clientHeight + 1)
      const maxW = Math.max(1, parent.clientWidth + 1)
      const fitNodes: HTMLElement[] = [el]
      const collect = (node: HTMLElement) => {
        for (const child of Array.from(node.children)) {
          if (!(child instanceof HTMLElement)) continue
          if (child.hasAttribute('data-fit-field')) continue
          fitNodes.push(child)
          collect(child)
        }
      }
      collect(el)
      const originalSizes = fitNodes.map((node) => parseFloat(getComputedStyle(node).fontSize) || initFs)
      const largestSize = Math.max(...originalSizes)
      const setScale = (fontSize: number) => {
        const ratio = fontSize / largestSize
        fitNodes.forEach((node, index) => {
          node.style.fontSize = `${originalSizes[index] * ratio}px`
        })
      }
      const result = fitFontSize(largestSize, (fontSize) => {
        setScale(fontSize)
        return !textOverflowsBounds(el) && el.getBoundingClientRect().height <= maxH && el.getBoundingClientRect().width <= maxW
      }, minRatio, step)
      setScale(result.fontSize)
      el.dataset.fitStart = String(largestSize)
      el.dataset.fitEnd = String(result.fontSize)
      if (!result.fits) el.dataset.fitOverflow = '1'
      el.dataset.fitDone = '1'
      delete el.dataset.fitPending
    }

    ;(document.fonts?.ready ?? Promise.resolve()).then(fit)
    return () => { disposed = true }
  }, [field, minRatio, step])

  return ref
}
