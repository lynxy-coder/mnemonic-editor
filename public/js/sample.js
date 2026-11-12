import { addElement } from './scheme.js';

// готовая схема: приточная установка и контур отопления
export function sampleScheme() {
  const s = { elements: [] };
  const add = (type, x, y, label, tag, extra) => Object.assign(addElement(s, type, x, y), { label, tag }, extra);

  add('pipe', 60, 200, '', 'F2.flow', { x2: 210, y2: 200 });
  add('valve', 250, 200, 'Наружный воздух', 'V2.pos');
  add('pipe', 290, 200, '', 'F2.flow', { x2: 430, y2: 200 });
  add('fan', 470, 200, 'Приток', 'SF1.run');
  add('pipe', 510, 200, '', 'F2.flow', { x2: 760, y2: 200 });
  add('sensor', 640, 130, 'Приток', 'T1');
  add('sensor', 120, 130, 'Улица', 'T2');

  add('pipe', 100, 420, '', 'F1.flow', { x2: 270, y2: 420 });
  add('pump', 300, 420, 'Насос отопления', 'P1.run');
  add('pipe', 330, 420, '', 'F1.flow', { x2: 560, y2: 420 });
  add('valve', 600, 420, 'Нагреватель', 'V1.pos');
  add('pipe', 640, 420, '', 'F1.flow', { x2: 800, y2: 420 });
  add('sensor', 450, 350, 'Обратка', 'T3');

  return s;
}
