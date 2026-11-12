import { TYPES } from './elements.js';
import { addElement, removeElement, WIDTH, HEIGHT } from './scheme.js';

const snap = (v) => Math.round(v / 10) * 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// app - то, что дал main.js: доступ к схеме, режиму и перерисовке
export function attachEditor(svg, palette, app) {
  let drag = null;

  // координаты мыши в системе координат схемы (viewBox), а не в пикселях
  function point(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener('pointerdown', (e) => {
    // только основная кнопка мыши; пока тянем одним пальцем, второй палец игнорируем
    if (app.mode() !== 'edit' || e.button !== 0) return;
    if (drag && drag.pointerId !== e.pointerId) return;
    const g = e.target.closest('.el');
    if (!g) return app.select(null);

    const el = app.scheme().elements.find((x) => x.id === g.dataset.id);
    drag = { el, start: point(e), orig: { ...el }, handle: e.target.dataset.handle, moved: false, pointerId: e.pointerId };
    svg.setPointerCapture(e.pointerId);
    app.select(el.id);
  });

  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const p = point(e);
    const dx = p.x - drag.start.x;
    const dy = p.y - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;

    const { el, orig } = drag;
    if (el.type !== 'pipe') {
      el.x = clamp(snap(orig.x + dx), 0, WIDTH);
      el.y = clamp(snap(orig.y + dy), 0, HEIGHT);
    } else if (drag.handle === '1') {
      el.x = clamp(snap(p.x), 0, WIDTH);
      el.y = clamp(snap(p.y), 0, HEIGHT);
    } else if (drag.handle === '2') {
      el.x2 = clamp(snap(p.x), 0, WIDTH);
      el.y2 = clamp(snap(p.y), 0, HEIGHT);
    } else {
      // трубу двигаем целиком, поэтому сдвиг ограничиваем по обоим концам сразу
      const sx = clamp(snap(dx), -Math.min(orig.x, orig.x2), WIDTH - Math.max(orig.x, orig.x2));
      const sy = clamp(snap(dy), -Math.min(orig.y, orig.y2), HEIGHT - Math.max(orig.y, orig.y2));
      el.x = orig.x + sx;
      el.x2 = orig.x2 + sx;
      el.y = orig.y + sy;
      el.y2 = orig.y2 + sy;
    }
    app.redrawCanvas();
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.moved) app.commit();
    drag = null;
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  // в режиме работы клик по элементу переключает его тег
  svg.addEventListener('click', (e) => {
    if (app.mode() !== 'run') return;
    const g = e.target.closest('.el');
    if (!g) return;
    app.toggle(app.scheme().elements.find((x) => x.id === g.dataset.id));
  });

  function place(type, x, y) {
    const el = addElement(app.scheme(), type, snap(x), snap(y));
    app.select(el.id);
    app.commit();
  }

  palette.innerHTML = Object.entries(TYPES)
    .map(([type, t]) => `<button type="button" draggable="true" data-type="${type}">${t.name}</button>`)
    .join('');

  palette.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
  });
  palette.addEventListener('click', (e) => {
    const type = e.target.dataset.type;
    if (type) place(type, 400 + Math.random() * 200, 250 + Math.random() * 100);
  });

  svg.addEventListener('dragover', (e) => e.preventDefault());
  svg.addEventListener('drop', (e) => {
    e.preventDefault();
    if (app.mode() !== 'edit') return;
    const type = e.dataTransfer.getData('text/plain');
    if (!Object.hasOwn(TYPES, type)) return;
    const p = point(e);
    place(type, clamp(p.x, 0, WIDTH), clamp(p.y, 0, HEIGHT));
  });

  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (app.mode() !== 'edit') return;

    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.code === 'KeyZ') {
      e.preventDefault();
      e.shiftKey ? app.redo() : app.undo();
    } else if (ctrl && e.code === 'KeyY') {
      e.preventDefault();
      app.redo();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && app.selectedId()) {
      e.preventDefault();
      removeElement(app.scheme(), app.selectedId());
      app.select(null);
      app.commit();
    }
  });
}
