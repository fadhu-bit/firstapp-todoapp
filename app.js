const STORAGE_KEY = 'todo.tasks';
const CONFETTI = ['#7c5cff', '#ff5c9d', '#ffc94d', '#22c38e', '#4dc9ff'];
const CHEERS = ['Nice!', 'Done!', 'Boom!', 'Crushed it!', 'Yes!', '🎉', '✨', '🔥'];
const EMPTY_MESSAGES = {
  all: 'Nothing here yet. Add a task above!',
  active: 'No active tasks. Enjoy the free time!',
  completed: 'Nothing completed yet. You got this!',
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (selector) => document.querySelector(selector);
const form = $('#add-form');
const input = $('#new-task');
const addBtn = $('#add-btn');
const list = $('#list');
const counter = $('#counter');
const progressBar = $('#progress-bar');
const filtersNav = $('#filters');
const filterPill = $('#filter-pill');
const emptyEl = $('#empty');
const clearBtn = $('#clear-completed');
const allDoneEl = $('#all-done');
const fx = $('#fx');

let tasks = load();
let filter = 'all';
let lastRemaining = null;

// ---------- Storage ----------

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (private mode etc.) – the app still works for this session.
  }
}

// ---------- Helpers ----------

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const findTask = (id) => tasks.find((t) => t.id === id);
const isVisible = (task) => filter === 'all' || (filter === 'active' ? !task.done : task.done);

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Restart a CSS animation class, removing it again after `ms`.
function replay(el, cls, ms) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  clearTimeout(el[`_${cls}Timer`]);
  el[`_${cls}Timer`] = setTimeout(() => el.classList.remove(cls), ms);
}

function shake(el) {
  if (reduceMotion) return;
  el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' },
     { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
    { duration: 420, easing: 'ease-in-out' }
  );
}

// ---------- Particle effects ----------

function makeParticle(x, y, colors) {
  const p = document.createElement('span');
  const size = 5 + Math.random() * 7;
  p.className = 'particle';
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.width = `${size}px`;
  p.style.height = `${Math.random() > 0.5 ? size : size * 0.45}px`;
  p.style.background = pick(colors);
  p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
  fx.append(p);
  return p;
}

function burst(x, y, { count = 24, colors = CONFETTI, spread = 1 } = {}) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const p = makeParticle(x, y, colors);
    const angle = Math.random() * Math.PI * 2;
    const dist = (40 + Math.random() * 80) * spread;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = (Math.random() - 0.5) * 720;
    p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 40}px)) rotate(${rot * 1.3}deg) scale(0.3)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.15,.7,.3,1)' }
    ).onfinish = () => p.remove();
  }
}

function confettiRain() {
  if (reduceMotion) return;
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const p = makeParticle(Math.random() * window.innerWidth, -20, CONFETTI);
      const drift = (Math.random() - 0.5) * 200;
      const rot = (Math.random() - 0.5) * 1080;
      p.animate(
        [
          { transform: 'translate(0, 0) rotate(0)' },
          { transform: `translate(${drift}px, ${window.innerHeight + 40}px) rotate(${rot}deg)` },
        ],
        { duration: 2000 + Math.random() * 1500, easing: 'cubic-bezier(.3,.1,.6,1)' }
      ).onfinish = () => p.remove();
    }, Math.random() * 1200);
  }
}

function floatText(x, y, text) {
  if (reduceMotion) return;
  const el = document.createElement('span');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  fx.append(el);
  el.animate(
    [
      { opacity: 0, transform: 'translate(-50%, -50%) scale(.4)' },
      { opacity: 1, transform: 'translate(-50%, -140%) scale(1.15)', offset: 0.3 },
      { opacity: 0, transform: 'translate(-50%, -320%) scale(.9)' },
    ],
    { duration: 1100, easing: 'ease-out' }
  ).onfinish = () => el.remove();
}

// ---------- Item enter / leave ----------

function boxFrames(li) {
  const cs = getComputedStyle(li);
  return {
    open: { height: `${li.offsetHeight}px`, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginBottom: cs.marginBottom },
    closed: { height: '0px', paddingTop: '0px', paddingBottom: '0px', marginBottom: '0px' },
  };
}

