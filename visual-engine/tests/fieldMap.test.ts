import assert from 'node:assert/strict'
import test from 'node:test'
import { fieldsToProps } from '../src/lib/fieldMap'

test('HTML fields convert plain newlines to visible line breaks', () => {
  const props = fieldsToProps(
    'card-checklist',
    { items: '第一步\n第二步' },
    'warmgray',
    'gzh',
  )

  assert.equal(props.items, '第一步<br>第二步')
})

test('HTML fields preserve markup while converting newlines', () => {
  const props = fieldsToProps(
    'card-checklist',
    { items: '<span>第一步</span>\n<span>第二步</span>' },
    'warmgray',
    'gzh',
  )

  assert.equal(props.items, '<span>第一步</span><br><span>第二步</span>')
})

test('dangerouslySetInnerHTML fields use HTML newline formatting', () => {
  const props = fieldsToProps(
    'cover-editorial',
    { issue: 'VOL. 01\nAI NOTES', foot: '第一行\n第二行' },
    'warmgray',
    'gzh',
  )

  assert.equal(props.issue, 'VOL. 01<br>AI NOTES')
  assert.equal(props.foot, '第一行<br>第二行')
})
