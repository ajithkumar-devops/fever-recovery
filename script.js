/* ═══════════════════════════════════════════════════════════
   EDIT THIS BLOCK — nothing below it needs touching.
   ═══════════════════════════════════════════════════════════ */

const HER_NAME   = 'Theju';
const SICK_START = '2026-09-14';   // the day she got sick, YYYY-MM-DD
const RECOVERY_DAYS = 7;           // the arc the "Good Health Loading" bar fills over
const GAME_SECONDS  = 30;

// Screen 3 — the prescription doses.
// She'll see every one of these before any repeats, so they can carry weight.
const PRESCRIPTIONS = [
  "I can't see those beautiful eyes turning red, and that smile hiding under a mask.",
  "I've counted every single day of this. I'm still counting.",
  "Tell me honestly how you're feeling. Not the \"I'm fine\" version. The real one.",
  "I wish I could take this from you and carry it myself for a day.",
  "Did you eat? Actually eat — not the answer you give so I stop asking.",
  "I'm worried about you. That's not me being dramatic, that's just where my head is.",
  "If it gets worse tonight, wake me up. I mean it. Any hour.",
  "You keep saying it's nothing. It's been days now. It isn't nothing.",
  "Please see a doctor if this doesn't turn around. Do that one for me.",
  "I don't need you to be okay right now. I just need you to let yourself heal.",
  "Heartbeat will still be there when you're better. So will I.",
  "Drink water. Take the medicine. Text me when you've done both.",
  "Your favourite hobby is pushing me into trauma — and I'd take a hundred rounds of it over one more day of you like this.",
  "You don't have to be strong or cheerful for me today. Just be horizontal.",
  "Every time my phone lights up I hope it's you saying you feel better.",
  "Being unwell is not something to apologise for. Stop doing it.",
];

// Screen 7 — the smile cards.
// More messages than cards (6), so a tap can always find something new.
const SMILES = [
  "You're stronger than this ♡",
  "Coughs are temporary, but your smile is permanent. ♡",
  "You're doing your best, and that's enough. ♡",
  "No overthinking. Doctor's orders. 😊",
  "Your rest today is a brighter you tomorrow. ♡",
  "Proud of you for taking care of yourself. ♡",
  "I'm thinking about you right now. ♡",
  "One slow day at a time. That's all. ♡",
  "You're allowed to do absolutely nothing. ♡",
  "I miss you being annoying. Come back. ♡",
  "This will pass. I'll still be here after. ♡",
  "Go back to sleep. I'll wait. ♡",
];

/* ═══════════════════════════════════════════════════════════
   Below here: the machinery.
   ═══════════════════════════════════════════════════════════ */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/**
 * Swap the placeholder name throughout the markup.
 * Walks text nodes rather than rewriting innerHTML — an innerHTML swap would
 * rebuild every element and silently drop the listeners wired up below.
 * Runs first, before anything is bound.
 */
function renameTo(newName, placeholder = 'Theju') {
  if (newName === placeholder) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeValue.includes(placeholder)) {
      n.nodeValue = n.nodeValue.replaceAll(placeholder, newName);
    }
  }
}

renameTo(HER_NAME);
document.title = `${HER_NAME}'s Little Recovery Corner 💗`;

/**
 * A "shuffle bag": deals every item once in random order before any repeats.
 *
 * Plain random picking feels broken here — with 16 doses you'd still expect to
 * see a repeat within about five taps, which reads as "it's glitching" rather
 * than "it's random". Dealing from a shuffled deck guarantees she reads all of
 * them before seeing any twice.
 */
function makeShuffleBag(items) {
  let bag = [];
  let last = null;

  return function draw() {
    if (bag.length === 0) {
      bag = items.slice();
      for (let i = bag.length - 1; i > 0; i--) {          // Fisher–Yates
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // A reshuffle can deal the same item she just saw, straddling the seam.
      // Swap it away from the top so the back-to-back repeat never shows.
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
    }
    last = bag.pop();
    return last;
  };
}

/** localStorage throws in some private-browsing modes — never let that kill the page. */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, String(value)); } catch { /* fine, just won't persist */ }
  },
};

/* ── Screen manager ─────────────────────────────────────── */

const SCREENS = $$('.screen').map((el) => el.id);
const navStack = [];
let current = null;

/** Hooks that run when a screen becomes active. Registered further down. */
const onEnter = {};

function goto(id, { push = true } = {}) {
  if (id === current) return;
  if (push && current) navStack.push(current);

  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  current = id;

  document.body.dataset.theme = $('#' + id).dataset.theme || 'blush';
  $('#backBtn').hidden = navStack.length === 0;

  renderDots();
  window.scrollTo(0, 0);

  if (onEnter[id]) onEnter[id]();
}

function back() {
  const prev = navStack.pop();
  if (prev) goto(prev, { push: false });
}

