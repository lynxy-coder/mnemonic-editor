// вместо настоящего контроллера: набор тегов с начальными значениями
export const TAG_DEFS = [
  { id: 'SF1.run', name: 'Вентилятор притока: работа', type: 'bool', value: true },
  { id: 'SF2.run', name: 'Вентилятор вытяжки: работа', type: 'bool', value: false },
  { id: 'P1.run', name: 'Насос отопления: работа', type: 'bool', value: true },
  { id: 'F1.flow', name: 'Поток в контуре отопления', type: 'bool', value: true },
  { id: 'F2.flow', name: 'Поток воздуха', type: 'bool', value: true },
  { id: 'V1.pos', name: 'Клапан нагревателя, %', type: 'number', min: 0, max: 100, value: 60 },
  { id: 'V2.pos', name: 'Клапан наружного воздуха, %', type: 'number', min: 0, max: 100, value: 100 },
  { id: 'T1', name: 'Температура притока, °C', type: 'number', min: -30, max: 90, value: 21, drift: true, alarmHigh: 24 },
  { id: 'T2', name: 'Температура наружного воздуха, °C', type: 'number', min: -30, max: 90, value: -5, drift: true },
  { id: 'T3', name: 'Температура обратки, °C', type: 'number', min: -30, max: 90, value: 45, drift: true, alarmHigh: 60 },
];

export function findTag(id) {
  return TAG_DEFS.find((t) => t.id === id);
}

export function initialValues() {
  return Object.fromEntries(TAG_DEFS.map((t) => [t.id, t.value]));
}

// температуры понемногу гуляют, остальное меняет пользователь
export function drift(values, rand = Math.random) {
  for (const t of TAG_DEFS) {
    if (!t.drift) continue;
    const v = values[t.id] + (rand() - 0.5) * 0.8;
    values[t.id] = Math.min(t.max, Math.max(t.min, v));
  }
}
