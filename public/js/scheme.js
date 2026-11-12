import { TYPES, createElement } from './elements.js';

export const WIDTH = 1000;
export const HEIGHT = 600;

export function serialize(scheme) {
  return JSON.stringify({ version: 1, elements: scheme.elements });
}

function coord(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('В файле неверные координаты');
  return Math.min(max, Math.max(0, n));
}

// файл может быть любым, поэтому всё проверяем и подчищаем
export function parse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Файл не похож на JSON');
  }
  if (!data || data.version !== 1 || !Array.isArray(data.elements)) {
    throw new Error('Это не схема из этого редактора');
  }

  const ids = new Set();
  const elements = data.elements.map((raw) => {
    if (!raw || !TYPES[raw.type]) throw new Error('Неизвестный элемент в файле');
    const el = {
      id: String(raw.id),
      type: raw.type,
      x: coord(raw.x, WIDTH),
      y: coord(raw.y, HEIGHT),
      label: String(raw.label ?? '').slice(0, 40),
      tag: String(raw.tag ?? ''),
    };
    if (raw.type === 'pipe') {
      el.x2 = coord(raw.x2, WIDTH);
      el.y2 = coord(raw.y2, HEIGHT);
    }
    if (ids.has(el.id)) throw new Error('В файле повторяются номера элементов');
    ids.add(el.id);
    return el;
  });

  return { elements };
}

export function addElement(scheme, type, x, y) {
  const numbers = scheme.elements.map((e) => Number(e.id.replace(/\D/g, '')) || 0);
  const el = createElement(type, x, y);
  el.id = 'e' + (Math.max(0, ...numbers) + 1);
  scheme.elements.push(el);
  return el;
}

export function removeElement(scheme, id) {
  scheme.elements = scheme.elements.filter((e) => e.id !== id);
}
