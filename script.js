/* ═══════════════════════════════════════════════════════════
   EDIT THIS BLOCK — nothing below it needs touching.
   ═══════════════════════════════════════════════════════════ */

const HER_NAME   = 'Theju';
const NICKNAME   = 'Rakshashi';    // the teasing one, used where you're joking
const PET_NAME   = 'dii';          // the soft one, used where you're being gentle
const SICK_START = '2026-09-14';   // the day she got sick, YYYY-MM-DD
const RECOVERY_DAYS = 7;           // the arc the "Good Health Loading" bar fills over

// Screen 3 — the prescription doses.
// Shown in exactly this order, one per tap, wrapping back to the top at the end.
// Reorder this list to change the sequence she reads them in.
const PRESCRIPTIONS = [
  "I can't see those beautiful eyes turning red, and that smile hiding under a mask.",
  "Tell me honestly how you're feeling. Not the \"I'm fine\" version. The real one.",
  "I wish I could take this from you and carry it myself for a day.",
  "I'm worried about you. That's not me being dramatic, that's just where my head is.",
  `I don't need you to be okay right now, ${PET_NAME}. I just need you to let yourself heal.`,
  "Drink water. Take the medicine. Text me when you've done both.",
  "Every time my phone lights up I hope it's you saying you feel better.",
  "Your favourite hobby is pushing me into trauma — and I'd take a hundred rounds of it over one more day of you like this.",
  `Get well soon, ${NICKNAME}. Nobody has terrorised me in days and I don't like it.`,
];

// Screen 5 — six cards, each with a fixed pair: what she sees, and the
// punchline hidden underneath it. Nothing is shuffled; card 1 always holds
// pair 1. Tapping toggles between the two, so she can always get back.
// Array order = grid order. The card colours and icons stay where they are.
const CARDS = [
  {
    front: "The chocolates are waiting. I am guarding them. Barely.",
    back:  "I'm off sugar, so all of them are yours. The restraint is killing me.",
  },
  {
    front: "Your toys are waiting. Two of them asked about you.",
    back:  "I told them you're resting. They did not believe me.",
  },
  {
    front: "The whole world is waiting for you. (I am the whole world. Obviously.)",
    back:  "The world is getting impatient. The world misses you.",
  },
  {
    front: "Your pending arguments with me are waiting. I've kept a list. It's long.",
    back:  "You'll probably win all of them. I've made peace with it.",
  },
  {
    front: "The trauma you keep pushing me into is also waiting. Very patiently.",
    back:  "It says take your time. I say the same, but less patiently.",
  },
  {
    front: "I have been undefeated in arguments for days now. It's boring.",
    back:  `Winning against nobody is just talking to myself. Come back, ${NICKNAME}.`,
  },
];

/* ═══════════════════════════════════════════════════════════
   Below here: the machinery.
   ═══════════════════════════════════════════════════════════ */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/**
 * Swap the placeholder names throughout the markup.
 * Walks text nodes rather than rewriting innerHTML — an innerHTML swap would
 * rebuild every element and silently drop the listeners wired up below.
 * Runs first, before anything is bound.
 */
function renameAll() {
  const swaps = [['Theju', HER_NAME], ['Rakshashi', NICKNAME], ['dii', PET_NAME]]
    .filter(([placeholder, value]) => placeholder !== value)
    // Whole words only. "dii" is three lowercase letters — a plain substring
    // swap would happily rewrite it inside some unrelated word later on.
    .map(([placeholder, value]) => [new RegExp(`\\b${placeholder}\\b`, 'g'), value]);
  if (!swaps.length) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    for (const [pattern, value] of swaps) {
      if (pattern.test(n.nodeValue)) {
        pattern.lastIndex = 0;                      // /g regexes carry state
        n.nodeValue = n.nodeValue.replace(pattern, value);
      }
      pattern.lastIndex = 0;
    }
  }
}

renameAll();
document.title = `${HER_NAME}'s Little Recovery Corner 💗`;

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

// Straight through the list in order, wrapping at the end.
let rxIndex = 0;
rxText.textContent = PRESCRIPTIONS[0];

$('#rxBtn').addEventListener('click', () => {
  // Advance immediately rather than inside the timeout, so a fast double-tap
  // moves two doses forward instead of racing on a stale index.
  rxIndex = (rxIndex + 1) % PRESCRIPTIONS.length;
  const next = PRESCRIPTIONS[rxIndex];

  rxText.classList.add('fading');
  setTimeout(() => {
    rxText.textContent = next;
    rxText.classList.remove('fading');
  }, 300);                                                 // matches the CSS transition
});

/* ── Screen 5 · Smile cards ─────────────────────────────── */

$$('.smile').forEach((card, i) => {
  const pair = CARDS[i];
  if (!pair) return;                                    // more cards than pairs: leave blank

  const txt  = card.querySelector('.txt');
  const hint = card.querySelector('.hint');
  let showingBack = false;

  txt.textContent = pair.front;

  card.addEventListener('click', () => {
    showingBack = !showingBack;

    // Flip state is committed immediately; only the paint waits for the fade,
    // so a fast double-tap can't land the card on the wrong face.
    card.classList.toggle('flipped', showingBack);
    card.setAttribute('aria-pressed', String(showingBack));
    hint.textContent = showingBack ? '↩ back' : 'tap ♡';

    txt.classList.add('fading');
    setTimeout(() => {
      txt.textContent = showingBack ? pair.back : pair.front;
      txt.classList.remove('fading');
    }, 200);
  });
});

/* ── Go ─────────────────────────────────────────────────── */

goto('s1', { push: false });
