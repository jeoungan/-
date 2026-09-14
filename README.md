# 새벽선 · BLUE HOUR

비 내리는 가상의 해무대학교에서 30분 안에 탈출하는 브라우저 생존 어드벤처.

**[▶ 게임 바로 플레이하기](https://jeoungan.github.io/-/)**

설치나 로그인 없이 PC·모바일 브라우저에서 플레이할 수 있다. 지도 탐험, 사건 선택, 동료 상호작용, 세 갈래 탈출과 엔딩 수집을 제공한다. 진행 기록은 현재 브라우저에 저장된다.

## 플레이

WASD/방향키 이동, Shift 달리기, E 조사. 지도 핀·목적지 버튼은 실제 경로를 따라 이동 후 자동 조사한다. G 탈출 경로, I 배낭, J 기록, P 일시 정지. 모바일은 장소 버튼과 달리기·조사 버튼을 이용한다.

탐험 1초에 게임 3초가 흐르고, 선택은 명시된 분 단위 비용을 별도로 소모한다. 대화·기록·배낭·도움말 중에는 정지한다. 선택 직후 및 4초마다 브라우저 localStorage에 저장한다. 기기 간 동기화나 서버 순위는 없다.

## 개발 및 검증

- `npm run dev` : 개발 미리보기
- `node --experimental-strip-types --test tests/game.test.mjs` : 분기·저장·길찾기·실패 조건 검사
- `npx tsc --noEmit` : 타입 검사
- `npm run lint` : 코드 검사
- `npm run build` : Sites 배포 빌드
- `npm run build:pages` : GitHub Pages용 정적 게임 빌드 (`dist-pages/`)
- `npm run preview:pages` : 정적 게임 미리보기 (표시된 주소의 `/-/` 경로)

GitHub Pages는 `.github/workflows/pages.yml`에서 게임을 빌드해 배포한다. `main`에 푸시하면 실제 앱이 갱신된다. `standalone/`은 기존 게임 화면과 규칙을 그대로 사용하는 브라우저 실행 진입점이며, 별도 서버나 인증이 필요 없다.

`lib/game.ts`는 순수 게임 규칙과 사건을, `app/page.tsx`는 입력·지도·인터페이스·저장을 담당한다. 테스트 훅 `window.render_game_to_text()`와 `window.advanceTime(ms)`를 제공한다. WebMCP는 현재 상태 읽기와 목적지 이동을 제공하며 UI와 같은 상태 및 길찾기를 사용한다.

## 비교 원작과 창작

원작: https://last-shuttle.jpcgpt.chatgpt.site/ . 캠퍼스 탐험 → 조사·선택 → 제한 시간 내 탈출이라는 기본 흐름에 영감을 받았다. 원작 코드·문구·아트를 복제하지 않았다. 새벽선의 인물·사건·지도 배경과 구현은 별도로 제작했다. 배경 이미지는 built-in imagegen 생성 자산이다.

## 지속 리뷰

원작 비교, 내러티브·균형, UI·접근성·안정성 담당 에이전트가 12차까지 리뷰를 수행했다. 주 에이전트가 개선을 통합하고 검증된 변경을 기존 비공개 Sites 사이트에 반영했다. 15분 자동 리뷰는 사용자 요청으로 중지한 상태다. 실제 비교 근거와 검증 결과는 `docs/reviews.md`에 기록돼 있다.
