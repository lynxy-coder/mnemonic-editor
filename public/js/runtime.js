import { findTag } from './tags.js';

// что должен показывать элемент при текущих значениях тегов
export function visualState(el, values) {
  const v = el.tag ? values[el.tag] : undefined;

  if (el.type === 'fan' || el.type === 'pump') return { running: v === true };
  if (el.type === 'pipe') return { flowing: v === true };

  if (el.type === 'valve') {
    const pos = typeof v === 'number' ? Math.min(100, Math.max(0, v)) : null;
    return { pos };
  }

  if (el.type === 'sensor') {
    if (typeof v !== 'number') return { text: '-- °C', alarm: false };
    const limit = findTag(el.tag)?.alarmHigh;
    return { text: v.toFixed(1) + ' °C', alarm: limit !== undefined && v > limit };
  }
}
