import assert from 'node:assert/strict'
import test from 'node:test'
import { parseRenderArgs } from '../src/lib/renderArgs'

test('single render CLI accepts --rebuild as a boolean flag', () => {
  assert.deepEqual(
    parseRenderArgs(['--job', 'render.json', '--out', 'imgs', '--rebuild']),
    { job: 'render.json', out: 'imgs', rebuild: true },
  )
})
