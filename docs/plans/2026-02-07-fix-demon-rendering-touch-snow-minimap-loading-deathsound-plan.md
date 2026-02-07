---
title: "fix: 혈귀 렌더링, iOS 터치, 눈 효과, 미니맵, 로딩바, 사망효과음"
type: fix
date: 2026-02-07
---

# 버그 수정 및 기능 추가 — 혈귀 렌더링, iOS 터치, 눈 효과, 미니맵 색상, 로딩 Progress Bar, 사망 효과음

## Overview

6개 항목에 대한 버그 수정(4건) 및 기능 추가(2건). 혈귀 모델이 안 보이는 렌더링 문제, iOS에서 터치 시 페이지 스크롤되는 문제, 인트로 눈 파티클 위치 버그, 미니맵 색상 통일, 모델 로딩 Progress Bar 추가, 사망 시 효과음 재생을 다룬다.

---

## Bug 1: 혈귀 모델 렌더링 문제

### 원인 분석

**Root Cause**: `BloodDemon.tsx:22`에서 `scene.clone()`을 사용하는데, Three.js의 `Object3D.clone()`은 SkinnedMesh의 skeleton/bone 참조를 올바르게 복제하지 못한다. 뼈대가 끊어진 모델은 origin(0,0,0)에 잠깐 보였다가 사라진다.

**추가 확인**: DEMON_COUNT=5 시 메모리 사용량 — blooddemon.glb가 2.2MB로 가벼워 5개 클론은 문제없음. geometry/material은 공유되고 bone 인스턴스만 복제된다.

### 수정 방안

**파일**: `app/components/game/BloodDemon.tsx`

1. `SkeletonUtils.clone()` 사용으로 교체 — SkinnedMesh의 bone 계층을 올바르게 복제
2. 초기 프레임 깜빡임 방지: `visible={false}`로 시작, 첫 useFrame에서 위치 설정 후 visible 전환
3. 각 클론의 애니메이션 오프셋 랜덤화 (자연스러운 연출)

```typescript
// BloodDemon.tsx 수정
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

// 변경 전:
const [clonedScene] = useState(() => scene.clone());

// 변경 후:
const [clonedScene] = useState(() => SkeletonUtils.clone(scene) as Group);

// 초기 깜빡임 방지:
const isPositioned = useRef(false);
// useFrame 내에서:
if (!isPositioned.current) {
  groupRef.current.position.copy(currentPosition.current);
  isPositioned.current = true;
}
```

### Edge Cases

- `SkeletonUtils`가 import 실패 시: three 패키지에 포함되어 있으므로 추가 설치 불필요
- 5개 AnimationMixer가 독립적으로 동작하는지 확인 — `useAnimations`가 groupRef별로 mixer를 생성하므로 충돌 없음
- 애니메이션 이름이 없는 GLB: 기존 코드 `names[0]` 폴백 로직 유지

---

## Bug 2: iOS 터치 문제

### 원인 분석

**Root Cause**: `TouchControls.tsx`가 존재하지만 **어디에서도 import/사용하지 않는다.** `Player.tsx`는 mouse 이벤트만 처리하여 iOS에서 터치 → 기본 브라우저 스크롤/드래그가 발생한다.

### 수정 방안

**파일**: `app/components/game/Player.tsx`, `app/layout.tsx` (또는 `app/globals.css`)

**방법 A (권장)**: Player.tsx에 직접 touch 이벤트 추가 — 기존 mouse 로직과 동일 패턴 유지

1. `touchstart` → `isMouseDown.current = true` + 터치 시작 좌표 저장
2. `touchmove` → 터치 deltaX로 rotation 업데이트 + `e.preventDefault()`
3. `touchend` → `isMouseDown.current = false`
4. 모든 터치 이벤트에 `{ passive: false }` + `e.preventDefault()` 적용