function animateIn(li) {
  if (reduceMotion) return;
  const { open, closed } = boxFrames(li);
  // Make room smoothly so the items below glide down…
  li.animate([closed, open], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
  // …while the task itself springs into place.
  li.animate(
    [
      { opacity: 0, transform: 'translateY(-24px) scale(.6) rotate(-5deg)' },
      { opacity: 1, transform: 'translateY(4px) scale(1.06) rotate(1.5deg)', offset: 0.6 },
      { transform: 'translateY(-2px) scale(.98) rotate(-.5deg)', offset: 0.8 },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 700, easing: 'ease-out' }
  );
  replay(li, 'fresh', 1300);
}

function animateOut(li, { x = 80, rotate = 6 } = {}) {
  li.classList.add('leaving');
  if (reduceMotion) {
    li.remove();
    return Promise.resolve();
  }
  const { open, closed } = boxFrames(li);
  const gone = `translateX(${x}px) rotate(${rotate}deg) scale(.9)`;
  const anim = li.animate(
    [
      { ...open, opacity: 1, transform: 'none' },
      { ...open, opacity: 0, transform: gone, offset: 0.55 },
      { ...closed, opacity: 0, transform: gone },
    ],
    { duration: 480, easing: 'ease-in-out', fill: 'forwards' }
  );
  return anim.finished.then(() => li.remove());
}

// ---------- Rendering ----------

function setText(el, text, animate) {
  if (!animate || reduceMotion) {
    el.textContent = text;
    return;
  }
  el.textContent = '';
  let i = 0;
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      el.append(' ');
      continue;
    }
    const word = document.createElement('span');
    word.className = 'word';
    for (const ch of part) {
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = ch;
      c.style.setProperty('--i', i++);
      word.append(c);
    }
    el.append(word);
  }
  // Swap back to plain text once the letters have landed.
  setTimeout(() => {
    if (!el.isContentEditable) el.textContent = text;
  }, 700 + i * 25);
}

function createItem(task, animateText = false) {
  const li = document.createElement('li');
  li.className = task.done ? 'task done' : 'task';
  li.dataset.id = task.id;
  li.innerHTML = `
    <button class="check" type="button" aria-label="Mark complete" aria-pressed="${task.done}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
    </button>
    <div class="body"><span class="text" title="Double-click to edit"></span></div>
    <button class="delete" type="button" aria-label="Delete task">✕</button>`;
  setText(li.querySelector('.text'), task.text, animateText);
  return li;
}

function renderAll(newTaskId) {
  list.innerHTML = '';
  tasks.filter(isVisible).forEach((task, i) => {
    const isNew = task.id === newTaskId;
    const li = createItem(task, isNew);
    list.append(li);
    if (isNew) {
      animateIn(li);
    } else if (!reduceMotion) {
      li.animate(
        [{ opacity: 0, transform: 'translateY(18px) scale(.95)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, delay: i * 45, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards' }
      );
    }
  });
  updateMeta();
}

function updateMeta() {
  const remaining = tasks.filter((t) => !t.done).length;
  const done = tasks.length - remaining;

  counter.textContent = `${remaining} ${remaining === 1 ? 'item' : 'items'} left`;
  if (lastRemaining !== null && remaining !== lastRemaining) replay(counter, 'bump', 400);
  lastRemaining = remaining;

  progressBar.style.width = tasks.length ? `${(done / tasks.length) * 100}%` : '0%';
  progressBar.classList.toggle('full', tasks.length > 0 && done === tasks.length);
  clearBtn.classList.toggle('show', done > 0);

  const empty = list.children.length === 0;
  if (empty) emptyEl.querySelector('p').textContent = EMPTY_MESSAGES[filter];
  emptyEl.classList.toggle('show', empty);
}

function moveFilterPill() {
  const active = filtersNav.querySelector('button.active');
  filterPill.style.width = `${active.offsetWidth}px`;
  filterPill.style.height = `${active.offsetHeight}px`;
  filterPill.style.top = `${active.offsetTop}px`;
  filterPill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function setFilter(next, newTaskId) {
  filter = next;
  filtersNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.filter === filter));
  moveFilterPill();
  renderAll(newTaskId);
}

// ---------- Actions ----------

function addTask(text) {
  const task = { id: newId(), text, done: false, createdAt: Date.now() };
  tasks.unshift(task);
  save();

  replay(addBtn, 'pressed', 500);
  const { x, y } = center(addBtn);
  burst(x, y, { count: 18, spread: 0.8 });

  if (filter === 'completed') {
    setFilter('all', task.id);
    return;
  }
  const li = createItem(task, true);
  list.prepend(li);
  animateIn(li);
  updateMeta();
}

