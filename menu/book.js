/* =========================================================
   BOOK: the nudge, the opening animation, and the menu
   ========================================================= */
const book  = document.getElementById('book');
const scene = document.getElementById('scene');
const hint  = document.getElementById('hint');
const bloom = document.getElementById('bloom');
const panels = [...book.querySelectorAll('.panel')];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

panels.forEach(p => p.inert = true);        // nothing on the pages is clickable until it opens

// every few seconds, the cover lifts a little to invite a click
const peekTimer = setInterval(() => {
  if (book.classList.contains('opening') || calm) return;
  book.classList.add('peek');
  setTimeout(() => book.classList.remove('peek'), 1300);
}, 4500);

// move the book (and its ground shadow) to the next stage of the animation
function setStage(stage) {
  for (const s of ['pressed', 'lifted', 'open']) {
    book.classList.toggle(s, s === stage);
    scene.classList.toggle(s, s === stage);
  }
}

const wait = ms => new Promise(r => setTimeout(r, calm ? 0 : ms));

async function openBook() {
  if (book.classList.contains('opening')) return;
  book.classList.add('opening');
  clearInterval(peekTimer);
  book.classList.remove('peek');
  hint.classList.add('gone');

  // 1. squish
  setStage('pressed');
  await wait(130);

  // 2. lift out of the grass; a breeze pushes the grass away
  setStage('lifted');
  window.grass.gust();
  await wait(520);

  // 3. open: slide to center, cover swings, pages flutter, light blooms, pollen puffs up
  setStage('open');
  window.grass.hideFront();
  bloom.classList.add('on');
  const r = book.getBoundingClientRect();
  window.grass.burst(r.left + r.width / 2, r.top + r.height / 2);

  book.removeAttribute('role');
  book.removeAttribute('tabindex');
  book.setAttribute('aria-label', 'Open book with the main menu');
  showPanel('menu', false);

  await wait(2700);
  book.querySelector('[data-action="start"]').focus({ preventScroll: true });
}

function showPanel(name, quick = true) {
  panels.forEach(p => {
    const on = p.dataset.panel === name;
    p.classList.toggle('active', on);
    p.classList.toggle('quick', quick);
    p.inert = !on;
  });
}

book.addEventListener('click', openBook);
book.addEventListener('keydown', e => {
  if (!book.classList.contains('opening') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openBook(); }
});

book.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn || !book.classList.contains('open')) return;
  const action = btn.dataset.action;
  if (action === 'start') startGame();
  else showPanel(action);
});

/* rep[lace this function */
function startGame() {
  showPanel('start');
  document.dispatchEvent(new CustomEvent('grassbook:start'));
}