'use client';
/* eslint-disable react/react-compiler -- This canvas game deliberately syncs a mutable frame simulation into React snapshots and hydrates device-local storage. */
/* eslint-disable next/no-img-element -- The fixed game-map bitmap must share exact native coordinates with the canvas overlay; it is not a responsive editorial image. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Radio,
  VolumeX,
  Volume2,
  HelpCircle,
  Moon,
  MapPin,
  Heart,
  Zap,
  Footprints,
  Backpack,
  BookOpen,
  Route as RouteIcon,
  Pause,
  Play,
  X,
  Users,
  Check,
  LockKeyhole,
  ChevronRight,
  Clock3,
  RotateCcw,
  ShieldAlert,
  Compass,
  Trophy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  initialState,
  PLACES,
  PEOPLE,
  ITEM_NAMES,
  ITEM_GUIDES,
  ENDINGS,
  has,
  evidence,
  endingHint,
  timeText,
  eventFor,
  choose,
  choiceDisabled,
  nearestPlace,
  walkable,
  pathTo,
  patrols,
  patrolRadius,
  patrolThreat,
  EXPOSURE_GRACE,
  placeProgress,
  departureStatus,
  preparationPreview,
  choiceResources,
  relationshipPreview,
  conversationStatus,
  tick,
  validateSave,
  type GameState,
  type PlaceId,
  type Choice,
  type Companion,
} from '@/lib/game';
const SAVE_KEY = 'blue-hour-save-v1',
  COLLECTION_KEY = 'blue-hour-endings-v1';
type Panel =
  | 'event'
  | 'help'
  | 'journal'
  | 'routes'
  | 'inventory'
  | 'pause'
  | 'collection'
  | 'restart'
  | null;
type Point = { x: number; y: number };
type GameWindow = Window & {
  render_game_to_text?: () => string;
  advanceTime?: (ms: number) => void;
  blueHour?: {
    read: () => GameState;
    navigate: (id: PlaceId) => boolean;
    interact: () => boolean;
    select: (id: string) => boolean;
    resume: () => void;
  };
};
export default function Home() {
  const [state, setState] = useState<GameState>(initialState);
  const ref = useRef(state);
  const [panel, setPanel] = useState<Panel>(null);
  const panelRef = useRef<Panel>(null);
  const [place, setPlace] = useState<PlaceId>('fountain');
  const placeRef = useRef<PlaceId>('fountain');
  const [receipt, setReceipt] = useState('');
  const receiptRef = useRef('');
  const [saved, setSaved] = useState<GameState | null>(null);
  const [collection, setCollection] = useState<string[]>([]);
  const [storageNote, setStorageNote] = useState('');
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const [run, setRun] = useState(false);
  const runRef = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const endingTitle = useRef<HTMLHeadingElement>(null);
  const endingFromDialog = useRef(false);
  const keys = useRef(new Set<string>());
  const path = useRef<Point[]>([]);
  const destination = useRef<PlaceId | null>(null);
  const [travel, setTravel] = useState('');
  const focused = useRef(true);
  const update = useCallback((s: GameState) => {
    ref.current = s;
    setState(s);
  }, []);
  const openPanel = useCallback((p: Panel) => {
    if (p !== null) endingFromDialog.current = false;
    panelRef.current = p;
    setPanel(p);
    keys.current.clear();
    receiptRef.current = '';
    setReceipt('');
  }, []);
  const dismissPanel = useCallback(() => {
    openPanel(
      panelRef.current === 'restart' && ref.current.mode === 'playing'
        ? 'pause'
        : null,
    );
  }, [openPanel]);
  const save = useCallback((s: GameState) => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      setSaved(s);
    } catch {
      setStorageNote(
        '이 브라우저에서는 저장할 수 없습니다. 현재 플레이는 계속할 수 있어요.',
      );
    }
  }, []);
  const openPlace = useCallback(
    (id: PlaceId) => {
      if (ref.current.mode !== 'playing') return;
      placeRef.current = id;
      setPlace(id);
      path.current = [];
      destination.current = null;
      setTravel('');
      openPanel('event');
    },
    [openPanel],
  );
  const navigate = useCallback((id: PlaceId) => {
    if (ref.current.mode !== 'playing' || panelRef.current) return false;
    const p = PLACES.find((v) => v.id === id);
    if (!p) return false;
    const points = pathTo(ref.current, p);
    if (!points.length) return false;
    path.current = points;
    destination.current = id;
    setTravel(p.name);
    return true;
  }, []);
  const interact = useCallback(() => {
    if (ref.current.mode !== 'playing' || panelRef.current) return false;
    const p = nearestPlace(ref.current);
    if (!p) return false;
    openPlace(p.id);
    return true;
  }, [openPlace]);
  const selectChoice = useCallback(
    (id: string) => {
      if (panelRef.current !== 'event' || receiptRef.current) return false;
      const next = choose(ref.current, placeRef.current, id);
      if (next === ref.current) return false;
      if (next.mode === 'ending') endingFromDialog.current = true;
      update(next);
      save(next);
      receiptRef.current = next.lastEvent;
      setReceipt(next.lastEvent);
      if (next.mode === 'ending') openPanel(null);
      return true;
    },
    [update, save, openPanel],
  );
  const start = useCallback(
    (resume = false) => {
      const s =
        resume && saved
          ? saved
          : {
              ...initialState(),
              mode: 'playing' as const,
              log: [
                {
                  at: 0,
                  text: '00:00. 해무대학교의 통신이 끊겼다. 구조 신호는 30분 뒤 종료된다.',
                },
              ],
            };
      update(s);
      save(s);
      if (!resume) {
        runRef.current = false;
        setRun(false);
      }
      path.current = [];
      setTravel('');
      if (resume) openPanel(null);
      else openPlace('fountain');
    },
    [saved, update, save, openPlace, openPanel],
  );
  useEffect(() => {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (text) {
        const valid = validateSave(JSON.parse(text));
        if (valid) setSaved(valid);
        else
          setStorageNote(
            '이전 저장 기록을 읽을 수 없습니다. 새로운 밤을 시작해 주세요.',
          );
      }
      const found = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
      if (Array.isArray(found))
        setCollection(
          found.filter(
            (x) => typeof x === 'string' && Object.hasOwn(ENDINGS, x),
          ),
        );
    } catch {
      setStorageNote(
        '저장 기록을 읽을 수 없습니다. 새 게임은 플레이할 수 있어요.',
      );
    }
  }, []);
  useEffect(() => {
    // A departing story dialog restores focus through finalFocus instead.
    if (state.mode !== 'ending') endingFromDialog.current = false;
    else if (!endingFromDialog.current) endingTitle.current?.focus();
  }, [state.mode, state.ending]);
  useEffect(() => {
    if (state.mode === 'ending' && state.ending) {
      try {
        const list = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
        const ids = Array.isArray(list)
          ? list.filter(
              (x) => typeof x === 'string' && Object.hasOwn(ENDINGS, x),
            )
          : [];
        const next = [...new Set([...ids, state.ending])];
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
        setCollection(next);
      } catch {
        setStorageNote('엔딩 기록을 저장할 수 없습니다.');
      }
      save(state);
    }
  }, [state, save]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (ref.current.mode === 'playing') save(ref.current);
    }, 4000);
    const persist = () => {
      if (ref.current.mode === 'playing') save(ref.current);
    };
    window.addEventListener('pagehide', persist);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', persist);
    };
  }, [save]);
  const step = useCallback(
    (dt: number) => {
      let s = ref.current;
      if (s.mode !== 'playing' || panelRef.current || !focused.current) return;
      let dx = 0,
        dy = 0;
      const k = keys.current;
      const keyboard =
        k.has('w') ||
        k.has('s') ||
        k.has('a') ||
        k.has('d') ||
        k.has('arrowup') ||
        k.has('arrowdown') ||
        k.has('arrowleft') ||
        k.has('arrowright');
      if (keyboard) {
        if (path.current.length || destination.current) setTravel('');
        path.current = [];
        destination.current = null;
        dx =
          (k.has('d') || k.has('arrowright') ? 1 : 0) -
          (k.has('a') || k.has('arrowleft') ? 1 : 0);
        dy =
          (k.has('s') || k.has('arrowdown') ? 1 : 0) -
          (k.has('w') || k.has('arrowup') ? 1 : 0);
      } else if (path.current.length) {
        const p = path.current[0];
        dx = p.x - s.x;
        dy = p.y - s.y;
        if (Math.hypot(dx, dy) < 5) {
          path.current.shift();
          if (!path.current.length && !destination.current) setTravel('');
          dx = 0;
          dy = 0;
        }
      }
      const moving = !!(dx || dy),
        running = (runRef.current || k.has('shift')) && s.focus > 5;
      const speed = running ? 170 : 105;
      const len = Math.hypot(dx, dy);
      if (len) {
        dx = (dx / len) * Math.min(speed * dt, len > 2 ? len : speed * dt);
        dy = (dy / len) * Math.min(speed * dt, len > 2 ? len : speed * dt);
        let x = s.x,
          y = s.y;
        if (walkable(x + dx, y)) x += dx;
        if (walkable(x, y + dy)) y += dy;
        s = { ...s, x, y };
      }
      ref.current = tick(s, dt, moving, running);
      if (ref.current.mode === 'ending') {
        path.current = [];
        destination.current = null;
        setTravel('');
        openPanel(null);
        update(ref.current);
        return;
      }
      if (destination.current && !path.current.length) {
        const dest = destination.current;
        destination.current = null;
        setTravel('');
        if (
          Math.hypot(
            ref.current.x - PLACES.find((p) => p.id === dest)!.x,
            ref.current.y - PLACES.find((p) => p.id === dest)!.y,
          ) < 45
        ) {
          update(ref.current);
          openPlace(dest);
        }
      }
    },
    [openPlace, openPanel, update],
  );
  useEffect(() => {
    let frame = 0,
      last = 0,
      lastUI = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      const s = ref.current,
        ctx = canvas.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 1000, 667);
        if (s.mode !== 'title') {
          const t = s.worldTime;
          for (const p of patrols(t)) {
            const radius = patrolRadius(s.alert);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#db9b6030';
            ctx.fill();
            ctx.strokeStyle = '#e0a36b80';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f0ae71';
            ctx.shadowColor = '#f0ae71';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#d7b08e';
            ctx.font = '11px Arial';
            ctx.fillText('순찰', p.x - 11, p.y - radius - 6);
          }
          if (path.current.length) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            for (const p of path.current) ctx.lineTo(p.x, p.y);
            ctx.setLineDash([3, 8]);
            ctx.strokeStyle = '#afe6d481';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, 24, 0, Math.PI * 2);
          ctx.strokeStyle = '#a7ddca88';
          ctx.lineWidth = 1;
          ctx.stroke();
          if (s.exposure > 0) {
            ctx.beginPath();
            ctx.arc(
              s.x,
              s.y,
              24,
              -Math.PI / 2,
              -Math.PI / 2 + (Math.PI * 2 * s.exposure) / EXPOSURE_GRACE,
            );
            ctx.strokeStyle = '#ffc78e';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = s.damageCooldown > 1.5 ? '#ed998b' : '#d9fff0';
          ctx.shadowColor = '#9effd3';
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ecfff8';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('나', s.x, s.y - 31);
          ctx.textAlign = 'left';
          s.companions.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(s.x - 12 + i * 12, s.y + 18, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = PEOPLE[p].color;
            ctx.fill();
          });
          if (!reducedMotion.matches) {
            ctx.strokeStyle = '#c5e8ed22';
            ctx.lineWidth = 1;
            for (let i = 0; i < 60; i++) {
              const x = (i * 137 + t * 18) % 1000,
                y = (i * 71 + t * 120) % 667;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x - 3, y + 10);
              ctx.stroke();
            }
          }
        }
      }
      if (
        now - lastUI > 130 &&
        ref.current.mode === 'playing' &&
        !panelRef.current
      ) {
        lastUI = now;
        setState({ ...ref.current });
      }
      if (
        ref.current.mode === 'playing' &&
        !panelRef.current &&
        focused.current &&
        !document.hidden
      )
        frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [step, state.mode, panel]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.defaultPrevented ||
        target.closest(
          'input,textarea,select,[contenteditable=true],[role=tab],[role=slider]',
        )
      )
        return;
      const key = e.key.toLowerCase();
      if (panelRef.current) {
        return;
      }
      if (ref.current.mode !== 'playing') return;
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          'shift',
        ].includes(key)
      ) {
        e.preventDefault();
        keys.current.add(key);
      }
      if (!e.repeat) {
        if (key === 'e') {
          e.preventDefault();
          interact();
        }
        if (key === 'escape' || key === 'p') {
          e.preventDefault();
          openPanel('pause');
        }
        if (key === 'g') {
          e.preventDefault();
          openPanel('routes');
        }
        if (key === 'i') {
          e.preventDefault();
          openPanel('inventory');
        }
        if (key === 'j') {
          e.preventDefault();
          openPanel('journal');
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => {
      keys.current.clear();
      focused.current = false;
      void audioRef.current?.suspend();
      if (ref.current.mode === 'playing' && !panelRef.current)
        openPanel('pause');
    };
    const focus = () => {
      focused.current = true;
      if (soundRef.current) void audioRef.current?.resume();
    };
    const visibility = () => (document.hidden ? blur() : focus());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [interact, openPanel]);
  useEffect(() => {
    const w = window as GameWindow;
    w.render_game_to_text = () =>
      JSON.stringify({
        mode: ref.current.mode,
        coordinates: 'top-left origin; x right, y down; world 1000×667',
        player: { x: Math.round(ref.current.x), y: Math.round(ref.current.y) },
        timeLeft: timeText(1800 - ref.current.elapsed),
        health: Math.round(ref.current.health),
        power: ref.current.power,
        alert: Math.round(ref.current.alert),
        companions: ref.current.companions,
        trust: ref.current.trust,
        items: ref.current.items,
        flags: ref.current.flags,
        nearby: nearestPlace(ref.current)?.id,
        panel: panelRef.current,
        event:
          panelRef.current === 'event'
            ? eventFor(ref.current, placeRef.current).id
            : null,
        ending: ref.current.ending,
        patrol: {
          ...patrolThreat(ref.current),
          exposure: ref.current.exposure,
        },
        locations: PLACES.map((loc) => ({
          id: loc.id,
          ...placeProgress(ref.current, loc.id),
        })),
      });
    w.advanceTime = (ms) => {
      const n = Math.max(0, Math.min(300000, ms));
      for (let i = 0; i < n; i += 50) step(Math.min(50, n - i) / 1000);
      update({ ...ref.current });
    };
    w.blueHour = {
      read: () => ref.current,
      navigate,
      interact,
      select: selectChoice,
      resume: () => openPanel(null),
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    const life = new AbortController();
    if (context?.registerTool) {
      try {
        for (const tool of [
          {
            name: 'read_game_state',
            description:
              'Read current survival state and available local interactions.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: () => JSON.parse(w.render_game_to_text!()),
          },
          {
            name: 'navigate_to_campus_location',
            description:
              'Walk to a named campus location and open its interaction on arrival. Time and patrol risk continue while travelling.',
            inputSchema: {
              type: 'object',
              properties: {
                location: { type: 'string', enum: PLACES.map((p) => p.id) },
              },
              required: ['location'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const value = input as { location?: PlaceId };
              if (
                !value?.location ||
                !PLACES.some((p) => p.id === value.location)
              )
                throw new Error('Unknown location');
              if (!navigate(value.location))
                throw new Error('Start or resume exploration first');
              return { status: 'walking', location: value.location };
            },
          },
        ])
          Promise.resolve(
            context.registerTool(tool, { signal: life.signal }),
          ).catch(() => {});
      } catch {}
    }
    return () => {
      life.abort();
      delete w.render_game_to_text;
      delete w.advanceTime;
      delete w.blueHour;
    };
  }, [step, update, navigate, interact, selectChoice, openPanel]);
  const toggleSound = () => {
    const next = !sound;
    try {
      if (!audioRef.current) {
        const a = new AudioContext();
        audioRef.current = a;
        const g = a.createGain();
        g.gain.value = 0.016;
        g.connect(a.destination);
        [55, 82.4].forEach((f) => {
          const o = a.createOscillator();
          o.frequency.value = f;
          o.type = 'sine';
          o.connect(g);
          o.start();
        });
      }
      if (next) void audioRef.current.resume();
      else void audioRef.current.suspend();
      soundRef.current = next;
      setSound(next);
    } catch {
      setStorageNote('이 브라우저에서는 소리를 재생할 수 없습니다.');
    }
  };
  useEffect(
    () => () => {
      void audioRef.current?.close();
    },
    [],
  );
  const p = PLACES.find((v) => v.id === place)!;
  const near = nearestPlace(state);
  const threat = patrolThreat(state);
  const progress = Object.fromEntries(
    PLACES.map((loc) => [loc.id, placeProgress(state, loc.id)]),
  ) as Record<PlaceId, ReturnType<typeof placeProgress>>;
  const story = eventFor(state, place);
  const ending = state.ending ? ENDINGS[state.ending] : null;
  const remaining = timeText(1800 - state.elapsed).split(':');
  const playing = state.mode === 'playing';
  const routeStatus = [
    {
      id: 'shuttle' as PlaceId,
      title: '해안도로 · 셔틀',
      hint: has(state, 'shuttle-ready')
        ? '시동 완료. 차고에서 출발하세요.'
        : state.companions.includes('doha') && state.trust.doha >= 2
          ? '도하가 수리할 수 있어요.'
          : '공학관 부품 · 도하 · 수동 정비 중 선택',
    },
    {
      id: 'gate' as PlaceId,
      title: '방파제 · 지하 수문',
      hint: has(state, 'gate-open')
        ? '통로 개방. 건너는 방법을 고르세요.'
        : state.items.includes('map')
          ? '도면 확보. 남문에서 열 수 있어요.'
          : '도서관 도면 · 전력 · 수동 밸브 중 선택',
    },
    {
      id: 'radio' as PlaceId,
      title: '안개 위 · 옥상 구조',
      hint: has(state, 'signal')
        ? '신호 수신 완료. 옥상으로 올라가세요.'
        : '방송실에서 동료와 구조 신호 송출',
    },
  ].map((route) => {
    const departure = departureStatus(state, route.id);
    return {
      ...route,
      ready: departure.canDepart,
      blocked: departure.prepared && !departure.canDepart,
      hint: departure.prepared
        ? (departure.reason ??
          `출발 가능 · 현재 조건에서 최소 ${departure.minutes}분 필요`)
        : route.hint,
    };
  });
  const goFromPanel = (id: PlaceId) => {
    openPanel(null);
    navigate(id);
  };
  const routeCards = () =>
    routeStatus.map((r) => (
      <button
        key={r.id}
        className={
          'route-card ' + (r.ready ? 'ready' : r.blocked ? 'blocked' : '')
        }
        disabled={!playing}
        onClick={() => goFromPanel(r.id)}
      >
        <span className="route-icon">
          {r.ready ? (
            <Check size={16} />
          ) : r.blocked ? (
            <Clock3 size={16} />
          ) : (
            <RouteIcon size={16} />
          )}
        </span>
        <span>
          <b>{r.title}</b>
          <small>{r.hint}</small>
        </span>
        <ChevronRight size={16} />
      </button>
    ));
  const titleForPanel = {
    event: receipt ? '선택이 남긴 변화' : story.title,
    help: '밤을 건너는 방법',
    journal: '우리가 남긴 기록',
    routes: '세 갈래의 탈출',
    inventory: '가져온 것과 함께 온 사람',
    pause: '잠시, 숨을 고르기',
    collection: '우리가 맞이한 아침',
    restart: '새로운 밤을 시작할까요?',
  };
  return (
    <main className={'game-shell ' + (playing ? 'is-playing' : '')}>
      <header className="topbar">
        <button
          className="brand brand-button"
          onClick={() =>
            playing ? openPanel('pause') : openPanel('collection')
          }
        >
          새벽선<span>BLUE HOUR</span>
        </button>
        <div className="episode">
          <span className="live-dot" />
          해무대학교 · 통신 두절
        </div>
        <div className="top-actions">
          <button
            aria-label={sound ? '소리 끄기' : '소리 켜기'}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button aria-label="플레이 방법" onClick={() => openPanel('help')}>
            <HelpCircle size={18} />
          </button>
          {playing && (
            <button aria-label="일시 정지" onClick={() => openPanel('pause')}>
              <Pause size={17} />
            </button>
          )}
        </div>
      </header>
      <section className="chapter-heading">
        <div>
          <div className="eyebrow">A CAMPUS SURVIVAL STORY</div>
          <h1>
            {playing ? (
              '불빛을 따라가세요. 아직, 늦지 않았습니다.'
            ) : state.mode === 'ending' ? (
              '우리가 선택한 밤의 끝.'
            ) : (
              <>
                새벽이 오기 전,
                <br className="mobile-break" /> 우리에겐 선택이 남아 있다.
              </>
            )}
          </h1>
        </div>
        <div className="chapter-index">
          CHAPTER <b>01</b>
          <span> / THE BLACKOUT</span>
        </div>
      </section>
      {playing && (
        <div className="mobile-hud">
          <span>
            <span className="sr-only">남은 시간 </span>
            <Clock3 size={14} />
            <b>{timeText(1800 - state.elapsed)}</b>
          </span>
          <span>
            <span className="sr-only">체력 </span>
            <Heart size={14} />
            {Math.round(state.health)}
          </span>
          <span>
            <span className="sr-only">경계도 </span>
            <ShieldAlert size={14} />
            {Math.round(state.alert)}
          </span>
          <span>
            <span className="sr-only">전력 </span>
            <Zap size={14} />
            {state.power}
          </span>
          <button
            aria-label="일시 정지 메뉴"
            onClick={() => openPanel('pause')}
          >
            <Pause size={16} />
          </button>
        </div>
      )}
      <section className="play-layout">
        <div className="world-panel">
          <div className="world-top">
            <span>
              <MapPin size={14} />
              {travel
                ? `${travel}(으)로 이동 중`
                : (near?.name ?? '캠퍼스 보행로')}
            </span>
            <span>
              {playing ? (panel ? '시간 정지' : '탐험 중') : '비 · 14°C'}{' '}
              <Moon size={14} />
            </span>
          </div>
          <div
            className={'world ' + (state.mode === 'title' ? 'title-world' : '')}
          >
            <img
              src="/campus.png"
              alt="도서관, 의무실, 공학관, 방송실, 남문 수문과 셔틀 차고가 연결된 해무대학교 지도"
              draggable={false}
            />
            <canvas
              ref={canvas}
              width={1000}
              height={667}
              aria-label="탐험 지도. 아래 장소 버튼 또는 WASD로 이동하고 E로 조사하세요."
              onClick={(e) => {
                if (!playing || panel) return;
                const box = e.currentTarget.getBoundingClientRect();
                const target = {
                  x: ((e.clientX - box.left) / box.width) * 1000,
                  y: ((e.clientY - box.top) / box.height) * 667,
                };
                path.current = pathTo(ref.current, target);
                destination.current = null;
                setTravel(path.current.length ? '선택한 지점' : '');
              }}
            />
            {state.mode !== 'title' &&
              PLACES.map((loc) => (
                <button
                  key={loc.id}
                  className={
                    'map-pin pin-' +
                    loc.id +
                    ' progress-' +
                    progress[loc.id].kind +
                    (near?.id === loc.id ? ' nearby' : '')
                  }
                  style={{
                    left: `${loc.x / 10}%`,
                    top: `${(loc.y / 667) * 100}%`,
                  }}
                  aria-label={`${loc.name} · ${progress[loc.id].label} · 이동하고 조사`}
                  disabled={!playing || !!panel}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(loc.id);
                  }}
                >
                  <span className="pin-symbol">
                    {progress[loc.id].kind === 'done' ? (
                      <Check size={10} />
                    ) : (
                      loc.number
                    )}
                  </span>
                  <span>{loc.name}</span>
                  <small className="pin-progress">
                    {progress[loc.id].label}
                  </small>
                </button>
              ))}
            {state.mode === 'title' && (
              <div className="start-scrim">
                <span className="eyebrow">00:00 · CAMPUS IN THE DARK</span>
                <h2>
                  아무도
                  <br />
                  남겨두지 않으려면.
                </h2>
                <p>
                  도시는 봉쇄됐다. 구조 신호가 끊기기까지 30분.
                  <br />
                  누구를 믿고, 무엇을 가져갈지는 당신의 몫이다.
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    saved?.mode === 'playing' ? start(true) : start(false)
                  }
                >
                  {saved?.mode === 'playing'
                    ? '이전 밤 이어하기'
                    : '새로운 밤 시작하기'}{' '}
                  <ArrowUpRight size={20} />
                </button>
                {saved?.mode === 'playing' && (
                  <button
                    className="text-button"
                    onClick={() => openPanel('restart')}
                  >
                    처음부터 시작
                  </button>
                )}
                <span className="start-note">
                  탐험 · 세 명의 동료 · 세 갈래의 탈출
                </span>
              </div>
            )}
            {state.mode === 'ending' && ending && (
              <div className="ending-scrim">
                <span className="eyebrow">{ending.subtitle}</span>
                <h2 ref={endingTitle} tabIndex={-1}>
                  {ending.title}
                </h2>
                <p>{ending.body}</p>
                <div className="ending-facts">
                  <span>
                    <Clock3 size={14} />
                    {timeText(state.elapsed)}
                  </span>
                  <span>
                    <Users size={14} />
                    {state.companions.length +
                      1 +
                      (has(state, 'passengers') ? 2 : 0)}
                    명
                  </span>
                  <span>
                    <BookOpen size={14} />
                    증거 {evidence(state)}/3
                  </span>
                </div>
                {state.route && (
                  <small>
                    탈출 경로 ·{' '}
                    {routeStatus.find((r) => r.id === state.route)?.title}
                  </small>
                )}
                <section
                  className="ending-hint"
                  aria-labelledby="ending-hint-title"
                >
                  <h3 id="ending-hint-title">
                    <Compass size={14} /> 다음 밤의 단서
                  </h3>
                  <p>{endingHint(state)}</p>
                </section>
                <button className="primary" onClick={() => start(false)}>
                  다른 밤 시작하기 <RotateCcw size={16} />
                </button>
                <button
                  className="text-button"
                  onClick={() => openPanel('collection')}
                >
                  엔딩 도감 보기 ({collection.length}/7)
                </button>
              </div>
            )}
            {playing && (
              <div className="map-legend">
                <span className="player-dot" /> 나{' '}
                <span className="patrol-dot" /> 순찰 · 0.8초 노출 후 피해
              </div>
            )}
          </div>
          {playing && (
            <div className={'threat-status ' + threat.level}>
              <ShieldAlert size={15} aria-hidden="true" />
              <output aria-live="polite" aria-atomic="true">
                {threat.label}
              </output>
              {threat.level === 'exposed' && (
                <span className="exposure-meter" aria-hidden="true">
                  <i
                    style={{
                      width: `${(state.exposure / EXPOSURE_GRACE) * 100}%`,
                    }}
                  />
                </span>
              )}
            </div>
          )}
          <div className="world-bottom">
            <span>
              <kbd>W A S D</kbd> 이동 <kbd>E</kbd> 조사 <kbd>SHIFT</kbd> 달리기
            </span>
            <button className="mini-action" onClick={() => openPanel('help')}>
              조작 안내 <ArrowUpRight size={12} />
            </button>
          </div>
          {playing && (
            <>
              <div className="field-actions">
                <button
                  onClick={() => {
                    runRef.current = !run;
                    setRun(!run);
                  }}
                  aria-pressed={run}
                  className={run ? 'active' : ''}
                >
                  <Footprints size={16} />
                  {run ? '달리기 켜짐' : '달리기'}
                </button>
                <button
                  className="interact-button"
                  onClick={interact}
                  disabled={!near || !!panel}
                >
                  {near ? (
                    <>
                      <Compass size={16} />
                      {near.name} 조사
                    </>
                  ) : (
                    <>
                      <Footprints size={16} />
                      장소 가까이 이동하세요
                    </>
                  )}
                </button>
                <button
                  aria-label="배낭과 동료 보기"
                  onClick={() => openPanel('inventory')}
                >
                  <Backpack size={18} />
                  <span>{state.items.length}</span>
                </button>
              </div>
              <div className="location-strip" aria-label="탐험 목적지">
                {PLACES.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => navigate(loc.id)}
                    disabled={!!panel}
                    className={
                      'progress-' +
                      progress[loc.id].kind +
                      (near?.id === loc.id ? ' active' : '')
                    }
                    aria-label={`${loc.name} · ${progress[loc.id].label} · 이동하고 조사`}
                  >
                    {progress[loc.id].kind === 'done' ? (
                      <Check size={12} />
                    ) : (
                      <MapPin size={12} />
                    )}{' '}
                    <span>
                      {loc.name}
                      <small>{progress[loc.id].label}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <aside className="status-panel">
          <div className={'clock ' + (state.elapsed > 1440 ? 'urgent' : '')}>
            <span className="eyebrow">구조 신호 종료까지</span>
            <strong>
              {remaining[0]}
              <span>:{remaining[1]}</span>
            </strong>
            <span className="clock-caption">
              {panel
                ? '기록을 읽는 동안, 시간은 멈춥니다.'
                : '탐험 1초 = 게임 3초 · 선택은 별도 비용'}
            </span>
          </div>
          <div className="stats">
            <Stat
              icon={<Heart size={15} />}
              label="체력"
              value={state.health}
              color="#bdcdbc"
            />
            <Stat
              icon={<Footprints size={15} />}
              label="집중"
              value={state.focus}
              color="#91b8d3"
            />
            <p>
              <Zap size={15} />
              전력{' '}
              <span className="power-cells">
                {Array.from({ length: Math.max(5, state.power) }, (_, i) => (
                  <i key={i} className={i < state.power ? 'filled' : ''} />
                ))}
              </span>
              <b>{state.power}</b>
            </p>
            <Stat
              icon={<ShieldAlert size={15} />}
              label="경계도"
              value={state.alert}
              color="#d5a478"
            />
          </div>
          {!ending && (
            <div className="mission">
              {playing ? (
                <Tabs defaultValue="routes" className="game-tabs">
                  <TabsList className="game-tabs-list">
                    <TabsTrigger value="routes">탈출 경로</TabsTrigger>
                    <TabsTrigger value="people">
                      동료 {state.companions.length}/3
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="routes">
                    <div className="route-list">{routeCards()}</div>
                    <div className="truth-progress">
                      <Radio size={15} />
                      <span>
                        {has(state, 'truth')
                          ? '진실 공개 완료'
                          : `진실의 조각 ${evidence(state)} / 3`}
                      </span>
                      <span>
                        {has(state, 'truth') ? (
                          <Check size={14} />
                        ) : (
                          <LockKeyhole size={13} />
                        )}
                      </span>
                    </div>
                  </TabsContent>
                  <TabsContent value="people">
                    <div className="people-list">
                      {(Object.keys(PEOPLE) as Companion[]).map((id) => (
                        <div className="person" key={id}>
                          <span
                            className="avatar"
                            style={{ color: PEOPLE[id].color }}
                          >
                            {state.companions.includes(id)
                              ? PEOPLE[id].letter
                              : '?'}
                          </span>
                          <div>
                            <b>
                              {PEOPLE[id].name}
                              <small>{PEOPLE[id].role}</small>
                            </b>
                            <p>
                              {state.companions.includes(id)
                                ? `신뢰 ${state.trust[id]}/3 · ${PEOPLE[id].ability}`
                                : '아직 만나지 못한 사람'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ConversationPrompt
                      state={state}
                      onGo={() => navigate('fountain')}
                      compact
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <span className="eyebrow">첫 번째 목표</span>
                  <h3>흩어진 신호를 찾아서</h3>
                  <p>
                    도서관의 불빛, 의무실의 목소리.
                    <br />
                    먼저 손을 내밀 곳을 선택하세요.
                  </p>
                  <div className="mission-hint">
                    <Radio size={18} />
                    <span>
                      여섯 장소에 서로 다른 가능성이
                      <br />
                      당신을 기다리고 있습니다.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="panel-tools">
            <button onClick={() => openPanel('journal')}>
              <BookOpen size={15} /> 기록
            </button>
            <button onClick={() => openPanel('inventory')}>
              <Backpack size={15} /> 배낭
            </button>
            <button onClick={() => openPanel('collection')}>
              <Trophy size={15} /> 엔딩
            </button>
          </div>
          <div className="radio-line">
            <span className="live-dot" /> 104.7 MHz{' '}
            <span>
              {has(state, 'signal') ? '구조대 응답 수신' : '신호 대기 중'}
            </span>
          </div>
        </aside>
      </section>
      {playing && state.lastEvent && (
        <output className="recent-event">
          <span>최근 기록</span>
          {state.lastEvent}
          <button
            aria-label="전체 기록 보기"
            onClick={() => openPanel('journal')}
          >
            <ArrowUpRight size={15} />
          </button>
        </output>
      )}
      {storageNote && <output className="storage-note">{storageNote}</output>}
      <footer className="site-footer">
        <span>
          01 — 새벽선 <span className="muted">/ BLUE HOUR</span>
        </span>
        <span>어떤 선택은, 함께일 때만 가능합니다.</span>
        <button className="text-button" onClick={() => openPanel('help')}>
          게임에 관하여 ↗
        </button>
      </footer>
      <Dialog
        open={panel !== null}
        onOpenChange={(v) => {
          if (!v) dismissPanel();
        }}
        onOpenChangeComplete={(open) => {
          if (
            !open &&
            endingFromDialog.current &&
            ref.current.mode === 'ending' &&
            !panelRef.current
          )
            endingTitle.current?.scrollIntoView({ block: 'nearest' });
        }}
      >
        <DialogContent
          className="story-dialog"
          showCloseButton={false}
          finalFocus={
            endingFromDialog.current && ref.current.mode === 'ending'
              ? endingTitle
              : true
          }
        >
          <div className="dialog-top">
            <span className="eyebrow">
              {panel === 'event' ? story.tag : 'BLUE HOUR / FIELD NOTES'}
            </span>
            <button
              className="close-button"
              aria-label={
                panel === 'restart' && playing
                  ? '재시작 취소하고 일시 정지로 돌아가기'
                  : '닫고 탐험 계속하기'
              }
              onClick={dismissPanel}
            >
              <X size={19} />
            </button>
          </div>
          <DialogTitle className="dialog-heading">
            {panel ? titleForPanel[panel] : ''}
          </DialogTitle>
          <DialogDescription className="dialog-subtitle">
            {panel === 'event'
              ? `${p.name} · 선택 전까지 시간은 멈춥니다.`
              : '열려 있는 동안 탐험과 시간이 멈춥니다.'}
          </DialogDescription>
          {panel === 'event' &&
            (receipt ? (
              <div className="receipt">
                <span className="receipt-check">
                  <Check size={22} />
                </span>
                <p>{receipt}</p>
                <div className="change-tags" aria-label="선택의 실제 변화">
                  {state.log.at(-1)?.changes?.map((change) => (
                    <span key={change}>{change}</span>
                  ))}
                </div>
                <div className="receipt-stats">
                  남은 시간 {timeText(1800 - state.elapsed)} · 체력{' '}
                  {Math.round(state.health)} · 전력 {state.power}
                </div>
                <div className="receipt-actions">
                  {story.choices.length > 0 && (
                    <button
                      className="primary"
                      onClick={() => {
                        setReceipt('');
                        receiptRef.current = '';
                      }}
                    >
                      이곳을 더 살펴보기 <ArrowRight size={16} />
                    </button>
                  )}
                  <button className="secondary" onClick={() => openPanel(null)}>
                    밖으로 나가기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="story-copy">
                  {story.speaker && (
                    <div className="speaker">
                      <span
                        className="avatar"
                        style={{ color: PEOPLE[story.speaker].color }}
                      >
                        {PEOPLE[story.speaker].letter}
                      </span>
                      <span>
                        {PEOPLE[story.speaker].name}
                        <small>{PEOPLE[story.speaker].role}</small>
                      </span>
                    </div>
                  )}
                  <p>{story.body}</p>
                </div>
                <div className="choices">
                  {story.choices.map((ch, i) => (
                    <ChoiceButton
                      key={ch.id}
                      choice={ch}
                      place={place}
                      index={i}
                      state={state}
                      onClick={() => selectChoice(ch.id)}
                    />
                  ))}
                </div>
                <button
                  className="text-button defer"
                  onClick={() => openPanel(null)}
                >
                  {story.choices.length
                    ? '지금은 결정하지 않고 돌아간다'
                    : '탐험 계속하기'}{' '}
                  <ArrowRight size={13} />
                </button>
              </>
            ))}
          {panel === 'help' && (
            <div className="help-content">
              <p>
                해무대학교의 봉쇄가 시작됐습니다.{' '}
                <b>30분 안에 탈출 경로를 준비하고, 마지막 출발 선택까지 완료</b>
                하세요. 셔틀·수문·옥상 중 어느 길을 골라도 됩니다.
              </p>
              <div className="help-grid">
                <div>
                  <kbd>W A S D</kbd>
                  <b>직접 이동</b>
                  <span>방향키도 사용할 수 있어요.</span>
                </div>
                <div>
                  <kbd>E</kbd>
                  <b>가까운 장소 조사</b>
                  <span>지도 핀을 누르면 자동으로 걸어가요.</span>
                </div>
                <div>
                  <kbd>SHIFT</kbd>
                  <b>달리기</b>
                  <span>집중을 쓰고 경계도가 높아져요.</span>
                </div>
                <div>
                  <kbd>P</kbd>
                  <b>잠시 멈추기</b>
                  <span>G 경로 · I 배낭 · J 기록</span>
                </div>
              </div>
              <p>
                <b>시간과 순찰</b>
                <br />
                탐험 중 실제 1초에 게임 시간 3초가 흐릅니다. 선택 비용은 별도로
                표시됩니다. 대화·기록·배낭을 열거나 창을 벗어나면 멈춥니다.
                순찰이 가까워지면 방향을 알려줍니다. 주황색 원 안에서 0.8초 이상
                노출되면 체력을 잃고, 원 밖으로 나오면 노출 시간이 초기화됩니다.
                자동 이동 중에도 순찰을 살피고 직접 피하세요.
              </p>
              <p>
                <b>선택과 관계</b>
                <br />
                빠른 방법에는 대가가 있습니다. 동료를 돕고 광장에서 이야기하면
                신뢰가 올라 기술을 사용할 수 있습니다. 증거 2개를 방송실에서
                공개하면 특별한 결말이 열립니다.
              </p>
              <p>
                <b>휴대폰과 저장</b>
                <br />
                지도 위 장소 이름 또는 지도 아래 목적지 버튼으로 이동하세요.
                조사 버튼이 도착을 알려줍니다. 선택 직후와 탐험 중 4초마다 이
                브라우저에 자동 저장됩니다. 엔딩 도감도 이 기기에만 보관됩니다.
              </p>
              <div className="credits">
                <b>이 게임에 관하여</b>
                <p>
                  《새벽선》은 교수님의{' '}
                  <a
                    href="https://last-shuttle.jpcgpt.chatgpt.site/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    《마지막 셔틀》 ↗
                  </a>
                  에서 캠퍼스 탐험과 선택형 탈출이라는 아이디어에 영감을 받은
                  독립적인 오마주입니다. 해무대학교와 인물·사건은 허구이며,
                  이야기와 게임 로직을 새로 만들었습니다. 캠퍼스 배경은 AI 생성
                  이미지입니다.
                </p>
              </div>
              <button className="primary" onClick={() => openPanel(null)}>
                알겠어요 <Check size={16} />
              </button>
            </div>
          )}
          {panel === 'routes' && (
            <div className="modal-routes">
              {routeCards()}
              <p className="small-note">
                준비를 마친 뒤 같은 장소에서 출발을 확정하세요. 동료와 전력이
                없어도 시간이 더 드는 수동 경로가 남아 있습니다.
              </p>
              <div className="truth-progress">
                <Radio size={16} />
                {has(state, 'truth')
                  ? '진실 공개 완료'
                  : `증거 ${evidence(state)}/3 · 2개부터 공개 방송 가능`}
              </div>
            </div>
          )}
          {panel === 'journal' && (
            <div className="journal">
              {state.log.length ? (
                state.log
                  .slice()
                  .reverse()
                  .map((entry, i) => (
                    <div key={i}>
                      <time>00:{timeText(entry.at)}</time>
                      <div className="journal-detail">
                        {entry.action && <b>{entry.action}</b>}
                        <p>{entry.text}</p>
                        {entry.changes && (
                          <div className="change-tags">
                            {entry.changes.map((change) => (
                              <span key={change}>{change}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p>
                  아직 남겨진 기록이 없습니다. 새로운 밤을 시작하면 당신의
                  선택이 여기에 기록됩니다.
                </p>
              )}
            </div>
          )}
          {panel === 'inventory' && (
            <div className="inventory">
              <h3>
                배낭 <span>{state.items.length}개</span>
              </h3>
              <div className="items">
                {state.items.length ? (
                  state.items.map((item) => {
                    const guide = ITEM_GUIDES[item];
                    const note =
                      guide.completed && has(state, guide.completed.flag)
                        ? guide.completed.text
                        : guide.note;
                    return (
                      <div key={item}>
                        <BookOpen size={18} />
                        <b>{ITEM_NAMES[item]}</b>
                        <span>{guide.description}</span>
                        {note && <small>{note}</small>}
                      </div>
                    );
                  })
                ) : (
                  <p>아직 물건이 없습니다. 도서관과 공학관을 살펴보세요.</p>
                )}
              </div>
              {evidence(state) > 0 && (
                <div className="inventory-evidence">
                  <strong>
                    {has(state, 'truth')
                      ? '공개 방송 완료'
                      : `증거 ${evidence(state)}/3 · ${evidence(state) >= 2 ? '증거 조건 충족' : '서로 다른 증거 2개 필요'}`}
                  </strong>
                  <p>
                    {has(state, 'truth')
                      ? '공개 방송을 마쳤으며, 확보한 기록은 배낭에 남아 있습니다.'
                      : '공개 송출은 방송실에서 선택합니다. 송출 방법과 필요한 시간·전력은 현장 선택지에서 확인하세요.'}
                  </p>
                </div>
              )}
              <h3>함께 걷는 사람들</h3>
              {(Object.keys(PEOPLE) as Companion[]).map((id) => (
                <div className="person" key={id}>
                  <span className="avatar" style={{ color: PEOPLE[id].color }}>
                    {state.companions.includes(id) ? PEOPLE[id].letter : '?'}
                  </span>
                  <div>
                    <b>
                      {PEOPLE[id].name}
                      <small>{PEOPLE[id].role}</small>
                    </b>
                    <p>
                      {state.companions.includes(id)
                        ? `신뢰 ${state.trust[id]}/3 · ${PEOPLE[id].ability}`
                        : '의무실 · 방송실 · 공학관에서 만날 수 있어요.'}
                    </p>
                  </div>
                </div>
              ))}
              {playing && (
                <ConversationPrompt
                  state={state}
                  onGo={() => goFromPanel('fountain')}
                />
              )}
            </div>
          )}
          {panel === 'pause' && (
            <div className="pause-content">
              <p>
                지금까지의 선택은 이 브라우저에 자동 저장됩니다.
                <br />
                지도를 열어 다음 목적지를 정해도 좋습니다.
              </p>
              <button className="primary" onClick={() => openPanel(null)}>
                <Play size={16} /> 탐험 계속하기
              </button>
              <button className="secondary" onClick={() => openPanel('routes')}>
                <RouteIcon size={16} /> 탈출 경로 살펴보기
              </button>
              <button
                className="text-button"
                onClick={() => openPanel('restart')}
              >
                새로운 밤 시작하기
              </button>
            </div>
          )}
          {panel === 'restart' && (
            <div className="pause-content">
              <p>
                현재 진행 중인 밤은 새 게임으로 바뀝니다.
                <br />
                발견한 엔딩은 도감에 남습니다.
              </p>
              <button className="primary" onClick={() => start(false)}>
                새 게임 시작 <RotateCcw size={16} />
              </button>
              <button className="secondary" onClick={dismissPanel}>
                현재 기록 유지하기
              </button>
            </div>
          )}
          {panel === 'collection' && (
            <div className="collection">
              <p>{collection.length} / 7개의 아침을 발견했습니다.</p>
              {Object.entries(ENDINGS).map(([id, en], i) => (
                <div
                  key={id}
                  className={collection.includes(id) ? 'unlocked' : ''}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <b>
                      {collection.includes(id)
                        ? en.title
                        : '아직 닿지 않은 아침'}
                    </b>
                    <p>
                      {collection.includes(id)
                        ? en.subtitle
                        : {
                            truth: '공개 주파수에 담긴 두 개의 증거',
                            together: '세 사람의 이름과 대피 안내',
                            shuttle: '시간표에 없는 차를 움직이기',
                            gate: '철문 아래에 숨은 물길',
                            radio: '안개 위로 구조 신호 보내기',
                            health: '걸음을 지탱하는 힘',
                            timeout: '마지막 신호가 끊기기 전에',
                          }[id]}
                    </p>
                  </div>
                  {collection.includes(id) ? (
                    <Check size={17} />
                  ) : (
                    <LockKeyhole size={15} />
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="stat-row">
      <p>
        {icon}
        {label}
        <b>{Math.round(value)}</b>
      </p>
      <meter
        className="stat-track"
        aria-label={label}
        value={Math.round(value)}
        min={0}
        max={100}
        style={{ '--meter-color': color } as React.CSSProperties}
      >
        {Math.round(value)}
      </meter>
    </div>
  );
}
function ConversationPrompt({
  state,
  onGo,
  compact = false,
}: {
  state: GameState;
  onGo: () => void;
  compact?: boolean;
}) {
  const status = conversationStatus(state);
  return (
    <div className="conversation-prompt">
      <p>{status.message}</p>
      <small>{status.detail}</small>
      {status.action && (
        <button
          className={compact ? 'text-button' : 'secondary'}
          onClick={onGo}
        >
          {status.action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
function ChoiceButton({
  choice: c,
  place,
  index,
  state,
  onClick,
}: {
  choice: Choice;
  place: PlaceId;
  index: number;
  state: GameState;
  onClick: () => void;
}) {
  const reason = choiceDisabled(state, c);
  const preparation = preparationPreview(state, place, c);
  const relationships = relationshipPreview(state, c);
  const result = choiceResources(state, c);
  const resources = (
    [
      ['health', '체력'],
      ['power', '전력'],
      ['alert', '경계'],
    ] as const
  )
    .filter(([key]) => c[key])
    .map(([key, label]) => {
      const delta = Number((result[key] - state[key]).toFixed(1));
      const limited =
        Math.abs(result[key] - state[key] - (c[key] ?? 0)) > 0.001;
      const note = !limited
        ? null
        : key === 'health'
          ? delta
            ? '체력은 100까지 회복됩니다.'
            : '체력은 이미 최대입니다.'
          : key === 'power'
            ? delta
              ? '전력은 9까지 충전됩니다.'
              : '전력은 이미 가득 찼습니다.'
            : result.alert === 0
              ? '경계는 0까지만 내려갑니다.'
              : '경계는 100까지만 올라갑니다.';
      return {
        key,
        label,
        delta,
        note,
        positive: key === 'alert' ? delta < 0 : delta > 0,
      };
    });
  const limitNotes = resources.flatMap((resource) =>
    resource.note ? [resource.note] : [],
  );
  return (
    <button className="choice" disabled={!!reason} onClick={onClick}>
      <span className="choice-number">
        {reason ? (
          <LockKeyhole size={14} />
        ) : (
          String(index + 1).padStart(2, '0')
        )}
      </span>
      <span className="choice-main">
        <b>{c.label}</b>
        <span>{c.detail}</span>
        <span className="choice-cost">
          <i>
            <Clock3 size={12} />
            {c.minutes}분
          </i>
          {resources.map(({ key, label, delta, positive }) => (
            <i
              key={key}
              className={
                !delta
                  ? 'cost-neutral'
                  : positive
                    ? 'cost-positive'
                    : 'cost-negative'
              }
            >
              {label}{' '}
              {delta
                ? `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`
                : '변화 없음'}
            </i>
          ))}
          {c.route && <i className="cost-positive">탈출</i>}
        </span>
        {limitNotes.length > 0 && (
          <span className="resource-note">{limitNotes.join(' ')}</span>
        )}
        {relationships.map((relationship) => (
          <span
            key={relationship.person}
            className={
              'relationship-preview' +
              (relationship.unlocked ? ' unlocked' : '')
            }
          >
            <strong>
              {PEOPLE[relationship.person].name}
              {relationship.joining ? ' 동행' : ''} · 신뢰{' '}
              {relationship.delta
                ? `${relationship.before} → ${relationship.after}/3`
                : `${relationship.after}/3 유지${relationship.after === 3 ? ' · 최대' : ''}`}
            </strong>
            <small>{relationship.ability}</small>
          </span>
        ))}
        {preparation && (
          <span
            className={
              'preparation-note' + (preparation.insufficient ? ' warning' : '')
            }
          >
            준비 {c.minutes}분 + 이후 출발 최소 {preparation.minutes}분
            {preparation.insufficient && (
              <small>준비를 마쳐도 이 경로로 탈출할 시간이 부족합니다.</small>
            )}
          </span>
        )}
        {reason && <span className="locked-reason">{reason}</span>}
      </span>
      <ChevronRight size={16} />
    </button>
  );
}
