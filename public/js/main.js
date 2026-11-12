import { TYPES } from './elements.js';
import { TAG_DEFS, findTag, initialValues, drift } from './tags.js';
import { serialize, parse, removeElement } from './scheme.js';
import { createHistory } from './history.js';
import { sampleScheme } from './sample.js';
import { drawScheme, applyRuntime } from './render.js';
import { attachEditor } from './editor.js';
import { esc } from './util.js';

const STORE_KEY = 'mnemonic-scheme';

const svg = document.getElementById('svg');
const side = document.getElementById('side');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

function loadSaved() {
  try {
    const text = localStorage.getItem(STORE_KEY);
    return text ? parse(text) : null;
  } catch {
    return null;
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, serialize(scheme));
  } catch {
    // без localStorage просто не запоминаем схему
  }
}

let scheme = loadSaved() || sampleScheme();
let mode = 'edit';
let selectedId = null;
const values = initialValues();
const history = createHistory(serialize(scheme));

const selected = () => scheme.elements.find((e) => e.id === selectedId);

function redrawCanvas() {
  drawScheme(svg, scheme, { selectedId, mode });
  if (mode === 'run') applyRuntime(svg, scheme, values);
}

function redraw() {
  redrawCanvas();
  drawSide();
  undoBtn.disabled = !history.canUndo;
  redoBtn.disabled = !history.canRedo;
}

function commit() {
  history.push(serialize(scheme));
  save();
  redraw();
}

function select(id) {
  selectedId = id;
  redraw();
}

function restore(snapshot) {
  scheme = parse(snapshot);
  if (!selected()) selectedId = null;
  save();
  redraw();
}

// правая панель: свойства элемента или список тегов
function tagRow(t) {
  const v = values[t.id];
  if (t.type === 'bool') {
    return `<label class="tag"><span>${esc(t.name)}</span>
      <input type="checkbox" data-tag="${t.id}" ${v ? 'checked' : ''}></label>`;
  }
  if (t.drift) {
    return `<div class="tag"><span>${esc(t.name)}</span><b data-val="${t.id}">${v.toFixed(1)}</b></div>`;
  }
  return `<label class="tag"><span>${esc(t.name)}</span>
    <input type="range" data-tag="${t.id}" min="${t.min}" max="${t.max}" value="${v}">
    <b data-val="${t.id}">${Math.round(v)}</b></label>`;
}

function drawSide() {
  if (mode === 'run') {
    side.innerHTML = '<h2>Теги (значения с «контроллера»)</h2>' + TAG_DEFS.map(tagRow).join('');
    return;
  }

  const el = selected();
  if (!el) {
    side.innerHTML = `<h2>Свойства</h2>
      <p class="hint">Выберите элемент на схеме. Delete удаляет выбранный, Ctrl+Z отменяет.</p>`;
    return;
  }

  const options = TAG_DEFS.filter((t) => t.type === TYPES[el.type].tagType)
    .map((t) => `<option value="${t.id}" ${t.id === el.tag ? 'selected' : ''}>${t.id}: ${esc(t.name)}</option>`)
    .join('');

  side.innerHTML = `<h2>${TYPES[el.type].name}</h2>
    <label>Подпись <input type="text" data-prop="label" maxlength="40" value="${esc(el.label)}"></label>
    <label>Тег <select data-prop="tag"><option value="">не привязан</option>${options}</select></label>
    <button type="button" class="danger" id="remove">Удалить</button>`;
}

function updateTagLabels() {
  for (const t of TAG_DEFS) {
    const out = side.querySelector(`[data-val="${t.id}"]`);
    if (out) out.textContent = t.drift ? values[t.id].toFixed(1) : Math.round(values[t.id]);

    const input = side.querySelector(`[data-tag="${t.id}"]`);
    if (!input || input === document.activeElement) continue;
    if (t.type === 'bool') input.checked = values[t.id];
    else input.value = values[t.id];
  }
}

side.addEventListener('input', (e) => {
  const { prop, tag } = e.target.dataset;

  if (prop === 'label') {
    selected().label = e.target.value;
    redrawCanvas();
  }
  if (tag) {
    values[tag] = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
    applyRuntime(svg, scheme, values);
    updateTagLabels();
  }
});

side.addEventListener('change', (e) => {
  const { prop } = e.target.dataset;
  if (prop === 'tag') selected().tag = e.target.value;
  if (prop) commit();
});

side.addEventListener('click', (e) => {
  if (e.target.id !== 'remove') return;
  removeElement(scheme, selectedId);
  selectedId = null;
  commit();
});

attachEditor(svg, document.getElementById('palette'), {
  scheme: () => scheme,
  mode: () => mode,
  selectedId: () => selectedId,
  select,
  commit,
  redrawCanvas,
  undo: () => undoBtn.click(),
  redo: () => redoBtn.click(),
  toggle(el) {
    const tag = findTag(el.tag);
    if (!tag) return;
    if (tag.type === 'bool') values[tag.id] = !values[tag.id];
    else if (!tag.drift) values[tag.id] = values[tag.id] >= tag.max ? tag.min : Math.min(tag.max, values[tag.id] + 50);
    applyRuntime(svg, scheme, values);
    updateTagLabels();
  },
});

// кнопки сверху
undoBtn.addEventListener('click', () => restore(history.undo()));
redoBtn.addEventListener('click', () => restore(history.redo()));

document.querySelectorAll('[data-mode-btn]').forEach((btn) =>
  btn.addEventListener('click', () => {
    mode = btn.dataset.modeBtn;
    selectedId = null;
    document.body.dataset.mode = mode;
    document.querySelectorAll('[data-mode-btn]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  })
);

document.getElementById('save').addEventListener('click', () => {
  const blob = new Blob([serialize(scheme)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scheme.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

const fileInput = document.getElementById('file');
document.getElementById('load').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  try {
    scheme = parse(await file.text());
    selectedId = null;
    commit();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('sample').addEventListener('click', () => {
  scheme = sampleScheme();
  selectedId = null;
  commit();
});

document.getElementById('clear').addEventListener('click', () => {
  if (!confirm('Удалить все элементы со схемы? Это можно отменить кнопкой «Отменить».')) return;
  scheme = { elements: [] };
  selectedId = null;
  commit();
});

setInterval(() => {
  if (mode !== 'run') return;
  drift(values);
  applyRuntime(svg, scheme, values);
  updateTagLabels();
}, 1000);

redraw();

// ссылка с #run открывает схему сразу в режиме работы
if (location.hash === '#run') document.querySelector('[data-mode-btn="run"]').click();
