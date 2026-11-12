// tagType: какие теги можно привязать к элементу
export const TYPES = {
  fan: { name: 'Вентилятор', tagType: 'bool', label: 'Вент.' },
  pump: { name: 'Насос', tagType: 'bool', label: 'Насос' },
  valve: { name: 'Клапан', tagType: 'number', label: 'Клапан' },
  sensor: { name: 'Датчик температуры', tagType: 'number', label: '' },
  pipe: { name: 'Труба', tagType: 'bool', label: '' },
};

export function createElement(type, x, y) {
  const el = { type, x, y, label: TYPES[type].label, tag: '' };
  if (type === 'pipe') {
    el.x2 = x + 120;
    el.y2 = y;
  }
  return el;
}

const BLADE = 'M0 0 C 6 -8 8 -20 0 -24 C -8 -20 -6 -8 0 0Z';

const DRAW = {
  fan: () => `
    <circle class="body" r="27"/>
    <g class="rotor">
      <path d="${BLADE}"/>
      <path d="${BLADE}" transform="rotate(120)"/>
      <path d="${BLADE}" transform="rotate(240)"/>
    </g>`,

  pump: () => `
    <circle class="body" r="24"/>
    <path class="tri" d="M-9 -12 L14 0 L-9 12Z"/>`,

  valve: () => `
    <polygon class="body" points="-22,-14 0,0 -22,14"/>
    <polygon class="body" points="22,-14 0,0 22,14"/>
    <rect class="bar-bg" x="-18" y="-30" width="36" height="7"/>
    <rect class="bar" x="-18" y="-30" width="0" height="7"/>`,

  sensor: () => `
    <rect class="body" x="-36" y="-15" width="72" height="30" rx="6"/>
    <text class="value" y="5" text-anchor="middle">-- °C</text>`,

  pipe: (el) => `
    <line class="hit" x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}"/>
    <line class="pipe-bg" x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}"/>
    <line class="pipe-flow" x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}"/>`,
};

export function drawElement(el) {
  return DRAW[el.type](el);
}
