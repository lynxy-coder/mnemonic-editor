import { drawElement } from './elements.js';
import { visualState } from './runtime.js';
import { esc } from './util.js';

function group(el, selectedId, mode) {
  const selected = el.id === selectedId;
  const cls = `el el-${el.type}${selected ? ' selected' : ''}`;
  const label = el.label ? esc(el.label) : '';

  if (el.type === 'pipe') {
    const mx = (el.x + el.x2) / 2;
    const my = (el.y + el.y2) / 2;
    const handles =
      selected && mode === 'edit'
        ? `<circle class="handle" data-handle="1" cx="${el.x}" cy="${el.y}" r="7"/>
           <circle class="handle" data-handle="2" cx="${el.x2}" cy="${el.y2}" r="7"/>`
        : '';
    const text = label ? `<text class="label" x="${mx}" y="${my - 14}">${label}</text>` : '';
    return `<g class="${cls}" data-id="${el.id}">${drawElement(el)}${text}${handles}</g>`;
  }

  const text = label ? `<text class="label" y="48">${label}</text>` : '';
  return `<g class="${cls}" data-id="${el.id}" transform="translate(${el.x} ${el.y})">
    ${drawElement(el)}
    <rect class="sel-box" x="-44" y="-42" width="88" height="${label ? 100 : 84}" rx="6"/>
    ${text}
  </g>`;
}

// перерисовываем всю схему целиком: элементов мало, так проще всего
export function drawScheme(svg, scheme, { selectedId, mode }) {
  svg.dataset.mode = mode;
  svg.querySelector('#layer').innerHTML = scheme.elements.map((el) => group(el, selectedId, mode)).join('');
}

// в режиме работы только обновляем классы и значения, чтобы не сбивать анимацию
export function applyRuntime(svg, scheme, values) {
  for (const el of scheme.elements) {
    const g = svg.querySelector(`[data-id="${el.id}"]`);
    if (!g) continue;
    const s = visualState(el, values);

    if (el.type === 'fan' || el.type === 'pump') g.classList.toggle('running', s.running);
    if (el.type === 'pipe') g.classList.toggle('flowing', s.flowing);

    if (el.type === 'valve') {
      g.querySelector('.bar').setAttribute('width', s.pos === null ? 0 : (36 * s.pos) / 100);
      g.classList.toggle('open', s.pos > 0);
    }

    if (el.type === 'sensor') {
      g.querySelector('.value').textContent = s.text;
      g.classList.toggle('alarm', s.alarm);
    }
  }
}
