// Leonida Platinum Atlas — offline GTA VI trophy guide + tracker.
// Progress lives in localStorage under KEY; nothing leaves the browser.
// Hash routes (for deep links and screenshots): #demo seeds a sample save,
// #trophy-<id> opens that trophy's guide, #roadmap shows the roadmap,
// #missable turns on the missable filter and the spoiler setting.
const KEY = 'leonida-platinum-atlas';
const DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 21, 35];

const ROADMAP = [
  { title: 'Stage 1 — Story first', meta: 'Trophies 2–13, 44, 48, 49 · Chapters 1–4 + the story missions', body: 'Play the story in order. Flag the missables as you meet them — the final mission\u2019s choice, the Ocean Beach scene and the second-attempt event only happen once. Save in a separate slot before every big decision scene.', trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 48, 49] },
  { title: 'Stage 2 — Strangers of Leonida', meta: 'Trophies 22–27 · six stranger strands', body: 'Finish every stranger strand before the finale. Each strand locks once its final mission is done, and the strand is gone after the last chapter — Andy, Kenton, Billy, Randy and Tyrone all count toward the eight strands Strangers & Freaks needs.', trophies: [22, 23, 24, 25, 26, 27] },
  { title: 'Stage 3 — Crime & activities', meta: 'Trophies 15–21, 32–41, 43, 45–47, 51 · heists, races, ranges, bowling', body: 'The loud half of the list: vaults, armored trucks, shooting ranges, races and the partner trophies. Do Hot Together and Retail Therapy while partners are still around — partner missions end late in the story.', trophies: [15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 46, 47, 51] },
  { title: 'Stage 4 — Cleanup & the long grind', meta: 'Trophies 1, 14, 28–31, 35, 42, 50, 52–55 · 100% and the collectibles', body: 'The last percent: sweep collectibles region by region (cards, WAiNK spots, meditation spots), explore the last grey patches of the map, then buy out the garages and launder the last of the Marked Bills. A Long Road and the platinum pop here.', trophies: [1, 14, 28, 29, 30, 31, 35, 42, 50, 52, 53, 54, 55] },
];

const $ = (id) => document.getElementById(id);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let spoiler = localStorage.getItem(KEY + ':spoiler') === '1';
let activeKinds = new Set();
let view = 'checklist';

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  localStorage.setItem(KEY + ':spoiler', spoiler ? '1' : '0');
}

function isStoryHidden(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function gradeLabel(g) {
  return g[0].toUpperCase() + g.slice(1);
}

function renderProgress() {
  const n = earned.size, total = trophies.length;
  const pct = Math.round((n / total) * 100);
  $('ringPct').textContent = pct + '%';
  $('ringCount').textContent = n + ' / ' + total;
  $('ringArc').style.strokeDashoffset = String(326.7 * (1 - n / total));
  const counts = {};
  for (const t of trophies) {
    counts[t.grade] = counts[t.grade] || { total: 0, got: 0 };
    counts[t.grade].total++;
    if (earned.has(t.id)) counts[t.grade].got++;
  }
  $('gradeCounts').innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => {
      const c = counts[g];
      return '<div><dt>' + gradeLabel(g) + '</dt><dd>' + c.got + ' <small>/ ' + c.total + '</small></dd></div>';
    })
    .join('');
  $('missableCount').textContent = String(trophies.filter((t) => t.missable).length);
}

function cardEl(t) {
  const hidden = isStoryHidden(t);
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  b.dataset.trophy = String(t.id);
  const name = hidden ? 'Hidden story trophy' : t.name;
  const desc = hidden ? 'Story trophy — hidden until earned.' : t.description;
  b.innerHTML =
    '<span class="card-top"><h3>' + escapeHtml(name) + '</h3>' +
    '<span class="badge ' + t.grade + '">' + t.grade + '</span></span>' +
    '<p class="desc">' + escapeHtml(desc) + '</p>' +
    '<span class="meta"><span>' + (earned.has(t.id) ? '<span class="tick">✓ Earned</span>' : 'Not earned') + '</span>' +
    (t.missable ? '<span class="flag-missable">⚠ Missable</span>' : '') +
    '<span>' + kindLabel(t.kind) + '</span></span>';
  b.addEventListener('click', () => openDrawer(t.id));
  return b;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function kindLabel(k) {
  return { story: 'Story', stranger: 'Stranger', activity: 'Activity', collectible: 'Collectible', crime: 'Crime', exploration: 'Exploration', economy: 'Economy', completion: 'Completion', platinum: 'Platinum' }[k] || k;
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();
  const grade = $('grade').value;
  let list = trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    if (activeKinds.size === 0) return true;
    if (activeKinds.has('online')) return false; // the list has no online trophies
    return [...activeKinds].every((k) => {
      if (k === 'missable') return t.missable;
      if (k === 'earned') return earned.has(t.id);
      if (k === 'notearned') return !earned.has(t.id);
      return t.kind === k;
    });
  });
  return list;
}

function renderCards() {
  const list = filtered();
  const wrap = $('cards');
  wrap.replaceChildren();
  for (const t of list) wrap.append(cardEl(t));
  $('resultCount').textContent = list.length + ' of ' + trophies.length + ' trophies shown';
  $('emptyNote').hidden = !(activeKinds.has('online') && activeKinds.size === 1);
  const miss = trophies.filter((t) => t.missable);
  const mw = $('missableCards');
  mw.replaceChildren();
  for (const t of miss) mw.append(cardEl(t));
}

