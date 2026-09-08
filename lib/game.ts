export type PlaceId =
  | 'fountain'
  | 'library'
  | 'clinic'
  | 'engineering'
  | 'radio'
  | 'gate'
  | 'shuttle';
export type Companion = 'seoyun' | 'minjae' | 'doha';
export type Route = 'shuttle' | 'gate' | 'radio';
export type JournalEntry = {
  at: number;
  text: string;
  action?: string;
  place?: PlaceId;
  changes?: string[];
};
export type GameState = {
  version: 1;
  mode: 'title' | 'playing' | 'ending';
  x: number;
  y: number;
  elapsed: number;
  worldTime: number;
  exposure: number;
  health: number;
  focus: number;
  power: number;
  alert: number;
  items: string[];
  companions: Companion[];
  trust: Record<Companion, number>;
  flags: string[];
  visited: PlaceId[];
  log: JournalEntry[];
  ending: string | null;
  route: Route | null;
  lastEvent: string;
  damageCooldown: number;
};
export type Choice = {
  id: string;
  label: string;
  detail: string;
  minutes: number;
  health?: number;
  power?: number;
  alert?: number;
  items?: string[];
  companions?: Companion[];
  flags?: string[];
  requires?: string;
  route?: Route;
  result: string;
  trust?: Partial<Record<Companion, number>>;
};
export type StoryEvent = {
  id: string;
  tag: string;
  title: string;
  speaker?: Companion;
  body: string;
  choices: Choice[];
};
export const PEOPLE: Record<
  Companion,
  { name: string; role: string; letter: string; color: string; ability: string }
> = {
  seoyun: {
    name: '서윤',
    role: '의대생',
    letter: '서',
    color: '#b9d6c2',
    ability: '수문 통과 피해 8 감소',
  },
  minjae: {
    name: '민재',
    role: '방송부',
    letter: '민',
    color: '#adc8e4',
    ability: '신뢰 2부터 구조 송신 전력 1 절약',
  },
  doha: {
    name: '도하',
    role: '공학도',
    letter: '도',
    color: '#d7c3a0',
    ability: '신뢰 2부터 부품 없이 셔틀 수리',
  },
};
export const PLACES: {
  id: PlaceId;
  name: string;
  en: string;
  x: number;
  y: number;
  hint: string;
  number: string;
}[] = [
  {
    id: 'library',
    name: '도서관',
    en: 'LIBRARY',
    x: 213,
    y: 248,
    hint: '수문 도면 · 봉쇄 문서',
    number: '01',
  },
  {
    id: 'clinic',
    name: '의무실',
    en: 'INFIRMARY',
    x: 780,
    y: 213,
    hint: '서윤 · 처치 기록',
    number: '02',
  },
  {
    id: 'engineering',
    name: '공학관',
    en: 'ENGINEERING',
    x: 214,
    y: 568,
    hint: '도하 · 구동 부품',
    number: '03',
  },
  {
    id: 'radio',
    name: '방송실',
    en: 'RADIO TOWER',
    x: 502,
    y: 188,
    hint: '민재 · 옥상 구조',
    number: '04',
  },
  {
    id: 'gate',
    name: '남문 수문',
    en: 'SOUTH GATE',
    x: 500,
    y: 595,
    hint: '도면 또는 수동 개방',
    number: '05',
  },
  {
    id: 'shuttle',
    name: '셔틀 차고',
    en: 'SHUTTLE BAY',
    x: 800,
    y: 523,
    hint: '차량 수리 · 해안도로',
    number: '06',
  },
  {
    id: 'fountain',
    name: '중앙 광장',
    en: 'CENTRAL SQUARE',
    x: 500,
    y: 337,
    hint: '비상함 · 동료 대화',
    number: '00',
  },
];
export const ITEM_NAMES: Record<string, string> = {
  map: '수문 도면',
  parts: '구동 부품',
  admin: '봉쇄 지시서',
  medical: '환자 접수 기록',
  system: '변경된 제어 기록',
};
export const ENDINGS: Record<
  string,
  { title: string; subtitle: string; body: string; tip: string }