function toggleTask(li) {
  const task = findTask(li.dataset.id);
  if (!task) return;
  task.done = !task.done;
  save();

  const check = li.querySelector('.check');
  li.classList.toggle('done', task.done);
  check.setAttribute('aria-pressed', task.done);

  if (task.done) {
    replay(check, 'pop', 600);
    replay(li, 'celebrate', 700);
    const { x, y } = center(check);
    burst(x, y, { count: 28 });
    floatText(x, y - 10, pick(CHEERS));
    if (tasks.every((t) => t.done)) setTimeout(celebrateAll, 400);
  } else {
    replay(li, 'undo', 450);
  }

  // Let the animation play, then remove it if the current filter hides it.
  setTimeout(() => {
    if (li.isConnected && !li.classList.contains('leaving') && !isVisible(task)) {
      animateOut(li, { x: task.done ? 120 : -120, rotate: task.done ? 6 : -6 }).then(updateMeta);
    }
  }, 750);
  updateMeta();
}

function deleteTask(li) {
  if (li.classList.contains('leaving')) return;
  tasks = tasks.filter((t) => t.id !== li.dataset.id);
  save();
  const { x, y } = center(li.querySelector('.delete'));
  burst(x, y, { count: 14, colors: ['#8a86a3', '#b9b4d6', '#ff5c9d'], spread: 0.6 });
  animateOut(li, { x: 140, rotate: 8 }).then(updateMeta);
  updateMeta();
}

function clearCompleted() {
  const doneIds = new Set(tasks.filter((t) => t.done).map((t) => t.id));
  if (!doneIds.size) return;
  tasks = tasks.filter((t) => !doneIds.has(t.id));
  save();

  const items = [...list.children].filter((li) => doneIds.has(li.dataset.id));
  Promise.all(
    items.map((li, i) =>
      new Promise((resolve) => setTimeout(resolve, i * 70)).then(() => {
        const { x, y } = center(li);
        burst(x, y, { count: 10, spread: 0.6 });
        return animateOut(li, { x: -140, rotate: -6 });
      })
    )
  ).then(updateMeta);
  updateMeta();
}

function celebrateAll() {
  if (!tasks.length || !tasks.every((t) => t.done)) return;
  replay(allDoneEl, 'show', 2600);
  confettiRain();
}

function editTask(li) {
  const task = findTask(li.dataset.id);
  const text = li.querySelector('.text');
  if (!task || text.isContentEditable) return;

  text.textContent = task.text;
  text.contentEditable = 'true';
  li.classList.add('editing');
  text.focus();
  document.getSelection().selectAllChildren(text);

  const finish = (commit) => {
    text.removeEventListener('blur', onBlur);
    text.removeEventListener('keydown', onKey);
    text.contentEditable = 'false';
    li.classList.remove('editing');

    const value = text.textContent.trim();
    if (!commit || value === task.text) {
      text.textContent = task.text;
    } else if (!value) {
      deleteTask(li);
    } else {
      task.text = value;
      save();
      setText(text, value, true);
      replay(li, 'saved', 600);
    }
  };
  const onBlur = () => finish(true);
  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      finish(false);
    }
  };
  text.addEventListener('blur', onBlur);
  text.addEventListener('keydown', onKey);
}

// ---------- Events ----------

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    shake(form);
    input.focus();
    return;
  }
  input.value = '';
  addTask(text);
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('.task');
  if (!li || li.classList.contains('leaving')) return;
  if (e.target.closest('.check')) toggleTask(li);
  else if (e.target.closest('.delete')) deleteTask(li);
});

list.addEventListener('dblclick', (e) => {
  const li = e.target.closest('.task');
  if (li && e.target.closest('.text') && !li.classList.contains('leaving')) editTask(li);
});

filtersNav.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-filter]');
  if (button && button.dataset.filter !== filter) setFilter(button.dataset.filter);
});

clearBtn.addEventListener('click', clearCompleted);
window.addEventListener('resize', moveFilterPill);

// ---------- Start ----------

renderAll();
moveFilterPill();
requestAnimationFrame(() => filtersNav.classList.add('ready'));