function renderDots() {
  const dots = $('#dots');
  if (!dots.children.length) {
    SCREENS.forEach((id, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to screen ${i + 1}`);
      b.addEventListener('click', () => goto(id));
      dots.appendChild(b);
    });
  }
  Array.from(dots.children).forEach((b, i) => b.classList.toggle('on', SCREENS[i] === current));
}

// Any element with data-goto navigates.
$$('[data-goto]').forEach((el) => el.addEventListener('click', () => goto(el.dataset.goto)));
$('#backBtn').addEventListener('click', back);

/* ── Screen 2 · Good Health Loading ─────────────────────── */

/** Whole days since she got sick, counting the first day as Day 1. */
function daysSinceSick(startISO, today = new Date()) {
  const [y, m, d] = startISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

/**
 * Clamped to 96% until the arc actually completes — a page cheerfully announcing
 * "100% recovered!" at someone still coughing is worse than no page at all.
 */
function recoveryPercent(day, totalDays) {
  const raw = (day / totalDays) * 100;
  return raw >= 100 ? 100 : Math.min(96, Math.round(raw));
}

onEnter.s2 = () => {
  const day = daysSinceSick(SICK_START);
  const pct = recoveryPercent(day, RECOVERY_DAYS);

  // Past the end of the arc, drop the "of N" — "Day 19 of 7" reads like a bug.
  $('#dayLabel').textContent = day > RECOVERY_DAYS ? `Day ${day}` : `Day ${day} of ${RECOVERY_DAYS}`;
  $('#pctLabel').textContent = `${pct}%`;
  $('#bar').setAttribute('aria-valuenow', String(pct));

  $('#barFill').style.width = '0%';                       // replay the fill on re-entry
  requestAnimationFrame(() => { $('#barFill').style.width = `${pct}%`; });
};

/* ── Screen 3 · Prescription ────────────────────────────── */

const rxText = $('#rxText');
const drawPrescription = makeShuffleBag(PRESCRIPTIONS);

// The card starts on the first dose, so retire it from the opening deal —
// otherwise her first tap can hand straight back what she's already reading.
rxText.textContent = drawPrescription();

$('#rxBtn').addEventListener('click', () => {
  const next = drawPrescription();
  rxText.classList.add('fading');
  setTimeout(() => {
    rxText.textContent = next;
    rxText.classList.remove('fading');
  }, 300);                                                 // matches the CSS transition
});

/* ── Screen 4 · Catch the Hearts ────────────────────────── */

const arena = $('#arena');
const HEARTS = ['💗', '💖', '❤️', '💕'];

const game = { running: false, score: 0, left: GAME_SECONDS, tick: null, spawn: null };

$('#statBest').textContent = store.get('theju.best', '0');

function fmtTime(s) {
  return `00:${String(Math.max(0, s)).padStart(2, '0')}`;
}

function spawnHeart() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pop';
  b.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  b.setAttribute('aria-label', 'Catch heart');

  // Inset from the edges so a heart never lands half-off the arena.
  b.style.left = `${8 + Math.random() * 76}%`;
  b.style.top  = `${10 + Math.random() * 72}%`;

  const remove = () => b.remove();
  const life = setTimeout(remove, 1150);

  b.addEventListener('click', (e) => {
    e.stopPropagation();                                   // don't re-trigger arena start
    if (!game.running) return;
    clearTimeout(life);
    b.classList.add('caught');
    setTimeout(remove, 300);
    game.score += 1;
    $('#statScore').textContent = game.score;
  });

  arena.appendChild(b);
}

function endGame() {
  game.running = false;
  clearInterval(game.tick);
  clearInterval(game.spawn);
  arena.classList.remove('running');
  $$('.pop').forEach((p) => p.remove());
  $('#arenaStart').textContent = 'Tap to play again 💗';

  const best = Math.max(game.score, Number(store.get('theju.best', 0)) || 0);
  store.set('theju.best', best);
  $('#statBest').textContent = best;

  $('#resultLine').innerHTML = game.score === 0
    ? `No hearts this time — but you showed up, and that counts. ♡`
    : `You caught <b>${game.score}</b> heart${game.score === 1 ? '' : 's'}!<br>That's amazing! ♥`;

  goto('s5');
}

function startGame() {
  if (game.running) return;
  game.running = true;
  game.score = 0;
  game.left = GAME_SECONDS;

  arena.classList.add('running');
  $('#statScore').textContent = '0';
  $('#statTime').textContent = fmtTime(game.left);

  game.tick = setInterval(() => {
    game.left -= 1;
    $('#statTime').textContent = fmtTime(game.left);
    if (game.left <= 0) endGame();
  }, 1000);

  game.spawn = setInterval(spawnHeart, 620);
  spawnHeart();
}

arena.addEventListener('click', startGame);

onEnter.s4 = () => {
  $('#statTime').textContent = fmtTime(GAME_SECONDS);
  $('#statScore').textContent = '0';
};

// Leaving the game screen mid-round must not leave timers running in the background.
$('#skipGame').addEventListener('click', () => {
  if (game.running) {
    game.running = false;
    clearInterval(game.tick);
    clearInterval(game.spawn);
    arena.classList.remove('running');
    $$('.pop').forEach((p) => p.remove());
  }
});

/* ── Screen 7 · Smile cards ─────────────────────────────── */

const smileCards = $$('.smile');

/**
 * What each card is committed to showing.
 *
 * Deliberately NOT read from the DOM: the new text only lands after the 250ms
 * fade, so two cards tapped in quick succession would both read the same stale
 * text and could pick the same replacement. Committing here, synchronously on
 * click, closes that window.
 */
const assigned = smileCards.map((_, i) => SMILES[i] || 'Tap me');

smileCards.forEach((card, i) => {
  const txt = card.querySelector('.txt');
  txt.textContent = assigned[i];

  card.addEventListener('click', () => {
    const spare = SMILES.filter((m) => !assigned.includes(m));
    // If the pool is ever exhausted, fall back to any other message rather
    // than freezing the card on its current one.
    const pool = spare.length ? spare : SMILES.filter((m) => m !== assigned[i]);
    const next = pool[Math.floor(Math.random() * pool.length)];
    assigned[i] = next;

    txt.classList.add('fading');
    setTimeout(() => {
      txt.textContent = next;
      txt.classList.remove('fading');
    }, 250);
  });
});

/* ── Go ─────────────────────────────────────────────────── */

goto('s1', { push: false });
