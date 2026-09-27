import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TextLines } from '../src/components/Lines'

test('plain text content renders each source line as an explicit break', () => {
  const html = renderToStaticMarkup(createElement(TextLines, { text: '入口 + 章节 + 术语\n放进技能目录\nAI 按需调用' }))

  assert.equal(
    html,
    '<span>入口 + 章节 + 术语<br/></span><span>放进技能目录<br/></span><span>AI 按需调用</span>',
  )
})

test('plain text content handles Windows line endings without stray carriage returns', () => {
  const html = renderToStaticMarkup(createElement(TextLines, { text: '第一行\r\n第二行' }))

  assert.equal(html, '<span>第一行<br/></span><span>第二行</span>')
})