> = {
  truth: {
    title: '새벽선은 지워지지 않는다',
    subtitle: 'THE SIGNAL REMAINS',
    body: '안개 뒤로 학교가 사라졌다. 하지만 우리가 보낸 기록은 남았다. 누군가는 그 방송을 들었고, 누군가는 기다리기를 멈췄다.',
    tip: '증거를 모으는 것과 세상에 전하는 것은 다른 선택이었다.',
  },
  together: {
    title: '네 사람의 아침',
    subtitle: 'NO ONE LEFT BEHIND',
    body: '해가 뜰 때까지 서로의 이름을 불렀다. 서윤, 민재, 도하. 대답은 한 번도 빠지지 않았다. 우리가 보낸 안내를 따라 다른 불빛들도 움직였다.',
    tip: '모두를 만나고 대피 방송까지 마쳤다. 가장 긴 밤이 함께한 아침이 됐다.',
  },
  shuttle: {
    title: '첫차보다 이른 출발',
    subtitle: 'AN UNSCHEDULED DEPARTURE',
    body: '시간표에 없는 버스가 해안도로를 달렸다. 창문에 비친 캠퍼스는 조금씩 작아졌다. 내일의 첫차를 기다릴 필요는 없었다.',
    tip: '의무실과 방송실에서 다른 사람들의 밤도 바꿀 수 있다.',
  },
  gate: {
    title: '방파제 반대편',
    subtitle: 'ON THE OTHER SIDE',
    body: '마지막 사다리 위에서 처음으로 바닷바람이 불었다. 신발에는 물이 가득했지만 학교의 방송은 더 이상 들리지 않았다.',
    tip: '도서관의 자료와 의무실의 기록을 함께 살펴보면 봉쇄의 이유가 드러난다.',
  },
  radio: {
    title: '옥상의 작은 불',
    subtitle: 'A LIGHT ABOVE THE FOG',
    body: '구조기의 빛이 안개를 갈랐다. 위에서 본 캠퍼스는 작은 섬 같았다. 우리가 켜 둔 안테나의 불만 끝까지 남았다.',
    tip: '증거 두 개를 모은 뒤 돌아오면 공개 주파수로 추가 송출할 수 있다.',
  },
  health: {
    title: '멈춘 걸음',
    subtitle: 'THE NIGHT WAS TOO LONG',
    body: '다음 안내를 기다리라는 방송이 또 흘렀다. 젖은 벤치에 기대 앉았다. 이번에는 한 걸음을 더 내딛기가 어려웠다.',
    tip: '순찰의 주황색 원을 피하고, 의무실에서 서윤을 만나 체력을 회복해 보세요.',
  },
  timeout: {
    title: '00:30, 다음 안내 없음',
    subtitle: 'SIGNAL LOST',
    body: '스피커에서 짧은 잡음이 났다. 그 뒤로는 물소리뿐이었다. 마지막 구조 신호가 끊긴 밤, 길은 안개 속으로 가라앉았다.',
    tip: '탈출 준비와 출발은 별개입니다. 수문·셔틀·방송실에서 마지막 출발 선택까지 마치세요.',
  },
};
export const initialState = (): GameState => ({
  version: 1,
  mode: 'title',
  x: 500,
  y: 365,
  elapsed: 0,
  worldTime: 0,
  exposure: 0,
  health: 100,
  focus: 100,
  power: 3,
  alert: 12,
  items: [],
  companions: [],
  trust: { seoyun: 0, minjae: 0, doha: 0 },
  flags: [],
  visited: [],
  log: [],
  ending: null,
  route: null,
  lastEvent: '',
  damageCooldown: 0,
});
export const has = (s: GameState, f: string) => s.flags.includes(f);
export const evidence = (s: GameState) =>
  new Set(s.items.filter((i) => ['admin', 'medical', 'system'].includes(i)))
    .size;
