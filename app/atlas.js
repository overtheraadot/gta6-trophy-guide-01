// Leonida Platinum Atlas — offline trophy tracker for GTA VI (PS5).
// Loads the local trophy list, renders filterable cards, saves ticks in
// localStorage, exports/imports progress, hides story spoilers, and shows
// a four-stage roadmap to the platinum. No network calls at runtime.
const EARNED_KEY = 'leonida-atlas-earned-v1';
const SPOILER_KEY = 'leonida-atlas-spoiler-v1';
const RING_CIRC = 326.7;

const cardsEl = document.getElementById('cards');
const listHeading = document.getElementById('list-heading');
const listCount = document.getElementById('list-count');
const emptyNote = document.getElementById('empty-note');
const gradeCountsEl = document.getElementById('grade-counts');
const ringFg = document.getElementById('ring-fg');
const ringPct = document.getElementById('ring-pct');
const ringCount = document.getElementById('ring-count');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade-select');
const spoilerToggle = document.getElementById('spoiler-toggle');
const drawer = document.getElementById('drawer');
const drawerBody = document.getElementById('drawer-body');
const drawerScrim = document.getElementById('drawer-scrim');

let trophies = [];
let earned = new Set(loadJson(EARNED_KEY, []));
let filter = 'all';
let view = 'checklist';

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

function isSpoilerHidden(t) {
  return spoilerToggle.checked && t.kind === 'story' && !earned.has(t.name);
}

function displayName(t) {
  return isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
}

function displayDescription(t) {
  return isSpoilerHidden(t) ? 'Complete this story moment to reveal it.' : t.description;
}

function gradeLabel(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function matchesFilter(t) {
  if (filter === 'story') return t.kind === 'story';
  if (filter === 'missable') return t.missable === true;
  if (filter === 'collectible') return t.kind === 'collectible';
  if (filter === 'activity') return t.kind === 'activity';
  if (filter === 'online') return t.kind === 'online';
  if (filter === 'earned') return earned.has(t.name);
  if (filter === 'todo') return !earned.has(t.name);
  return true;
}

function matchesSearch(t) {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return true;
  const hay = [t.name, t.description, t.guide, t.kind, t.stage || '', (t.steps || []).join(' ')].join(' ').toLowerCase();
  return hay.includes(q);
}

function matchesGrade(t) {
  return gradeSelect.value === 'all' || t.grade === gradeSelect.value;
}

function visibleTrophies() {
  return trophies.filter((t) => matchesFilter(t) && matchesSearch(t) && matchesGrade(t));
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  ringPct.textContent = pct + '%';
  ringCount.textContent = done + ' / ' + total;
  ringFg.style.strokeDashoffset = String(RING_CIRC * (1 - done / Math.max(total, 1)));
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  gradeCountsEl.replaceChildren();
  for (const g of grades) {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    const li = document.createElement('li');
    li.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = gradeLabel(g) + ' ';
    li.append(b, document.createTextNode(got + ' / ' + all));
    gradeCountsEl.append(li);
  }
  document.getElementById('platinum-note').textContent =
    done >= total - 1 && total > 0
      ? 'One trophy left — the platinum is almost yours.'
      : 'Earn the other 54 trophies to unlock the platinum, Vice Got a Price!';
}

function sourceLink(t) {
  if (!t.source_url) return document.createTextNode(t.source || '');
  const a = document.createElement('a');
  a.href = t.source_url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = t.source || t.source_url;
  return a;
}

function renderCards() {
  const list = visibleTrophies();
  cardsEl.replaceChildren();
  for (const t of list) {
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
    const top = document.createElement('div');
    top.className = 'card-top';
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + t.grade;
    badge.textContent = gradeLabel(t.grade);
    const count = document.createElement('span');
    count.className = 'hint';
    count.textContent = t.count ? '× ' + t.count : '';
    top.append(badge, count);
    const title = document.createElement('h3');
    title.textContent = displayName(t);
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = '“' + displayDescription(t) + '”';
    const guide = document.createElement('p');
    guide.className = 'guide';
    const guideLead = document.createElement('b');
    guideLead.textContent = 'Guide: ';
    guide.append(guideLead, document.createTextNode(t.guide));
    const tags = document.createElement('div');
    tags.className = 'tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag tag-kind';
    kindTag.textContent = t.kind;
    tags.append(kindTag);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag tag-missable';
      m.textContent = '⚠ Missable';
      tags.append(m);
    }
    if (t.stage) {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = 'Roadmap: ' + t.stage;
      tags.append(s);
    }
    const src = document.createElement('p');
    src.className = 'source-line';
    src.append(document.createTextNode('Source: '), sourceLink(t));
    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const earn = document.createElement('label');
    earn.className = 'earn';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderAll();
    });
    earn.append(box, document.createTextNode(earned.has(t.name) ? 'Earned ✓' : 'Mark earned'));
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'guide-btn';
    openBtn.textContent = 'Full guide →';
    openBtn.addEventListener('click', () => openDrawer(t));
    foot.append(earn, openBtn);
    card.append(top, title, official, guide, tags, src, foot);
    cardsEl.append(card);
  }
  const shown = list.length;
  listCount.textContent = shown + ' of ' + trophies.length + ' trophies shown';
  listHeading.textContent =
    filter === 'all' ? 'All trophies' :
    filter === 'story' ? 'Story trophies' :
    filter === 'missable' ? 'Missable trophies — grab these in time' :
    filter === 'collectible' ? 'Collectibles' :
    filter === 'activity' ? 'Activities' :
    filter === 'online' ? 'Online trophies' :
    filter === 'earned' ? 'Earned trophies' : 'Trophies still to earn';
  emptyNote.hidden = shown !== 0;
}

