import test from 'node:test';
import assert from 'node:assert/strict';

import { createHistory } from '../public/js/history.js';
import { serialize, parse } from '../public/js/scheme.js';
import { sampleScheme } from '../public/js/sample.js';
import { visualState } from '../public/js/runtime.js';

test('отмена и повтор', () => {
  const h = createHistory('a');
  h.push('b');
  h.push('c');
  assert.equal(h.undo(), 'b');
  assert.equal(h.undo(), 'a');
  assert.equal(h.canUndo, false);
  assert.equal(h.redo(), 'b');

  h.push('d'); // после нового действия "повтор" пропадает
  assert.equal(h.canRedo, false);
});

test('схема сохраняется и читается обратно, мусор отклоняется', () => {
  const scheme = sampleScheme();
  assert.deepEqual(parse(serialize(scheme)), scheme);

  assert.throws(() => parse('не json'));
  assert.throws(() => parse('{"version":1,"elements":[{"id":"e1","type":"rocket","x":1,"y":1}]}'));
});

test('клапан и датчик показывают значения тегов', () => {
  const values = { 'V1.pos': 150, T1: 30 };
  assert.equal(visualState({ type: 'valve', tag: 'V1.pos' }, values).pos, 100);
  assert.equal(visualState({ type: 'sensor', tag: 'T1' }, values).alarm, true);
  assert.equal(visualState({ type: 'fan', tag: '' }, values).running, false);
});
