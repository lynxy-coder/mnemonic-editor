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

const file = (el) => JSON.stringify({ version: 1, elements: [el] });

test('вредные данные в файле отклоняются', () => {
  // номер с кавычкой и HTML попал бы в разметку и выполнил бы скрипт
  assert.throws(() => parse(file({ id: '"><img src=x onerror=alert(1)>', type: 'fan', x: 1, y: 1 })));
  assert.throws(() => parse(file({ type: 'fan', x: 1, y: 1 }))); // нет номера
  // типы из прототипа объекта не должны считаться известными
  assert.throws(() => parse(file({ id: 'a', type: 'toString', x: 1, y: 1 })));
  assert.throws(() => parse(file({ id: 'a', type: '__proto__', x: 1, y: 1 })));
  // координаты и подпись должны быть числом и строкой
  assert.throws(() => parse(file({ id: 'a', type: 'fan', x: '5', y: 1 })));
  assert.throws(() => parse(file({ id: 'a', type: 'fan', x: 1, y: 1, label: { a: 1 } })));
});

test('координаты зажимаются в поле, а неподходящий тег отвязывается', () => {
  const { elements } = parse(file({ id: 'a', type: 'fan', x: 99999, y: -5, tag: 'V1.pos' }));
  assert.equal(elements[0].x, 1000);
  assert.equal(elements[0].y, 0);
  assert.equal(elements[0].tag, ''); // у вентилятора тег должен быть включением, а V1.pos это положение клапана
});

test('клапан и датчик показывают значения тегов', () => {
  const values = { 'V1.pos': 150, T1: 30 };
  assert.equal(visualState({ type: 'valve', tag: 'V1.pos' }, values).pos, 100);
  assert.equal(visualState({ type: 'sensor', tag: 'T1' }, values).alarm, true);
  assert.equal(visualState({ type: 'fan', tag: '' }, values).running, false);
});