function renderRoadmap() {
  const stages = [
    { n: 1, title: 'Stage 1 — Story playthrough', text: 'Play Chapters 1–4 and the finale in order. Story trophies pop as you finish each chapter and each named mission; none of them can be skipped, but play on a difficulty you can finish cleanly.' },
    { n: 2, title: 'Stage 2 — Side strands & activities', text: 'Clear the stranger strands (Andy, Kenton, Billy, Randy, Tyrone, Bret) and try every activity type once. This is where most missable moments live — check the flags below before you finish a strand.' },
    { n: 3, title: 'Stage 3 — Collectibles & exploration', text: 'Sweep Leonida: all 52 areas, 100 vehicles, card sets, WAiNK spots, meditation spots, drone races and the Shooting Range. Use the checklist filter “Collectibles” and work county by county.' },
    { n: 4, title: 'Stage 4 — Cleanup to 100%', text: 'Grind the counters — 250 stunts, 50 challenges, 20 race wins, $250,000 laundered, $100,000 spent, all garages — then 100% completion and the platinum.' },
  ];
  const list = document.getElementById('roadmap');
  list.replaceChildren();
  for (const s of stages) {
    const li = document.createElement('li');
    li.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = s.title;
    const p = document.createElement('p');
    p.textContent = s.text;
    const ul = document.createElement('ul');
    for (const t of trophies.filter((x) => x.stage === s.n)) {
      const item = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = displayName(t) + ' ';
      item.append(b);
      if (t.missable) {
        const m = document.createElement('span');
        m.className = 'miss';
        m.textContent = '⚠ Missable — ';
        item.append(m);
      }
      item.append(document.createTextNode(t.guide));
      ul.append(item);
    }
    li.append(h, p, ul);
    list.append(li);
  }
}

function openDrawer(t) {
  drawerBody.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = displayName(t);
  const badge = document.createElement('span');
  badge.className = 'badge badge-' + t.grade;
  badge.textContent = gradeLabel(t.grade);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = 'Official: “' + displayDescription(t) + '”';
  const gTitle = document.createElement('h3');
  gTitle.textContent = 'Guide';
  const g = document.createElement('p');
  g.textContent = t.guide;
  drawerBody.append(h, badge, official, gTitle, g);
  if (t.steps && t.steps.length) {
    const sTitle = document.createElement('h3');
    sTitle.textContent = 'Steps';
    const ol = document.createElement('ol');
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    drawerBody.append(sTitle, ol);
  }
  if (t.missable) {
    const mTitle = document.createElement('h3');
    mTitle.textContent = 'Missable — read first';
    const m = document.createElement('p');
    m.textContent = t.missable_note || 'This trophy can be missed if the moment passes. Do it when the guide says, before moving on.';
    drawerBody.append(mTitle, m);
  }
  const srcTitle = document.createElement('h3');
  srcTitle.textContent = 'Source';
  const src = document.createElement('p');
  src.append(document.createTextNode('Guide facts checked against: '), sourceLink(t));
  drawerBody.append(srcTitle, src);
  drawer.hidden = false;
  drawerScrim.hidden = false;
}

function closeDrawer() {
  drawer.hidden = true;
  drawerScrim.hidden = true;
}

function renderAll() {
  renderProgress();
  renderCards();
  renderRoadmap();
}

function setView(next) {
  view = next;
  document.getElementById('view-checklist').hidden = next !== 'checklist';
  document.getElementById('view-roadmap').hidden = next !== 'roadmap';
  document.getElementById('view-checklist-btn').classList.toggle('active', next === 'checklist');
  document.getElementById('view-roadmap-btn').classList.toggle('active', next === 'roadmap');
}

document.getElementById('view-checklist-btn').addEventListener('click', () => setView('checklist'));
document.getElementById('view-roadmap-btn').addEventListener('click', () => setView('roadmap'));
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
drawerScrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

document.getElementById('filter-chips').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const c of document.querySelectorAll('#filter-chips .chip')) c.classList.toggle('active', c === btn);
  renderCards();
});
searchInput.addEventListener('input', renderCards);
gradeSelect.addEventListener('change', renderCards);
spoilerToggle.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerToggle.checked ? '1' : '0');
  renderAll();
});
spoilerToggle.checked = localStorage.getItem(SPOILER_KEY) === '1';

document.getElementById('export-btn').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names || []).filter((n) => known.has(n)));
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a valid trophy-progress export.');
  }
  e.target.value = '';
});
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Untick every trophy?')) {
    earned = new Set();
    saveEarned();
    renderAll();
  }
});

const data = await fetch('data/trophies.json').then((r) => r.json());
trophies = data.trophies || data;
renderAll();
