import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  choose,
  eventFor,
  evidence,
  endingHint,
  ENDINGS,
  choiceDisabled,
  validateSave,
  tick,
  patrols,
  patrolThreat,
  placeProgress,
  departureStatus,
  preparationPreview,
  choiceResources,
  relationshipPreview,
  companionSkillReady,
  conversationStatus,
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
test('conversation guidance follows actual remaining dialogue and new companions', () => {
  assert.equal(conversationStatus(fresh()).kind, 'unmet');
  const before = actions([
    ['engineering', 'pull'],
    ['fountain', 'cell'],
  ]);
  assert.equal(conversationStatus(before).remaining, 1);
  const after = actions([['fountain', 'talk-doha']], before);
  assert.equal(conversationStatus(after).kind, 'complete');
  assert.equal(conversationStatus(after).action, null);
  assert.equal(eventFor(after, 'fountain').choices.length, 0);
  assert.match(eventFor(after, 'fountain').body, /이야기를 모두 들었다/);
  const joined = actions([['radio', 'speak']], after);
  assert.equal(conversationStatus(joined).remaining, 1);
  assert.equal(conversationStatus(joined).kind, 'available');
});
test('conversation guidance includes cache prerequisites and real time boundaries', () => {
  const recruited = actions([['engineering', 'pull']]);
  const prepared = actions([['fountain', 'cell']], recruited);
  for (const [s, seconds, kind, minutes] of [
    [recruited, 120, 'prepare', 2],
    [recruited, 119, 'blocked', 2],
    [prepared, 60, 'available', 1],
    [prepared, 59, 'blocked', 1],
  ]) {
    const status = conversationStatus({ ...s, elapsed: 1800 - seconds });
    assert.equal(status.kind, kind);
    assert.equal(status.minutes, minutes);
    assert.equal(!!status.action, kind !== 'blocked');
  }
  const blocked = { ...prepared, elapsed: 1741 };
  assert.match(
    choiceDisabled(blocked, eventFor(blocked, 'fountain').choices[0]),
    /시간 부족/,
  );
  assert.deepEqual(placeProgress(blocked, 'fountain'), {
    kind: 'blocked',
    label: '대화 시간 부족',
  });
});
test('maximum trust does not consume dialogue and all three completed talks stay complete', () => {
  const s = {
    ...fresh(),
    flags: ['cache'],
    companions: ['seoyun', 'minjae', 'doha'],
    trust: { seoyun: 3, minjae: 3, doha: 3 },
  };
  Object.freeze(s.flags);
  Object.freeze(s.companions);
  Object.freeze(s.trust);
  Object.freeze(s);
  const before = structuredClone(s);
  assert.equal(conversationStatus(s).remaining, 3);
  assert.deepEqual(s, before);
  const after = actions(
    [
      ['fountain', 'talk-seoyun'],
      ['fountain', 'talk-minjae'],
      ['fountain', 'talk-doha'],
    ],
    s,
  );
  assert.equal(conversationStatus(after).kind, 'complete');
  assert.match(conversationStatus(after).detail, /기록에서 다시/);
  assert.equal(conversationStatus(after).action, null);
});
test('ending advice points collected evidence toward an unfinished broadcast', () => {
  const gathered = actions([
    ['library', 'power'],
    ['library', 'photo'],
    ['clinic', 'open'],
    ['clinic', 'record'],
  ]);
  const escaped = actions(
    [
      ['gate', 'pump'],
      ['gate', 'rush'],
    ],
    gathered,
  );
  assert.equal(escaped.ending, 'gate');
  assert.match(endingHint(escaped), /증거 2개.*공개 방송은 남았습니다/);
  const published = actions(
    [
      ['radio', 'speak'],
      ['radio', 'truth'],
      ['radio', 'leave'],
    ],
    gathered,
  );
  assert.equal(published.ending, 'truth');
  assert.equal(endingHint(published), ENDINGS.truth.tip);
  assert.equal(endingHint(gathered), '');
});
test('ending advice preserves failure help and uses the actual evidence count', () => {
  for (const id of Object.keys(ENDINGS)) {
    for (const items of [
      [],
      ['admin'],
      ['admin', 'medical'],
      ['admin', 'medical', 'system'],
    ]) {
      const s = {
        ...fresh(),
        mode: 'ending',
        ending: id,
        route: ['health', 'timeout'].includes(id) ? null : 'gate',
        items,
        flags: id === 'truth' ? ['truth'] : [],
      };
      const snapshot = structuredClone(s);
      if (s.route && items.length >= 2 && id !== 'truth')
        assert.match(endingHint(s), new RegExp(`증거 ${items.length}개`));
      else assert.equal(endingHint(s), ENDINGS[id].tip);
      assert.deepEqual(s, snapshot);
    }
  }
});
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
test('walking paths enter and leave narrow map edges without crossing buildings', () => {
  const edges = [
    { x: 62.9, y: 197.2 },
    { x: 55, y: 179 },
    { x: 70, y: 234.9 },
    { x: 71.1, y: 235.1 },
    { x: 73.9, y: 382 },
    { x: 74.1, y: 556.1 },
    { x: 925, y: 618 },
  ];
  for (const edge of edges)
    for (const place of PLACES)
      for (const [from, to] of [
        [edge, place],
        [place, edge],
      ]) {
        const route = pathTo(from, to);
        assert.ok(route.length, JSON.stringify({ from, to }));
        assert.deepEqual(route.at(-1), to);
        let previous = from;
        for (const point of route) {
          const samples = Math.ceil(
            Math.hypot(point.x - previous.x, point.y - previous.y),
          );
          for (let i = 1; i <= samples; i++)
            assert.ok(
              walkable(
                previous.x + ((point.x - previous.x) * i) / samples,
                previous.y + ((point.y - previous.y) * i) / samples,
              ),
              JSON.stringify({ from, to, previous, point }),
            );
          previous = point;
        }
      }
  const corner = pathTo({ x: 55, y: 234 }, { x: 71.2, y: 235.01 });
  assert.ok(
    corner.length > 1,
    'a route must go around even a shallow building corner',
  );
  assert.ok(corner.some((p) => p.y >= 235));
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

test('recruitment previews distinguish immediate support from trust-gated skills', () => {
  const s = fresh();
  for (const [place, id, trust, ready] of [
    ['clinic', 'hold', 1, true],
    ['engineering', 'pull', 1, false],
    ['engineering', 'cell', 2, true],
    ['radio', 'unplug', 1, false],
    ['radio', 'speak', 2, true],
  ]) {
    const ch = eventFor(s, place).choices.find((c) => c.id === id);
    const [preview] = relationshipPreview(s, ch);
    const actual = choose(s, place, id);
    assert.equal(preview.joining, true);
    assert.equal(preview.after, trust);
    assert.equal(preview.ready, ready);
    assert.equal(preview.after, actual.trust[preview.person]);
    assert.equal(preview.ready, companionSkillReady(actual, preview.person));
    if (place === 'clinic')
      assert.match(preview.ability, /동행 즉시 수문 통과 피해 8 감소/);
  }
  const doha = choose(s, 'engineering', 'pull');
  assert.equal(
    eventFor(doha, 'gate').choices.find((c) => c.id === 'manual').minutes,
    2,
  );
  const radio = { ...doha, companions: ['doha', 'minjae'] };
  assert.equal(
    eventFor(radio, 'radio').choices.find((c) => c.id === 'manual').health,
    0,
  );
});

test('conversation preview unlocks the correct skill and never repeats a spent dialogue hint', () => {
  const s = actions([
    ['radio', 'unplug'],
    ['fountain', 'cell'],
  ]);
  const ch = eventFor(s, 'fountain').choices.find(
    (c) => c.id === 'talk-minjae',
  );
  const [preview] = relationshipPreview(s, ch);
  assert.equal(preview.before, 1);
  assert.equal(preview.after, 2);
  assert.equal(preview.unlocked, true);
  assert.match(preview.ability, /최초 구조 송신 전력 2 → 1/);
  const actual = choose(s, 'fountain', ch.id);
  assert.equal(
    eventFor(actual, 'radio').choices.find((c) => c.id === 'rescue').power,
    -1,
  );
  assert.ok(!eventFor(actual, 'fountain').choices.some((c) => c.id === ch.id));
  const low = { ...s, trust: { ...s.trust, minjae: 0 } };
  const [spent] = relationshipPreview(low, ch);
  assert.match(spent.ability, /광장 대화 완료/);
  assert.doesNotMatch(spent.ability, /광장 대화 가능/);
});

test('maximum trust preserves other dialogue rewards without claiming a new unlock', () => {
  for (const trust of [2, 3]) {
    const s = {
      ...fresh(),
      companions: ['doha'],
      flags: ['cache'],
      trust: { seoyun: 0, minjae: 0, doha: trust },
    };
    const ch = eventFor(s, 'fountain').choices[0];
    const [preview] = relationshipPreview(s, ch);
    assert.equal(preview.after, 3);
    assert.equal(preview.delta, 3 - trust);
    assert.equal(preview.unlocked, false);
    assert.match(preview.ability, /유지/);
    assert.equal(choiceDisabled(s, ch), undefined);
    assert.equal(choose(s, 'fountain', ch.id).alert, 6);
  }
});

test('relationship preview leaves frozen input untouched and requires companionship', () => {
  const s = fresh();
  Object.freeze(s.trust);
  Object.freeze(s.companions);
  Object.freeze(s.flags);
  Object.freeze(s);
  const ch = eventFor(s, 'engineering').choices[0];
  const original = JSON.stringify(s);
  relationshipPreview(s, ch);
  assert.equal(JSON.stringify(s), original);
  assert.equal(
    companionSkillReady({ ...s, trust: { ...s.trust, doha: 3 } }, 'doha'),
    false,
  );
});

test('resource preview gives capped recovery, charge and alert outcomes', () => {
  const full = fresh();
  const bandage = eventFor(full, 'fountain').choices.find(
    (c) => c.id === 'bandage',
  );
  assert.deepEqual(choiceResources(full, bandage), {
    health: 100,
    power: 3,
    alert: 0,
  });
  const cell = eventFor(full, 'fountain').choices.find((c) => c.id === 'cell');
  assert.deepEqual(choiceResources({ ...full, power: 8 }, cell), {
    health: 100,
    power: 9,
    alert: 12,
  });
  assert.deepEqual(
    choiceResources({ ...full, health: 90, alert: 20 }, bandage),
    { health: 100, power: 3, alert: 5 },
  );
  const glass = eventFor(full, 'library').choices.find((c) => c.id === 'break');
  assert.deepEqual(choiceResources({ ...full, alert: 95 }, glass), {
    health: 94,
    power: 3,
    alert: 100,
  });
});

test('resource preview matches actual choices without altering input state', () => {
  for (const health of [20, 90, 100])
    for (const power of [0, 8, 9])
      for (const alert of [0, 12, 98]) {
        const s = { ...fresh(), health, power, alert };
        const original = JSON.stringify(s);
        for (const place of PLACES)
          for (const choice of eventFor(s, place.id).choices) {
            if (choiceDisabled(s, choice)) continue;
            const preview = choiceResources(s, choice);
            const actual = choose(s, place.id, choice.id);
            assert.deepEqual(preview, {
              health: actual.health,
              power: actual.power,
              alert: actual.alert,
            });
          }
        assert.equal(JSON.stringify(s), original);
      }
});

test('departure cards and place markers agree at each route time boundary', () => {
  const cases = [
    ['gate', { flags: ['gate-open'] }, 2],
    ['shuttle', { flags: ['shuttle-ready'] }, 1],
    ['radio', { flags: ['signal'], companions: ['minjae'] }, 3],
  ];
  for (const [place, extra, minutes] of cases) {
    for (const offset of [-1, 0, 1]) {
      const s = { ...fresh(), ...extra, elapsed: 1800 - minutes * 60 + offset };
      const status = departureStatus(s, place);
      assert.equal(status.minutes, minutes);
      assert.equal(status.canDepart, offset <= 0);
      assert.equal(
        status.canDepart,
        eventFor(s, place).choices.some(
          (c) => c.route && !choiceDisabled(s, c),
        ),
      );
      assert.equal(
        placeProgress(s, place).kind,
        offset <= 0 ? 'ready' : 'blocked',
      );
      if (offset > 0) assert.match(status.reason, /출발 시간 부족/);
    }
  }
});

test('preparation preview warns before a dead-end commitment without blocking it', () => {
  const s = {
    ...fresh(),
    companions: ['minjae'],
    trust: { seoyun: 0, minjae: 2, doha: 0 },
    elapsed: 1500,
  };
  const ch = eventFor(s, 'radio').choices.find((c) => c.id === 'rescue');
  const original = JSON.stringify(s);
  assert.deepEqual(preparationPreview(s, 'radio', ch), {
    minutes: 3,
    insufficient: false,
  });
  const late = { ...s, elapsed: 1501 };
  assert.deepEqual(preparationPreview(late, 'radio', ch), {
    minutes: 3,
    insufficient: true,
  });
  assert.equal(choiceDisabled(late, ch), undefined);
  assert.notStrictEqual(choose(late, 'radio', ch.id), late);
  assert.equal(JSON.stringify(s), original, 'preview never mutates the game');
  const escape = { ...s, flags: ['signal'] };
  assert.equal(
    preparationPreview(escape, 'radio', eventFor(escape, 'radio').choices[0]),
    null,
  );
});

test('departure estimates respect health costs and companion help', () => {
  const gate = { ...fresh(), flags: ['gate-open'], health: 1 };
  assert.equal(departureStatus(gate, 'gate').minutes, 6);
  assert.equal(departureStatus({ ...gate, health: 19 }, 'gate').minutes, 4);
  assert.equal(departureStatus({ ...gate, health: 35 }, 'gate').minutes, 2);
  assert.equal(
    departureStatus({ ...gate, health: 27, companions: ['seoyun'] }, 'gate')
      .minutes,
    2,
  );
  const s = { ...fresh(), health: 1, elapsed: 1500 };
  const pump = eventFor(s, 'gate').choices.find((c) => c.id === 'pump');
  assert.deepEqual(preparationPreview(s, 'gate', pump), {
    minutes: 6,
    insufficient: true,
  });
});

test('location status tracks remaining investigation, returning conversations and usable departures', () => {
  let s = actions([['library', 'power']]);
  assert.equal(placeProgress(s, 'library').label, '추가 조사');
  s = actions([['library', 'photo']], s);
  assert.equal(placeProgress(s, 'library').label, '조사 완료');
  s = actions([['fountain', 'cell']], s);
  assert.equal(placeProgress(s, 'fountain').label, '휴식 광장');
  s = actions([['engineering', 'cell']], s);
  assert.equal(placeProgress(s, 'fountain').label, '대화 가능');
  s = actions([['shuttle', 'doha']], s);
  assert.equal(placeProgress(s, 'shuttle').label, '출발 가능');
  assert.equal(
    placeProgress(
      { ...s, health: 1, elapsed: 1740, flags: ['gate-open'] },
      'gate',
    ).label,
    '출발 조건 부족',
  );
});

test('new evidence highlights an available additional broadcast after a rescue signal', () => {
  const s = actions([
    ['radio', 'speak'],
    ['radio', 'rescue'],
    ['library', 'power'],
    ['library', 'photo'],
    ['clinic', 'open'],
    ['clinic', 'record'],
  ]);
  assert.equal(placeProgress(s, 'radio').label, '추가 방송 가능');
});

test('choice receipts record actual capped changes and preserve the patrol clock', () => {
  const s = actions([['fountain', 'bandage']]);
  assert.deepEqual(s.log.at(-1).changes, [
    '시간 −2분',
    '체력 변화 없음 (100)',
    '경계 −12',
  ]);
  assert.equal(s.log.at(-1).place, 'fountain');
  assert.ok(s.log.at(-1).action);
  assert.equal(s.worldTime, 0);
  const power = actions([['fountain', 'cell']], { ...fresh(), power: 8 });
  assert.deepEqual(power.log.at(-1).changes, ['시간 −1분', '전력 +1']);
});

test('brief patrol contact warns without damage, escape resets exposure, and lingering causes damage', () => {
  const p = patrols(0)[0];
  let s = { ...fresh(), ...p };
  assert.equal(patrolThreat(s).level, 'exposed');
  s = tick(s, 0.5, false, false);
  assert.equal(s.health, 100);
  assert.equal(s.exposure, 0.5);
  const out = tick({ ...s, x: 100, y: 300 }, 0.05, true, false);
  assert.equal(out.exposure, 0);
  const reenter = tick(
    { ...out, ...patrols(out.worldTime)[0] },
    0.5,
    false,
    false,
  );
  assert.equal(reenter.health, 100);
  assert.equal(reenter.exposure, 0.5);
  const hit = tick(reenter, 0.31, false, false);
  assert.equal(hit.health, 93);
  assert.equal(hit.log.at(-1).action, '순찰에 노출');
  assert.equal(tick(hit, 0.05, false, false).health, 93);
});

test('old saves migrate without losing history and new warning data is validated', () => {
  const {
    worldTime: _worldTime,
    exposure: _exposure,
    ...old
  } = {
    ...fresh(),
    elapsed: 900,
    log: [{ at: 0, text: '이전 기록' }],
  };
  const restored = validateSave(old);
  assert.equal(restored.worldTime, 300);
  assert.equal(restored.exposure, 0);
  assert.deepEqual(restored.log, old.log);
  for (const extra of [
    { worldTime: Infinity },
    { exposure: 1 },
    { log: [{ at: 1, text: '기록', changes: [{}] }] },
    { log: [{ at: 1, text: '기록', place: 'missing' }] },
  ])
    assert.equal(validateSave({ ...fresh(), ...extra }), null);
});

test('simultaneous patrol death and deadline, including migrated saves, remain loadable', () => {
  const time = 1799.99 / 3;
  const before = {
    ...fresh(),
    ...patrols(time)[0],
    elapsed: 1799.99,
    worldTime: time,
    exposure: 0.8,
    health: 1,
  };
  assert.ok(validateSave(before));
  const after = tick(before, 0.02, false, false);
  assert.equal(after.ending, 'health');
  assert.equal(after.elapsed, 1800);
  assert.equal(after.worldTime, 600);
  assert.ok(validateSave(JSON.parse(JSON.stringify(after))));
  const timeout = tick({ ...before, x: 100, y: 300 }, 0.02, false, false);
  assert.equal(timeout.ending, 'timeout');
  assert.ok(validateSave(timeout));
});