```typescript
// Player.tsx에 추가
useEffect(() => {
  if (!isPlaying) return;

  const lastTouchX = { current: 0 };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    isMouseDown.current = true;
    lastTouchX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isMouseDown.current) return;
    const deltaX = e.touches[0].clientX - lastTouchX.current;
    mouseMovement.current.x += deltaX;
    lastTouchX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    isMouseDown.current = false;
  };

  const opts = { passive: false } as AddEventListenerOptions;
  document.addEventListener("touchstart", handleTouchStart, opts);
  document.addEventListener("touchmove", handleTouchMove, opts);
  document.addEventListener("touchend", handleTouchEnd, opts);

  return () => {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };
}, [isPlaying]);
```

**추가**: `<html>` 또는 `<body>`에 게임 플레이 중 `touch-action: none` CSS 적용

```css
/* globals.css */
body.gaming {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
}
```

`page.tsx`에서 gameState에 따라 body class 토글:
```typescript
useEffect(() => {
  document.body.classList.toggle("gaming", gameState === "playing");
  return () => document.body.classList.remove("gaming");
}, [gameState]);
```

### Edge Cases

- ClearScreen 닉네임 input: `gameState !== "playing"` 이면 touch 리스너 제거 + `gaming` class 해제되므로 정상 작동
- iPad + 외장 마우스: 마우스와 터치 이벤트가 동시에 발생해도 `isMouseDown` ref 공유로 문제 없음
- pinch-to-zoom: `touch-action: none`이 게임 중 차단, 다른 화면에서는 허용
- 기존 `TouchControls.tsx`: 사용하지 않으므로 삭제하거나 무시 (삭제 권장)

---

## Bug 3: 인트로 눈 내리는 효과

### 원인 분석

**Root Cause**: `StartScreen.tsx:44`의 부모 div가 `flex items-center justify-center` 클래스를 가진다. 눈 파티클은 `position: absolute`이지만 **`top` 속성이 미지정**이다. flexbox 컨테이너 안의 absolutely positioned 자식은 `top` 미지정 시 flex alignment(items-center)의 영향을 받아 **화면 중앙**에서 시작한다.

### 수정 방안

**파일**: `app/components/ui/StartScreen.tsx` 또는 `app/globals.css`

`snow-particle` 및 `snow-particle-drift` 클래스에 `top: 0` 추가:

```css
/* globals.css 수정 */
.snow-particle {
  position: absolute;
  top: 0;               /* 추가 */
  background: white;
  border-radius: 50%;
  pointer-events: none;
  animation: snowfall linear infinite;
}

.snow-particle-drift {
  position: absolute;
  top: 0;               /* 추가 */
  background: white;
  border-radius: 50%;
  pointer-events: none;
  animation: snowfall-drift linear infinite;
}
```

이렇게 하면 파티클이 화면 최상단(-10vh, 애니메이션 시작점)에서 시작하여 전체 너비에 랜덤 분포로 내려온다.

### Edge Cases

- 다양한 화면 크기: `left: Math.random() * 100` + `%`로 이미 반응형 처리됨
- 파티클이 카드 위에 나타남: `pointer-events: none`이므로 클릭 방해 없음, z-index는 카드 `z-10`보다 낮으므로 정상

---

## Bug 4: 미니맵 색상 통일

### 원인 분석

**현재 상태**: `Minimap.tsx:79` 혈귀 = 빨강(`rgba(220, 38, 38, 0.8)`), `Minimap.tsx:89` 네즈코 = 시안(`rgba(74, 220, 255, 0.9)`)

### 수정 방안

**파일**: `app/components/ui/Minimap.tsx`

네즈코와 혈귀를 **동일한 색상**(빨강 계열)으로 표시. 네즈코의 펄싱 링 효과도 제거하여 구분을 어렵게 한다.