function renderRoadmap() {
  $('roadmap').innerHTML = ROADMAP.map((s) =>
    '<li><h3>' + escapeHtml(s.title) + ' <span>' + escapeHtml(s.meta) + '</span></h3>' +
    '<p>' + escapeHtml(s.body) + '</p>' +
    '<p class="trophies">Trophies: ' + s.trophies.map((id) => escapeHtml(byId.get(id).name)).join(' · ') + '</p></li>'
  ).join('');
}

function openDrawer(id) {
  const t = byId.get(id);
  if (!t) return;
  const hidden = isStoryHidden(t);
  const body = $('drawerBody');
  const guide = hidden
    ? '<p class="guide-text spoiled">This story trophy is hidden by the spoiler setting. Tick it earned to reveal its guide.</p>'
    : '<p class="guide-text">' + escapeHtml(t.guide) + '</p>' +
      '<h3>Steps</h3><ol>' + t.steps.map((s) => '<li>' + escapeHtml(s) + '</li>').join('') + '</ol>' +
      (t.missable
        ? '<h3>Missable — read first</h3><p class="warn">' + escapeHtml(t.missableNote) + '</p>'
        : '') +
      '<h3>Source</h3><p class="src">Full walkthrough: <a href="' + escapeHtml(t.sourceUrl) + '" target="_blank" rel="noopener">' + escapeHtml(t.source) + '</a></p>';
  body.innerHTML =
    '<span class="badge ' + t.grade + '">' + t.grade + '</span>' +
    '<h2>' + escapeHtml(hidden ? 'Hidden story trophy' : t.name) + '</h2>' +
    '<p class="desc">' + escapeHtml(hidden ? 'Story trophy — hidden until earned.' : t.description) + '</p>' +
    '<p class="meta">' + kindLabel(t.kind) + (t.missable ? ' · <span class="flag-missable">⚠ Missable</span>' : '') + '</p>' +
    guide +
    '<button type="button" class="earn-btn' + (earned.has(t.id) ? ' earned' : '') + '" id="drawerEarn">' +
    (earned.has(t.id) ? '✓ Earned — untick' : 'Mark earned') + '</button>';
  $('drawer').hidden = false;
  $('drawerBackdrop').hidden = false;
  $('drawerEarn').addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id);
    else earned.add(t.id);
    save();
    renderProgress();
    renderCards();
    openDrawer(id);
  });
}

function closeDrawer() {
  $('drawer').hidden = true;
  $('drawerBackdrop').hidden = true;
}

function setView(v) {
  view = v;
  $('viewChecklist').hidden = v !== 'checklist';
  $('viewRoadmap').hidden = v !== 'roadmap';
  $('viewMissable').hidden = v !== 'missable';
  $('tabChecklist').setAttribute('aria-selected', String(v === 'checklist'));
  $('tabRoadmap').setAttribute('aria-selected', String(v === 'roadmap'));
  $('tabMissable').setAttribute('aria-selected', String(v === 'missable'));
}

function applyHash() {
  const h = location.hash.replace(/^#/, '');
  if (h === 'demo' && earned.size === 0) {
    earned = new Set(DEMO_EARNED);
    save();
    renderProgress();
    renderCards();
  }
  if (h === 'roadmap') { setView('roadmap'); return; }
  if (h === 'missable') {
    spoiler = true;
    $('spoiler').checked = true;
    activeKinds = new Set(['missable']);
    document.querySelectorAll('#chips button').forEach((b) => b.classList.toggle('on', b.dataset.kind === 'missable'));
    setView('checklist');
    renderProgress();
    renderCards();
    return;
  }
  const m = h.match(/^trophy-(\d+)$/);
  if (m) { setView('checklist'); openDrawer(Number(m[1])); }
}

$('tabChecklist').addEventListener('click', () => setView('checklist'));
$('tabRoadmap').addEventListener('click', () => setView('roadmap'));
$('tabMissable').addEventListener('click', () => setView('missable'));
$('drawerClose').addEventListener('click', closeDrawer);
$('drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
$('search').addEventListener('input', renderCards);
$('grade').addEventListener('change', renderCards);
$('spoiler').checked = spoiler;
$('spoiler').addEventListener('change', (e) => {
  spoiler = e.target.checked;
  save();
  renderCards();
});
document.querySelectorAll('#chips button').forEach((b) => {
  b.addEventListener('click', () => {
    const k = b.dataset.kind;
    if (activeKinds.has(k)) activeKinds.delete(k);
    else activeKinds.add(k);
    b.classList.toggle('on', activeKinds.has(k));
    renderCards();
  });
});
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned].sort((x, y) => x - y))], { type: 'application/json' }));
  a.download = 'leonida-platinum-atlas-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ids = JSON.parse(await file.text());
    earned = new Set(ids.filter((id) => byId.has(id)));
    save();
    renderProgress();
    renderCards();
  } catch {
    alert('That file is not a Leonida Platinum Atlas progress export.');
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned = new Set();
  save();
  renderProgress();
  renderCards();
});

renderProgress();
renderRoadmap();
renderCards();
applyHash();
