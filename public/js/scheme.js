import { TYPES, createElement } from './elements.js';
import { findTag } from './tags.js';

export const WIDTH = 1000;
export const HEIGHT = 600;

// номер элемента попадает в разметку и в селекторы, поэтому разрешаем только буквы, цифры, _ и -
const ID_PATTERN = /^[\w-]{1,32}$/;

export function serialize(scheme) {
  return JSON.stringify({ version: 1, elements: scheme.elements });
}

function coord(value, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('В файле неверные координаты');
  return Math.min(max, Math.max(0, value));
}

function cleanText(value, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('В файле неверный текст');
  return value.slice(0, maxLength);
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
    // Object.hasOwn: иначе под тип подошли бы "toString" и "__proto__" из прототипа объекта
    if (!raw || typeof raw.type !== 'string' || !Object.hasOwn(TYPES, raw.type)) {
      throw new Error('Неизвестный элемент в файле');
    }
    if (typeof raw.id !== 'string' || !ID_PATTERN.test(raw.id)) throw new Error('В файле неверный номер элемента');
    const el = {
      id: raw.id,
      type: raw.type,
      x: coord(raw.x, WIDTH),
      y: coord(raw.y, HEIGHT),
      label: cleanText(raw.label, 40),
      tag: cleanText(raw.tag, 40),
    };
    // тег должен существовать и подходить элементу по типу, иначе отвязываем
    if (el.tag && findTag(el.tag)?.type !== TYPES[el.type].tagType) el.tag = '';
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