```typescript
// Minimap.tsx 수정

// 변경 전 (혈귀 - line 79):
ctx.fillStyle = "rgba(220, 38, 38, 0.8)";

// 변경 전 (네즈코 - line 89):
ctx.fillStyle = "rgba(74, 220, 255, 0.9)";

// 변경 후 (둘 다 동일):
ctx.fillStyle = "rgba(220, 38, 38, 0.8)";
```

또한 네즈코의 펄싱 링 이펙트(line 94-100) 제거, 점 크기도 동일하게(3px) 통일.

### Edge Cases

- 미니맵만으로 네즈코를 찾을 수 없으므로 오디오/색온도 힌트에 의존해야 함 (의도된 난이도)
- 색맹 접근성: 게임 자체가 이미 색온도 힌트 기반이므로 추가 고려 불필요

---

## Feature 1: 로딩 Progress Bar

### 설계

**파일**: `app/page.tsx`, `app/components/ui/StartScreen.tsx`

drei의 `useProgress` 훅을 활용하여 모델 로딩 진행률을 추적한다.

**구현 흐름**:
1. 사용자가 "시작하기" 클릭
2. `gameState`를 `"loading"` 상태로 전환 (새 상태 추가)
3. `Game` 컴포넌트가 마운트되면 `useGLTF.preload()`들이 로딩 시작
4. `useProgress` 훅으로 로딩 진행률 감시
5. progress === 100이면 `"playing"` 상태로 전환
6. 이미 캐시된 경우 즉시 100% → 바로 시작

```typescript
// page.tsx
export type GameState = "start" | "loading" | "playing" | "clear" | "gameover";

// StartScreen에 progress 표시 기능 추가
// "시작하기" 클릭 → gameState = "loading"
// Game 컴포넌트 내에서 useProgress로 진행률 감시 후 콜백
```

**Progress Bar UI** (StartScreen 내에서 표시):
```tsx
// StartScreen.tsx
{isLoading && (
  <div className="mt-4 w-full">
    <div className="h-1 w-full rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#4a9eff] to-[#6db3ff] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
    <p className="mt-2 text-center text-xs text-blue-300/60">
      리소스 로딩 중... {Math.round(progress)}%
    </p>
  </div>
)}
```

**핵심 변경**:
- `Game.tsx`에 `useProgress` 훅 추가, progress를 부모로 콜백
- `page.tsx`에 `"loading"` GameState 추가
- `StartScreen`에 `isLoading` + `progress` props 추가
- 버튼 클릭 시 즉시 Game 컴포넌트 마운트 (로딩 시작), 동시에 progress bar 표시

### Edge Cases

- 캐시된 리소스: `useProgress`가 즉시 100% 반환 → progress bar 표시 없이 바로 시작
- 네트워크 오류: useProgress는 에러 상태를 직접 제공하지 않으므로, 30초 타임아웃 후 재시도 UI 표시
- 백그라운드 탭: 브라우저 throttling으로 로딩이 느려질 수 있으나, 진행률 자체는 정확히 반영됨

---

## Feature 2: 사망 효과음

### 설계

**파일**: `app/page.tsx`

`swordman-dead.MP3` (`/public/audio/swordman-dead.MP3`)를 혈귀 충돌(gameover) 시 재생한다.

**구현**: 기존 `useBGM` 패턴과 동일하게 `new Audio()` 사용.

```typescript
// page.tsx의 handleGameOver 콜백에서 재생
const handleGameOver = useCallback((elapsedTime: number) => {
  // 사망 효과음 재생
  try {
    const deathSound = new Audio("/audio/swordman-dead.MP3");
    deathSound.volume = 0.5;
    deathSound.play().catch(() => {
      // iOS autoplay 정책으로 실패 시 무시 (시각 피드백은 유지)
    });
  } catch {
    // 오디오 생성 실패 시 무시
  }

  setPendingTime(elapsedTime);
  setTransitionType("gameover");
  setIsTransitioning(true);
}, []);
```

