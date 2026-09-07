import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  choose,
  eventFor,
  evidence,
  choiceDisabled,
  validateSave,
  tick,
  patrols,
  pathTo,
  PLACES,
  walkable,
} from '../lib/game.ts';
const fresh = () => ({ ...initialState(), mode: 'playing' });
const actions = (moves, initial = fresh()) =>
  moves.reduce((s, [place, id]) => {
    const ch = eventFor(s, place).choices.find((c) => c.id === id);
    assert.ok(ch, `${place}/${id} exists`);
    assert.equal(choiceDisabled(s, ch), undefined, `${place}/${id} enabled`);
    const n = choose(s, place, id);
    assert.notStrictEqual(n, s);
    return n;
  }, initial);
test('all five successful ending families are reachable through valid decisions', () => {
  const cases = [
    [
      'gate',
      [
        ['gate', 'pump'],
        ['gate', 'rush'],
      ],
    ],
    [
      'shuttle',
      [
        ['engineering', 'cell'],
        ['shuttle', 'doha'],
        ['shuttle', 'leave'],
      ],
    ],
    [
      'radio',
      [
        ['radio', 'speak'],
        ['radio', 'rescue'],
        ['radio', 'leave'],
      ],
    ],
    [
      'truth',
      [
        ['library', 'power'],
        ['library', 'photo'],
        ['clinic', 'open'],
        ['clinic', 'record'],
        ['radio', 'speak'],
        ['radio', 'truth'],
        ['radio', 'leave'],
      ],
    ],
    [
      'together',
      [
        ['clinic', 'open'],
        ['engineering', 'cell'],
        ['radio', 'speak'],
        ['radio', 'all'],
        ['radio', 'leave'],
      ],
    ],
  ];
  for (const [ending, moves] of cases) {
    const s = actions(moves);
    assert.equal(s.mode, 'ending');
    assert.equal(s.ending, ending);
    assert.ok(s.health > 0);
    assert.ok(s.elapsed <= 1800);
  }
});
test('time and patrol exposure produce distinct failure endings', () => {
  const timeout = tick({ ...fresh(), elapsed: 1799 }, 1, false, false);
  assert.equal(timeout.ending, 'timeout');
  const p = patrols(1)[0];
  const loss = tick({ ...fresh(), x: p.x, y: p.y, health: 1 }, 1, false, false);
  assert.equal(loss.ending, 'health');
});
test('escape exactly at the deadline succeeds', () => {
  const s = actions(
    [
      ['gate', 'pump'],
      ['gate', 'rush'],
    ],
    { ...fresh(), elapsed: 1620 },
  );
  assert.equal(s.elapsed, 1800);
  assert.equal(s.ending, 'gate');
});
test('unaffordable decisions are inert and explain the reason', () => {
  const s = { ...fresh(), power: 0 };
  assert.match(choiceDisabled(s, eventFor(s, 'library').choices[0]), /전력/);
  assert.strictEqual(choose(s, 'library', 'power'), s);
  assert.strictEqual(choose(s, 'library', 'does-not-exist'), s);
});
test('low health and no power still allow each escape route', () => {
  const low = { ...fresh(), health: 1, power: 0 };
  assert.equal(
    actions(
      [
        ['gate', 'manual'],
        ['gate', 'slow'],
      ],
      low,
    ).ending,
    'gate',
  );
  assert.equal(
    actions(
      [
        ['shuttle', 'manual'],
        ['shuttle', 'leave'],
      ],
      low,
    ).ending,
    'shuttle',
  );
  assert.equal(
    actions(
      [
        ['radio', 'unplug'],
        ['radio', 'manual'],
        ['radio', 'leave'],
      ],
      low,
    ).ending,
    'radio',
  );
});
test('repeated choices do not duplicate consumables or companions', () => {
  let s = actions([['fountain', 'cell']]);
  assert.strictEqual(choose(s, 'fountain', 'cell'), s);
  s = actions(
    [
      ['engineering', 'cell'],
      ['engineering', 'charge'],
    ],
    s,
  );
  assert.strictEqual(choose(s, 'engineering', 'charge'), s);
  assert.equal(new Set(s.items).size, s.items.length);
  assert.equal(s.companions.length, 1);
});
test('trust conversations change technology options and can only happen once', () => {
  let s = actions([['engineering', 'pull']]);
  assert.ok(
    choiceDisabled(
      s,
      eventFor(s, 'shuttle').choices.find((c) => c.id === 'doha'),
    ),
  );
  s = actions(
    [
      ['fountain', 'cell'],
      ['fountain', 'talk-doha'],
    ],
    s,
  );
  assert.equal(s.trust.doha, 2);
  assert.strictEqual(choose(s, 'fountain', 'talk-doha'), s);
  assert.equal(
    choiceDisabled(
      s,
      eventFor(s, 'shuttle').choices.find((c) => c.id === 'doha'),
    ),
    undefined,
  );
});
test('minjae trust reduces transmission power cost', () => {
  let s = actions([['radio', 'unplug']]);
  assert.equal(
    eventFor(s, 'radio').choices.find((c) => c.id === 'rescue').power,
    -2,
  );
  s = actions(
    [
      ['fountain', 'cell'],
      ['fountain', 'talk-minjae'],
    ],
    s,
  );
  assert.equal(
    eventFor(s, 'radio').choices.find((c) => c.id === 'rescue').power,
    -1,
  );
});
test('missed evidence can be recovered, and broadcast can be upgraded later', () => {
  const s = actions([
    ['clinic', 'help'],
    ['clinic', 'supplies'],
    ['clinic', 'take'],
    ['library', 'careful'],
    ['library', 'photo'],
    ['radio', 'speak'],
    ['radio', 'rescue'],
    ['radio', 'extra-truth'],
    ['radio', 'leave'],
  ]);
  assert.equal(evidence(s), 2);
  assert.equal(s.ending, 'truth');
});
test('all places are walkable and reachable from every other place', () => {
  for (const a of PLACES)
    for (const b of PLACES) {
      assert.ok(walkable(a.x, a.y), a.id);
      const route = pathTo(a, b);
      assert.ok(route.length, `${a.id} -> ${b.id}`);
      for (const p of route) assert.ok(walkable(p.x, p.y));
      assert.equal(route.at(-1).x, b.x);
      assert.equal(route.at(-1).y, b.y);
    }
});
test('running costs focus and increases alert; walking restores focus', () => {
  const base = { ...fresh(), x: 100, y: 300, focus: 50 };
  const run = tick(base, 1, true, true),
    walk = tick(base, 1, true, false);
  assert.ok(run.focus < base.focus);
  assert.ok(run.alert > base.alert);
  assert.ok(walk.focus > base.focus);
});
test('save validates legitimate exploration and finished games', () => {
  const s = actions([['library', 'power']]);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))), s);
  assert.ok(
    validateSave(
      actions([
        ['gate', 'pump'],
        ['gate', 'rush'],
      ]),
    ),
  );
});
test('corrupt saves cannot crash UI or violate gameplay invariants', () => {
  const s = fresh();
  for (const extra of [
    { lastEvent: {} },
    { companions: ['toString'] },
    { items: ['admin', 'admin'] },
    { items: ['__proto__'] },
    { mode: 'ending', ending: 'toString' },
    { power: 0.5 },
    { trust: { seoyun: -1, minjae: 0, doha: 0 } },
    { trust: { seoyun: 4, minjae: 0, doha: 0 } },
    { damageCooldown: Infinity },
    { damageCooldown: 'Infinity' },
    { route: 'not-a-route' },
    { log: [{ at: 1, text: {} }] },
    { x: NaN },
    { elapsed: 1801 },
    { health: 0 },
    { flags: ['x', 'x'] },
  ])
    assert.equal(validateSave({ ...s, ...extra }), null, JSON.stringify(extra));
  assert.equal(validateSave(null), null);
  assert.equal(validateSave('broken'), null);
});
test('evidence always counts distinct sources', () =>
  assert.equal(evidence({ ...fresh(), items: ['admin', 'admin'] }), 1));