export const timeText = (seconds: number) => {
  const n = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
export const nearestPlace = (s: GameState) =>
  PLACES.find((p) => Math.hypot(s.x - p.x, s.y - p.y) < 45);
const c = (
  id: string,
  label: string,
  detail: string,
  minutes: number,
  result: string,
  rest: Partial<Choice> = {},
): Choice => ({ id, label, detail, minutes, result, ...rest });
export function eventFor(s: GameState, id: PlaceId): StoryEvent {
  const trust = (p: Companion) => s.companions.includes(p) && s.trust[p] >= 2;
  if (id === 'fountain')
    return !has(s, 'cache')
      ? {
          id: 'cache',
          tag: 'PROLOGUE / 비상함',
          title: '물은 멈췄지만, 불빛은 남았다',
          body: '분수대 옆 비상함에 축전지와 붕대가 남아 있다. 빗물에 젖은 칸막이가 내려오기 전에 하나를 꺼낼 수 있다. 도서관에는 불빛이, 의무실에는 사람의 목소리가 남아 있다.',
          choices: [
            c(
              'cell',
              '휴대 축전지를 챙긴다',
              '송신이나 문 개방에 사용할 수 있다.',
              1,
              '비상함에서 전력을 확보했다.',
              { power: 2, flags: ['cache'] },
            ),
            c(
              'bandage',
              '상처를 정리하고 숨을 고른다',
              '체력을 회복하고 순찰의 관심을 줄인다.',
              2,
              '붕대를 감고 호흡을 가다듬었다.',
              { health: 25, alert: -15, flags: ['cache'] },
            ),
          ],
        }
      : {
          id: 'fountain',
          tag: 'CENTRAL SQUARE',
          title: '같이 걷는 사람들',
          body: s.companions.length
            ? '조금 전까지 낯선 얼굴들이었다. 이제는 멈춰 서면 함께 멈추는 사람들이 있다. 각자 한 번씩, 마음에 걸린 이야기를 들을 수 있다.'
            : '광장의 비상등은 세 방향을 가리킨다. 공학관의 셔틀 부품, 도서관의 수문 도면, 방송실의 구조 안테나. 어느 길로 가든 출발을 확정해야 탈출할 수 있다.',
          choices: s.companions
            .filter((p) => !has(s, 'talk-' + p))
            .map((p) =>
              c(
                'talk-' + p,
                {
                  seoyun: '서윤에게 괜찮은지 묻는다',
                  minjae: '민재의 잘못이 아니라고 말한다',
                  doha: '도하에게 회로를 믿겠다고 말한다',
                }[p],
                PEOPLE[p].ability,
                1,
                {
                  seoyun:
                    '“누가 저한테 물어본 건 처음이네요.” 서윤이 여분의 붕대를 건넸다.',
                  minjae:
                    '“그럼, 다음 방송은 제 목소리로 할게요.” 민재가 주파수를 적었다.',
                  doha: '“이번엔 제가 끝까지 책임질게요.” 도하가 젖은 매뉴얼을 접었다.',
                }[p],
                {
                  flags: ['talk-' + p],
                  trust: { [p]: 1 },
                  health: p === 'seoyun' ? 10 : 0,
                  alert: -6,
                },
              ),
            ),
        };
  if (id === 'library') {
    if (!s.items.includes('map'))
      return {
        id: 'map',
        tag: '01 / 도서관',
        title: '반납되지 않은 지도',
        body: '전자 반납함 속에 캠퍼스의 옛 수문 도면이 보인다. 정문 너머 도로가 잠기더라도, 그 아래에는 바다로 이어지는 점검 통로가 있다.',
        choices: [
          c(
            'power',
            '단말기에 비상 전원을 연결한다',
            '조용하고 빠르게 잠금을 해제한다.',
            1,
            '도면에서 남문 아래의 점검 통로를 찾았다.',
            { power: -1, items: ['map'] },
          ),
          c(
            'careful',
            '뒤쪽 나사를 차례로 푼다',
            '전력 대신 시간을 쓴다.',
            3,
            '반납함을 손상 없이 열고 수문 도면을 챙겼다.',
            { items: ['map'] },
          ),
          c(
            'break',
            '잠금 유리를 깨뜨린다',
            '소리와 파편을 감수한다.',
            1,
            '유리 깨지는 소리 너머에서 순찰등이 움직였다.',
            { health: -6, alert: 18, items: ['map'] },
          ),
        ],
      };
    if (!s.items.includes('admin'))
      return {
        id: 'archive',
        tag: '01 / 자료실',
        title: '삭제될 예정이었던 문서',
        body: '프린터에서 한 장의 결재 문서가 나온다. 실제 해일 경보를 시험 방송으로 바꾸고 현장 인원의 이탈을 금지하라는 지시다. 학교는 위험을 몰랐던 게 아니었다.',
        choices: [
          c(
            'copy',
            '원본과 첨부 기록을 복사한다',
            '출처를 확인하며 조용히 기록을 확보한다.',
            3,
            '봉쇄 지시서를 복사했다. 다른 증거와 함께 방송할 수 있다.',
            { items: ['admin'], alert: -5 },
          ),
          c(
            'photo',
            '결재 화면을 촬영하고 빠져나온다',
            '감지기에 노출되지만 시간을 아낀다.',
            1,
            '봉쇄 지시서의 서명과 발신 시각을 촬영했다.',
            { items: ['admin'], alert: 10 },
          ),
          c(
            'minjae',
            '민재에게 필요한 대목을 골라 달라고 한다',
            '방송부원의 눈으로 기록을 읽는다.',
            1,
            '민재가 경보 보류 시각을 짚었다.',
            {
              requires: trust('minjae') ? undefined : '민재 신뢰 2 필요',
              items: ['admin'],
              trust: { minjae: 1 },
            },
          ),
        ],
      };
  }
  if (id === 'clinic') {
    if (!s.companions.includes('seoyun'))
      return {
        id: 'seoyun',
        tag: '02 / 의무실',
        title: '마지막 침상',
        speaker: 'seoyun',
        body: '“문을 잠깐만 잡아 주세요!” 서윤이 부상자를 옮기고 있다. 자동문이 다시 잠기기 전에 한 사람의 손이 더 필요하다.',
        choices: [
          c(
            'help',
            '함께 침상을 안전 구역으로 옮긴다',
            '서윤이 동행하고 응급 처치를 해준다.',
            3,
            '“할 수 있는 일을 하나씩 해요.” 서윤이 함께하기로 했다.',
            { health: 12, companions: ['seoyun'], trust: { seoyun: 2 } },
          ),
          c(
            'hold',
            '몸으로 문을 붙잡는다',
            '시간을 아끼는 대신 다칠 수 있다.',
            1,
            '부상자가 빠져나왔다. 서윤이 당신의 팔을 부축한다.',
            {
              health: -12,
              alert: 8,
              companions: ['seoyun'],
              trust: { seoyun: 1 },
            },
          ),
          c(
            'open',
            '비상 전원으로 문을 열어 둔다',
            '전력을 써서 모두 안전하게 이동한다.',
            1,
            '문이 열리고, 서윤이 감사의 눈빛을 보냈다.',
            {
              power: -1,
              health: 6,
              companions: ['seoyun'],
              trust: { seoyun: 2 },
            },
          ),
        ],
      };
    if (!has(s, 'clinic-record'))
      return {
        id: 'clinic-record',
        tag: '02 / 접수대',
        title: '경보보다 먼저 도착한 환자',
        speaker: 'seoyun',
        body: '접수 기록은 공식 경보보다 23분 이르다. 진단은 전염병이 아니라 해안 설비의 가스 노출. 서윤은 환자 이름을 가린 뒤 기록을 건넨다.',
        choices: [
          c(
            'treat',
            '기록을 확보하고 상처도 처치한다',
            '증거와 회복을 함께 챙긴다.',
            3,
            '익명 처리된 환자 기록을 챙기고 상처를 소독했다.',
            { health: 20, items: ['medical'], flags: ['clinic-record'] },
          ),
          c(
            'record',
            '기록만 챙기고 바로 이동한다',
            '최초 신고 시각을 증거로 확보한다.',
            1,
            '경보 이전에 환자가 발생했다는 증거를 확보했다.',
            { items: ['medical'], flags: ['clinic-record'] },
          ),
          c(
            'supplies',
            '남은 구급품으로 충분히 회복한다',
            '기록은 다음에 돌아와 확보할 수 있다.',
            2,
            '서윤이 남은 구급품으로 응급 처치를 마쳤다.',
            { health: 35, flags: ['clinic-record'] },
          ),
        ],
      };
    if (!s.items.includes('medical'))
      return {
        id: 'record-return',
        tag: '02 / 재방문',
        title: '서윤이 남겨 둔 기록',
        body: '회복하느라 챙기지 못한 접수 기록이 봉투에 들어 있다. 이름은 모두 가려져 있다.',
        choices: [
          c(
            'take',
            '접수 기록을 챙긴다',
            '공개 방송에 사용할 환자 기록을 확보한다.',
            2,
            '환자 기록을 확보했다.',
            { items: ['medical'] },
          ),
        ],
      };
  }
  if (id === 'engineering') {
    if (!s.companions.includes('doha'))
      return {
        id: 'doha',
        tag: '03 / 공학관',
        title: '반대쪽에서 잠긴 문',
        speaker: 'doha',
        body: '유리 너머에서 도하가 종이에 숫자를 적는다. “문부터 열지 마. 전압부터 낮춰.” 그가 만든 방재 회로가 사람을 안에 가두고 있다.',
        choices: [
          c(
            'listen',
            '도하의 순서대로 차단기를 내린다',
            '도하의 판단을 믿고 안전하게 구한다.',
            3,
            '“사람이 있으면 닫히지 않게 만들었는데…” 도하가 동행한다.',
            { companions: ['doha'], trust: { doha: 2 } },
          ),
          c(
            'cell',
            '축전지로 잠금 회로를 분리한다',
            '시간과 안전을 전력으로 바꾼다.',
            1,
            '잠금이 풀렸다. 도하가 제어기의 변경 흔적을 보여 준다.',
            { power: -1, companions: ['doha'], trust: { doha: 2 } },
          ),
          c(
            'pull',
            '절연 장갑으로 케이블을 뽑는다',
            '뜨거운 케이블을 직접 잡는다.',
            1,
            '연기 사이로 도하를 끌어냈다.',
            { health: -14, alert: 8, companions: ['doha'], trust: { doha: 1 } },
          ),
        ],
      };
    if (!s.items.includes('parts'))
      return {
        id: 'parts',
        tag: '03 / 부품 선반',
        title: '철거되지 않은 시제품',
        speaker: 'doha',
        body: '셔틀에 맞는 구동 부품이 남아 있다. 그 아래의 제어기에는 누군가 봉쇄 조건을 바꾼 기록도 남았다. 전력과 기록, 둘 다 챙기기엔 시간이 빠듯하다.',
        choices: [
          c(
            'both',
            '구동 부품과 변경 기록을 함께 회수한다',
            '셔틀 부품과 제어기 변경 기록을 얻는다.',
            4,
            '부품과 변경 기록을 회수했다. 봉쇄는 누군가의 결정이었다.',
            { items: ['parts', 'system'] },
          ),
          c(
            'charge',
            '부품과 충전 셀을 우선 챙긴다',
            '증거는 돌아와 챙길 수 있다.',
            2,
            '셔틀 부품과 충전 셀 두 개를 얻었다.',
            { items: ['parts'], power: 2 },
          ),
          c(
            'quick',
            '작동 중인 시험 장치에서 부품을 뗀다',
            '빠르지만 열에 노출된다.',
            1,
            '뜨거운 부품과 충전 셀을 분리했다.',
            { items: ['parts'], power: 1, health: -10 },
          ),
        ],
      };
    if (!s.items.includes('system'))
      return {
        id: 'system',
        tag: '03 / 재방문',
        title: '바뀐 조건, 남겨진 흔적',
        body: '도하가 제어기의 원본과 마지막 변경 기록을 대조한다. “안전을 위한 봉쇄”라는 설명과 실제 조건이 일치하지 않는다.',
        choices: [
          c(
            'log',
            '변경 기록을 복사한다',
            '공개 방송에 사용할 증거.',
            2,
            '제어기 변경 기록을 확보했다.',
            { items: ['system'] },
          ),
        ],
      };
  }
  if (id === 'radio') {
    if (!s.companions.includes('minjae'))
      return {
        id: 'minjae',
        tag: '04 / 방송실',
        title: '사과할 수 없는 목소리',
        speaker: 'minjae',
        body: '“현재 위치에서 기다리십시오.” 민재가 녹음한 문장이 반복된다. 그는 송출 스위치 앞에서 손을 떼지 못한다. “저 목소리 때문에 기다리는 사람이 있겠죠.”',
        choices: [
          c(
            'speak',
            '함께 마이크를 잡고 대피를 알린다',
            '위치는 드러나지만 민재가 용기를 얻는다.',
            2,
            '“다음 말도 제가 할게요.” 민재가 다시 마이크를 잡았다.',
            { alert: 10, companions: ['minjae'], trust: { minjae: 2 } },
          ),
          c(
            'unplug',
            '송출선을 분리하고 같이 나온다',
            '조용히 안내를 멈춘다.',
            3,
            '녹음 방송이 멈췄다. 민재는 주파수표를 챙겨 따라왔다.',
            { alert: -8, companions: ['minjae'], trust: { minjae: 1 } },
          ),
          c(
            'override',
            '비상 전원으로 녹음을 덮어쓴다',
            '정확한 대피 안내를 남긴다.',
            1,
            '“기다리지 마세요.” 새로운 안내가 비를 뚫고 울린다.',
            { power: -1, companions: ['minjae'], trust: { minjae: 2 } },
          ),
        ],
      };
    const cost = trust('minjae') ? 1 : 2;
    if (!has(s, 'signal'))
      return {
        id: 'signal',
        tag: '04 / 옥상 안테나',
        title: '누구에게 보내는 신호인가',
        speaker: 'minjae',
        body: '104.7MHz 너머로 구조대의 호출이 들린다. 좌표만 보낼 수도, 캠퍼스에서 일어난 일까지 알릴 수도 있다. 송신 뒤에도 남은 사람을 찾으러 돌아갈 수 있다.',
        choices: [
          c(
            'rescue',
            '구조대에 현재 좌표를 보낸다',
            '옥상 탈출 준비. 이후 출발을 확정해야 한다.',
            2,
            '구조대가 좌표를 받았다. 옥상에서 출발할 수 있다.',
            { power: -cost, flags: ['signal'] },
          ),
          c(
            'truth',
            '증거와 좌표를 공개 주파수로 송출한다',
            '진실 공개 결말 조건을 달성한다.',
            3,
            '기록이 공개 주파수에 실렸다. 구조대가 접근한다.',
            {
              power: -cost,
              alert: 15,
              requires:
                evidence(s) >= 2 ? undefined : '서로 다른 증거 2개 필요',
              flags: ['signal', 'truth'],
            },
          ),
          c(
            'all',
            '다른 사람들의 대피 경로도 방송한다',
            '세 동료와 함께라면 모두의 아침으로 이어진다.',
            3,
            '남은 학생들이 움직이기 시작했다. 구조 신호도 전송됐다.',
            { power: -cost, alert: 8, flags: ['signal', 'rescue'] },
          ),
          c(
            'manual',
            '수동 발전기로 구조 신호를 보낸다',
            '전력이 없어도 가능. 저체력일 때 쉬어 가며 돌린다.',
            s.health <= 8 && !s.companions.includes('doha') ? 7 : 5,
            '수동 발전기의 신호가 안개 너머에 닿았다.',
            {
              health: s.companions.includes('doha') || s.health <= 8 ? 0 : -8,
              flags: ['signal'],
            },
          ),
        ],
      };
    return {
      id: 'roof',
      tag: '04 / 출발 준비 완료',
      title: '옥상에 켜진 불',
      body: '구조대가 안테나의 불빛을 확인했다. 지금 올라가면 캠퍼스를 떠날 수 있다. 아직 전하지 못한 이야기가 있다면 마이크는 열려 있다.',
      choices: [
        c(
          'leave',
          '옥상으로 올라가 구조를 기다린다',
          '현재 동료들과 함께 옥상으로 탈출한다.',
          3,
          '구조기의 탐조등이 옥상을 비췄다.',
          { route: 'radio' },
        ),
        ...(!has(s, 'truth')
          ? [
              c(
                'extra-truth',
                '확보한 증거를 추가 송출한다',
                s.power
                  ? '진실을 전한 뒤 탈출 방법을 고를 수 있다.'
                  : '전력 없이 수동 송출한다.',
                s.power ? 2 : 4,
                '봉쇄의 기록을 세상에 전했다.',
                {
                  power: s.power ? -1 : 0,
                  alert: 15,
                  requires:
                    evidence(s) >= 2 ? undefined : '서로 다른 증거 2개 필요',
                  flags: ['truth'],
                },
              ),
            ]
          : []),
        ...(!has(s, 'rescue')
          ? [
              c(
                'extra-rescue',
                '남은 사람들에게 대피 경로를 안내한다',
                '모두에게 탈출의 기회를 만든다.',
                s.power ? 2 : 4,
                '민재의 목소리가 기다리던 사람들을 움직였다.',
                { power: s.power ? -1 : 0, alert: 8, flags: ['rescue'] },
              ),
            ]
          : []),
      ],
    };
  }
  if (id === 'gate') {
    if (!has(s, 'gate-open'))
      return {
        id: 'gate',
        tag: '05 / 남문',
        title: '정문 아래의 정문',
        body: '철문 너머의 도로는 이미 잠겼다. 발밑 점검구만 방파제 아래로 이어진다. 전동 펌프는 꺼졌지만 수동 밸브는 아직 움직인다.',
        choices: [
          c(
            'map',
            '도면의 우회 손잡이를 돌린다',
            '통로의 압력을 안전하게 해제한다.',
            1,
            '도면대로 수문을 열었다.',
            {
              requires: s.items.includes('map')
                ? undefined
                : '도서관의 수문 도면 필요',
              flags: ['gate-open'],
            },
          ),
          c(
            'pump',
            '배수 펌프에 전원을 공급한다',
            '도면 없이도 통로를 연다.',
            1,
            '펌프가 물을 밀어냈다. 통로가 열렸다.',
            { power: -1, alert: 6, flags: ['gate-open'] },
          ),
          c(
            'manual',
            '수동 압력 밸브를 끝까지 돌린다',
            '물품 없이도 가능. 도하 동행 시 시간 절약.',
            s.companions.includes('doha') ? 2 : 4,
            '수동 밸브가 움직였다. 바다 쪽 사다리가 보인다.',
            { alert: 12, flags: ['gate-open'] },
          ),
        ],
      };
    const discount = s.companions.includes('seoyun') ? 8 : 0;
    return {
      id: 'water',
      tag: '05 / 탈출 경로',
      title: '물이 오르는 계단',
      body: '손전등 아래에서 수위가 높아진다. 반대편 방파제 사다리까지는 한 번의 결단만 남았다. 함께 온 동료들은 어떤 선택에도 당신을 따라간다.',
      choices: [
        c(
          'slow',
          '난간을 잡고 천천히 건넌다',
          '체력을 잃지 않고 수문으로 탈출한다.',
          6,
          '난간을 따라 마지막 사다리에 도착했다.',
          { route: 'gate' },
        ),
        c(
          'wade',
          '낮은 물길을 따라 건넌다',
          discount
            ? '서윤이 안전한 발 디딤을 도와 피해 8 감소.'
            : '체력과 시간을 함께 쓴다.',
          4,
          '차가운 물을 헤치고 방파제 바깥으로 나왔다.',
          { health: -18 + discount, route: 'gate' },
        ),
        c(
          'rush',
          '물이 차기 전에 빠르게 건넌다',
          '체력을 많이 소모하지만 시간을 아낀다.',
          2,
          '불어난 물보다 먼저 사다리를 붙잡았다.',
          { health: -34 + discount, alert: 10, route: 'gate' },
        ),
      ],
    };
  }
  if (id === 'shuttle') {
    if (!has(s, 'shuttle-ready'))
      return {
        id: 'shuttle',
        tag: '06 / 차고',
        title: '시간표에 없는 마지막 배차',
        body: '운전석에는 내일 첫차 시간표가 붙어 있다. 배터리는 살아 있지만 구동 모듈이 타 버렸다. 정비 매뉴얼이 바닥에 펼쳐져 있다.',
        choices: [
          c(
            'parts',
            '구동 부품으로 모듈을 교체한다',
            '공학관 부품과 전력으로 수리한다.',
            3,
            '시동이 걸렸다. 출발하거나 더 살펴볼 수 있다.',
            {
              power: -1,
              alert: 8,
              requires: s.items.includes('parts')
                ? undefined
                : '공학관의 구동 부품 필요',
              flags: ['shuttle-ready'],
            },
          ),
          c(
            'doha',
            '도하에게 회로를 맡긴다',
            '신뢰하는 동료의 기술로 부품과 전력을 아낀다.',
            3,
            '도하가 보조 회로를 연결했다. 계기판이 밝아졌다.',
            {
              requires: trust('doha') ? undefined : '도하 신뢰 2 필요',
              alert: 8,
              flags: ['shuttle-ready'],
              trust: { doha: 1 },
            },
          ),
          c(
            'manual',
            '매뉴얼대로 보조 구동계를 연결한다',
            '시간을 들이면 혼자서도 수리할 수 있다.',
            s.health > 10 ? 6 : 8,
            '매뉴얼의 마지막 배선까지 연결했다. 셔틀이 움직인다.',
            {
              health: s.health > 10 ? -10 : 0,
              alert: 18,
              flags: ['shuttle-ready'],
            },
          ),
        ],
      };
    return {
      id: 'departure',
      tag: '06 / 출발 준비 완료',
      title: '아직 남아 있는 빈자리',
      body: '헤드라이트가 켜지자 학생 두 명이 차고 입구에 나타난다. 뒷문은 아직 잠겨 있다. 지금까지 함께 온 동료들은 이미 셔틀 안에서 기다리고 있다.',
      choices: [
        c(
          'leave',
          '현재 동료들과 바로 출발한다',
          '해안도로를 따라 캠퍼스를 벗어난다.',
          1,
          '셔틀이 봉쇄선을 넘어 해안도로로 들어섰다.',
          { route: 'shuttle' },
        ),
        c(
          'students',
          '뒷문을 열어 학생 두 명도 태운다',
          '시간을 더 써서 두 명을 추가 구조한다.',
          3,
          '빈자리가 모두 채워졌다. 차고를 떠났다.',
          { alert: 10, flags: ['passengers'], route: 'shuttle' },
        ),
      ],
    };
  }
  return {
    id: 'complete-' + id,
    tag: '조사 완료',
    title: '이곳에서 할 수 있는 일은 마쳤다',
    body: '확보한 물건과 기록은 배낭에 남아 있다. 탈출 경로 탭에서 준비 상태를 확인하거나 아직 만나지 못한 사람을 찾아가자.',
    choices: [],
  };
}
export function choiceDisabled(s: GameState, c: Choice): string | undefined {
  if (c.requires) return c.requires;
  if (s.power + (c.power ?? 0) < 0)
    return `전력 ${-(c.power ?? 0)} 필요 (현재 ${s.power})`;
  if (s.health + (c.health ?? 0) <= 0)
    return `체력 ${1 - (c.health ?? 0)} 이상 필요`;
  if (s.elapsed + c.minutes * 60 > 1800)
    return `시간 부족 · ${c.minutes}분 필요`;
  return undefined;
}
export function departureStatus(s: GameState, id: PlaceId) {
  const departures = eventFor(s, id).choices.filter((choice) => choice.route);
  const affordable = departures.filter(
    (choice) => !choiceDisabled({ ...s, elapsed: 0 }, choice),
  );
  const minutes = affordable.length
    ? Math.min(...affordable.map((choice) => choice.minutes))
    : null;
  const canDepart = departures.some((choice) => !choiceDisabled(s, choice));
  return {
    prepared: departures.length > 0,
    canDepart,
    minutes,
    reason:
      canDepart || !departures.length
        ? null
        : minutes !== null
          ? `출발 시간 부족 · 최소 ${minutes}분 필요`
          : (choiceDisabled(s, departures[0]) ?? '출발 조건 부족'),
  };
}
export function preparationPreview(s: GameState, id: PlaceId, choice: Choice) {
  if (
    !choice.flags?.some((flag) =>
      ['signal', 'gate-open', 'shuttle-ready'].includes(flag),
    ) ||
    choiceDisabled(s, choice)
  )
    return null;
  const prepared = choose({ ...s, elapsed: 0 }, id, choice.id);
  const departure = departureStatus(
    { ...prepared, elapsed: s.elapsed + choice.minutes * 60 },
    id,
  );
  if (!departure.prepared || departure.minutes === null) return null;
  return { minutes: departure.minutes, insufficient: !departure.canDepart };
}
export function placeProgress(s: GameState, id: PlaceId) {
  const event = eventFor(s, id);
  const departure = departureStatus(s, id);
  if (
    id === 'radio' &&
    event.choices.some(
      (choice) => choice.id === 'extra-truth' && !choiceDisabled(s, choice),
    )
  )
    return { kind: 'available', label: '추가 방송 가능' };
  if (departure.canDepart) return { kind: 'ready', label: '출발 가능' };
  if (departure.prepared) return { kind: 'blocked', label: '출발 조건 부족' };
  if (id === 'fountain' && has(s, 'cache') && event.choices.length)
    return { kind: 'available', label: '대화 가능' };
  if (!event.choices.length)
    return {
      kind: 'done',
      label: id === 'fountain' ? '휴식 광장' : '조사 완료',
    };
  if (s.visited.includes(id)) return { kind: 'available', label: '추가 조사' };
  return { kind: 'new', label: '미조사' };
}
export function choiceChanges(
  before: GameState,
  after: GameState,
  choice: Choice,
) {
  const changes = [`시간 −${choice.minutes}분`];
  for (const [key, label] of [
    ['health', '체력'],
    ['power', '전력'],
    ['alert', '경계'],
  ] as const) {
    const delta = after[key] - before[key];
    if (delta)
      changes.push(
        `${label} ${delta > 0 ? '+' : '−'}${Number(Math.abs(delta).toFixed(1))}`,
      );
    else if (choice[key]) changes.push(`${label} 변화 없음 (${before[key]})`);
  }
  for (const item of after.items.filter((item) => !before.items.includes(item)))
    changes.push(`${ITEM_NAMES[item]} 확보`);
  for (const person of after.companions.filter(
    (person) => !before.companions.includes(person),
  ))
    changes.push(`${PEOPLE[person].name} 동행`);
  for (const person of Object.keys(PEOPLE) as Companion[]) {
    const delta = after.trust[person] - before.trust[person];
    if (delta) changes.push(`${PEOPLE[person].name} 신뢰 +${delta}`);
  }
  return changes;
}
export function choiceResources(s: GameState, choice: Choice) {
  return {
    health: Math.min(100, s.health + (choice.health ?? 0)),
    power: Math.min(9, s.power + (choice.power ?? 0)),
    alert: Math.max(0, Math.min(100, s.alert + (choice.alert ?? 0))),
  };
}
export function choose(
  s: GameState,
  place: PlaceId,
  choiceId: string,
): GameState {
  if (s.mode !== 'playing') return s;
  const e = eventFor(s, place),
    ch = e.choices.find((c) => c.id === choiceId);
  if (!ch || choiceDisabled(s, ch)) return s;
  const n: GameState = {
    ...s,
    elapsed: s.elapsed + ch.minutes * 60,
    ...choiceResources(s, ch),
    items: [...new Set([...s.items, ...(ch.items ?? [])])],
    companions: [...new Set([...s.companions, ...(ch.companions ?? [])])],
    flags: [...new Set([...s.flags, ...(ch.flags ?? [])])],
    trust: { ...s.trust },
    visited: [...new Set([...s.visited, place])],
    lastEvent: ch.result,
    log: s.log,
  };
  for (const p of Object.keys(ch.trust ?? {}) as Companion[])
    n.trust[p] = Math.min(3, n.trust[p] + (ch.trust?.[p] ?? 0));
  n.log = [
    ...s.log,
    {
      at: n.elapsed,
      text: ch.result,
      action: ch.label,
      place,
      changes: choiceChanges(s, n, ch),
    },
  ].slice(-70);
  if (ch.route) {
    n.route = ch.route;
    n.mode = 'ending';
    n.ending =
      has(n, 'truth') && evidence(n) >= 2
        ? 'truth'
        : n.companions.length === 3 && has(n, 'rescue')
          ? 'together'
          : ch.route;
  } else if (n.elapsed >= 1800) {
    n.mode = 'ending';
    n.ending = 'timeout';
  }
  return n;
}
export const BLOCKS = [
  { x: 80, y: 55, w: 240, h: 171 },
  { x: 425, y: 57, w: 150, h: 109 },
  { x: 708, y: 73, w: 143, h: 111 },
  { x: 83, y: 382, w: 243, h: 165 },
];
export function walkable(x: number, y: number) {
  return (
    x >= 55 &&
    x <= 925 &&
    y >= 179 &&
    y <= 618 &&
    !BLOCKS.some(
      (b) =>
        x > b.x - 9 && x < b.x + b.w + 9 && y > b.y - 9 && y < b.y + b.h + 9,
    )
  );
}
export function pathTo(
  s: { x: number; y: number },
  target: { x: number; y: number },
): { x: number; y: number }[] {
  if (!walkable(target.x, target.y)) return [];
  const step = 18,
    key = (x: number, y: number) => `${x},${y}`,
    start = { x: Math.round(s.x / step), y: Math.round(s.y / step) },
    goal = { x: Math.round(target.x / step), y: Math.round(target.y / step) },
    queue = [start],
    seen = new Set([key(start.x, start.y)]),
    prev = new Map<string, string>();
  let found = '';
  for (let i = 0; i < queue.length && i < 4000; i++) {
    const a = queue[i];
    if (Math.hypot(a.x - goal.x, a.y - goal.y) <= 1) {
      found = key(a.x, a.y);
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = a.x + dx,
        y = a.y + dy,
        k = key(x, y);
      if (!seen.has(k) && walkable(x * step, y * step)) {
        seen.add(k);
        prev.set(k, key(a.x, a.y));
        queue.push({ x, y });
      }
    }
  }
  if (!found) return [];
  const out = [target];
  while (found !== key(start.x, start.y)) {
    const [x, y] = found.split(',').map(Number);
    out.push({ x: x * step, y: y * step });
    const p = prev.get(found);
    if (!p) break;
    found = p;
  }
  return out.reverse();
}
export function patrols(t: number) {
  return [
    { x: 350 + Math.sin(t * 0.18) * 95, y: 315 + Math.cos(t * 0.1) * 40 },
    { x: 660 + Math.sin(t * 0.13 + 2) * 100, y: 420 + Math.cos(t * 0.12) * 52 },
  ];
}
export const EXPOSURE_GRACE = 0.8;
export const patrolRadius = (alert: number) => 22 + alert * 0.16;
export function patrolThreat(s: GameState) {
  const closest = patrols(s.worldTime)
    .map((p) => ({
      ...p,
      gap: Math.hypot(s.x - p.x, s.y - p.y) - patrolRadius(s.alert),
    }))
    .sort((a, b) => a.gap - b.gap)[0];
  const direction =
    Math.abs(closest.x - s.x) > Math.abs(closest.y - s.y)
      ? closest.x < s.x
        ? '왼쪽'
        : '오른쪽'
      : closest.y < s.y
        ? '위쪽'
        : '아래쪽';
  const level =
    closest.gap < 0 ? 'exposed' : closest.gap < 42 ? 'near' : 'clear';
  return {
    level,
    direction,
    gap: closest.gap,
    label:
      level === 'exposed'
        ? '순찰에 노출 · 원 밖으로 벗어나세요'
        : level === 'near'
          ? `${direction}에서 순찰 접근 · 경로를 바꾸세요`
          : '주변에 가까운 순찰 없음',
  };
}
export function tick(
  s: GameState,
  dt: number,
  moving: boolean,
  running: boolean,
): GameState {
  if (s.mode !== 'playing') return s;
  const n = {
    ...s,
    elapsed: Math.min(1800, s.elapsed + dt * 3),
    worldTime: Math.min(600, s.worldTime + dt),
    focus: Math.max(
      0,
      Math.min(100, s.focus + dt * (moving && running ? -16 : 10)),
    ),
    alert: Math.max(
      0,
      Math.min(100, s.alert + dt * (moving && running ? 2.4 : -0.4)),
    ),
    damageCooldown: Math.max(0, s.damageCooldown - dt),
  };
  const danger = patrolThreat(n).level === 'exposed';
  n.exposure = danger ? Math.min(EXPOSURE_GRACE, s.exposure + dt) : 0;
  if (danger && n.exposure >= EXPOSURE_GRACE && n.damageCooldown <= 0) {
    const damage = Math.min(7, n.health);
    n.health = Math.max(0, n.health - 7);
    n.damageCooldown = 2;
    n.alert = Math.min(100, n.alert + 8);
    n.lastEvent = `순찰등에 노출됐다. 체력 −${damage}. 주황색 원에서 벗어나세요.`;
    n.log = [
      ...s.log,
      {
        at: n.elapsed,
        text: n.lastEvent,
        action: '순찰에 노출',
        changes: [
          `체력 −${damage}`,
          `경계 +${Number((n.alert - s.alert).toFixed(1))}`,
        ],
      },
    ].slice(-70);
  }
  if (n.health <= 0) {
    n.mode = 'ending';
    n.ending = 'health';
  } else if (n.elapsed >= 1800) {
    n.elapsed = 1800;
    n.mode = 'ending';
    n.ending = 'timeout';
  }
  return n;
}
export function validateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as GameState;
  const own = (object: object, key: unknown) =>
    typeof key === 'string' && Object.hasOwn(object, key);
  const unique = (a: unknown) =>
    Array.isArray(a) && new Set(a).size === a.length;
  if (
    s.version !== 1 ||
    !['playing', 'ending'].includes(s.mode) ||
    ![
      'x',
      'y',
      'elapsed',
      'health',
      'focus',
      'power',
      'alert',
      'damageCooldown',
    ].every(
      (k) =>
        typeof s[k as keyof GameState] === 'number' &&
        Number.isFinite(s[k as keyof GameState]),
    )
  )
    return null;
  if (
    ![s.items, s.flags, s.companions, s.visited].every(unique) ||
    !Array.isArray(s.log) ||
    s.log.length > 70 ||
    !s.trust ||
    typeof s.trust !== 'object' ||
    typeof s.lastEvent !== 'string' ||
    s.lastEvent.length > 2000
  )
    return null;
  if (
    !s.items.every((i) => own(ITEM_NAMES, i)) ||
    !s.flags.every((f) => typeof f === 'string' && f.length < 80) ||
    s.flags.length > 50 ||
    !s.companions.every((p) => own(PEOPLE, p)) ||
    !s.visited.every((p) => PLACES.some((l) => l.id === p)) ||
    !s.log.every(
      (l) =>
        l &&
        typeof l.text === 'string' &&
        l.text.length < 2000 &&
        Number.isFinite(l.at) &&
        l.at >= 0 &&
        l.at <= 1800 &&
        (l.action === undefined ||
          (typeof l.action === 'string' && l.action.length < 200)) &&
        (l.place === undefined || PLACES.some((p) => p.id === l.place)) &&
        (l.changes === undefined ||
          (Array.isArray(l.changes) &&
            l.changes.length < 25 &&
            l.changes.every((v) => typeof v === 'string' && v.length < 200))),
    )
  )
    return null;
  if (
    !Object.keys(PEOPLE).every((p) => {
      const n = s.trust[p as Companion];
      return Number.isInteger(n) && n >= 0 && n <= 3;
    })
  )
    return null;
  if (
    s.elapsed < 0 ||
    s.elapsed > 1800 ||
    s.health < 0 ||
    s.health > 100 ||
    !Number.isInteger(s.power) ||
    s.power < 0 ||
    s.power > 9 ||
    s.alert < 0 ||
    s.alert > 100 ||
    s.focus < 0 ||
    s.focus > 100 ||
    s.damageCooldown < 0 ||
    s.damageCooldown > 2 ||
    !walkable(s.x, s.y)
  )
    return null;
  if (s.route !== null && !['shuttle', 'gate', 'radio'].includes(s.route))
    return null;
  if (s.mode === 'ending' && !own(ENDINGS, s.ending)) return null;
  if (
    s.mode === 'playing' &&
    (s.ending !== null ||
      s.route !== null ||
      s.health <= 0 ||
      s.elapsed >= 1800)
  )
    return null;
  // Version 1 saves predate the separate patrol clock and exposure warning.
  const worldTime = s.worldTime === undefined ? s.elapsed / 3 : s.worldTime;
  const exposure = s.exposure === undefined ? 0 : s.exposure;
  if (
    !Number.isFinite(worldTime) ||
    worldTime < 0 ||
    worldTime > 600 ||
    !Number.isFinite(exposure) ||
    exposure < 0 ||
    exposure > EXPOSURE_GRACE
  )
    return null;
  return { ...initialState(), ...s, worldTime, exposure };
}