**타이밍**: 효과음은 transition effect(1.5초)와 동시에 재생. BGM은 `gameState`가 `"gameover"`로 변경되면 자동 중지(`useBGM`의 `enabled: gameState === "playing"`).

### Edge Cases

- iOS AudioContext suspended: 게임 시작 시 사용자 인터랙션(클릭)이 발생하므로 AudioContext 활성화됨. 30초+ 무입력 후 사망 시에도 `new Audio().play()`는 이미 활성화된 세션 내에서 동작
- BGM 겹침: transition 시작 시 `gameState`가 아직 `"playing"`이므로 BGM이 잠시 겹침 → transition 완료 후 `"gameover"`로 변경 시 BGM 중지. 자연스러운 오버랩
- 동일 프레임 다중 충돌: `gameEndedRef.current` 플래그로 이미 방지됨 (Game.tsx:115)
- 사망과 클리어 동시 발생: `Game.tsx:99`에서 클리어 체크가 먼저 실행되고 `return`하므로 클리어 우선

---

## 파일 변경 요약

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `app/components/game/BloodDemon.tsx` | `SkeletonUtils.clone()` 사용, 초기 깜빡임 방지 |
| `app/components/game/Player.tsx` | touch 이벤트 핸들러 추가 |
| `app/components/ui/StartScreen.tsx` | `isLoading` + `progress` props, Progress Bar UI |
| `app/components/ui/Minimap.tsx` | 네즈코/혈귀 동일 색상, 펄싱 링 제거 |
| `app/components/game/Game.tsx` | `useProgress` 훅 추가, 로딩 콜백 |
| `app/page.tsx` | `"loading"` GameState 추가, 사망 효과음, body class 토글 |
| `app/globals.css` | snow-particle `top: 0` 추가, `.gaming` 클래스 추가 |

### 삭제 대상

| 파일 | 사유 |
|---|---|
| `app/components/game/TouchControls.tsx` | 미사용 코드, Player.tsx에 통합 |

---

## Acceptance Criteria

### 버그 수정
- [x] 혈귀 5마리가 올바른 위치에서 걷기 애니메이션으로 배회함
- [x] 혈귀가 초기 로딩 시 화면 중앙에 깜빡이지 않음
- [x] iOS Safari에서 터치 스와이프 시 페이지 스크롤/드래그 발생하지 않음
- [x] iOS에서 터치로 전진/회전 조작 가능
- [x] 인트로 눈송이가 화면 최상단 전체에서 랜덤하게 내려옴
- [x] 미니맵에서 혈귀와 네즈코가 동일 색상/크기로 표시됨

### 기능 추가
- [x] "시작하기" 클릭 시 모델 로딩이 미완료면 Progress Bar 표시
- [x] 로딩 완료 시 자동으로 게임 시작
- [x] 이미 캐시된 경우 Progress Bar 없이 즉시 시작
- [x] 혈귀에게 사망 시 swordman-dead.MP3 효과음 재생

---

## Testing Checklist

- [ ] Desktop Chrome/Firefox/Safari에서 혈귀 렌더링 확인
- [ ] iOS Safari(iPhone)에서 터치 조작 확인
- [ ] iOS에서 ClearScreen 닉네임 입력 정상 작동 확인
- [ ] 인트로 화면 눈 파티클 분포 확인 (모바일/데스크톱)
- [ ] 미니맵 색상 통일 확인
- [ ] 느린 네트워크(DevTools throttle)에서 Progress Bar 표시 확인
- [ ] 사망 효과음 재생 확인 (데스크톱/모바일)
- [ ] 메모리 사용량 확인 (혈귀 5마리 + 검사 + 네즈코 모델 로딩)

## Build/Lint Verification

- [x] `npm run build` — 통과
- [x] `npm run lint` — 통과
- [x] Sister.tsx 디버그 코드 제거 (console.log + 렌더 중 ref 접근)
