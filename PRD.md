---
title: "feat: 게임플레이 오버홀 - UI/UX, 적 시스템, 이펙트, 조작 개선"
type: feat
date: 2026-02-03
---

# 게임플레이 오버홀 - UI/UX 리디자인, 혈귀 적 시스템, 이펙트 및 조작 개선

## Overview

눈보라 속 여동생 찾기 게임의 10개 항목에 대한 버그 수정 및 기능 추가. 겨울 + 귀멸의 칼날 컨셉의 UI/UX 리디자인, 마우스 조작 방식 변경, 오디오 버그 수정, 미니맵 추가, 발자국 셰이더, 눈 내리기 효과 개선, 혈귀 적 시스템, 게임 종료 전환 이펙트를 포함한다.

## Problem Statement / Motivation

현재 게임은 기본 기능은 구현되어 있지만 다음 문제들이 있다:

- **조작 버그**: 마우스 클릭 시 포인터 락이 걸려 커서가 사라짐. 마우스 드래그 기반 조작이 필요
- **오디오 버그**: 여동생 사운드가 재생되지 않고 BGM만 나옴
- **UI 올드함**: 기본 shadcn 카드 스타일로 게임 분위기와 맞지 않음
- **게임성 부족**: 적이 없어 긴장감이 낮고, 위치 파악이 불가능하며, 게임 종료가 갑작스러움
- **시각 효과 부족**: 발자국, 눈 내리기 효과 등 몰입감 요소 부재

## Proposed Solution

10개 항목을 아래 5개 Phase로 나누어 구현한다.

---

## Phase 1: 핵심 버그 수정 (조작, 오디오, 타이머)

### 1-1. 게임 중 타이머 표시

**파일**: `app/components/game/Game.tsx`, `app/components/ui/GameHUD.tsx` (신규)

- 게임 플레이 중 화면 상단에 경과 시간을 표시하는 HUD 컴포넌트 추가
- `startTimeRef`를 활용해 매 프레임 시간 업데이트
- 스타일: 반투명 배경, 겨울 테마에 맞는 폰트
- HTML overlay로 Canvas 위에 렌더링 (`Game.tsx`의 `<Canvas>` 바깥에 배치)

```typescript
// app/components/ui/GameHUD.tsx
interface GameHUDProps {
  startTime: number;
  isPlaying: boolean;
}
// 매 초 업데이트되는 타이머를 MM:SS 포맷으로 표시
```

### 1-2. 마우스 조작 방식 변경

**파일**: `app/components/game/Player.tsx`

**현재 문제**: `document.body.requestPointerLock()` 호출로 커서가 잠김

**수정 방향**:
- 포인터 락 제거
- 마우스 왼쪽 버튼을 누르고 있으면 전진 (`mousedown`/`mouseup` 이벤트)
- 마우스 좌우 이동(movementX)으로 캐릭터 방향 회전 (버튼 누른 상태에서만)
- 키보드 WASD 조작은 유지

```typescript
// Player.tsx 수정사항
// 1. handleClick에서 requestPointerLock() 제거
// 2. mousedown → isMouseDown = true, 전진 시작
// 3. mouseup → isMouseDown = false, 전진 중지
// 4. mousemove → isMouseDown일 때만 movementX로 rotation 업데이트
```

### 1-3. 여동생 사운드 랜덤 재생 수정

**파일**: `app/hooks/usePositionalAudio.ts`

**현재 문제**: AudioContext가 `suspended` 상태에서 resume 처리가 불완전하고, `sourcePosition`이 ref로 전달되어 위치 업데이트가 안 됨

**수정 방향**:
- AudioContext resume 로직 강화: 사용자 인터랙션(클릭/키 입력) 시 resume
- `sourcePosition`을 매 프레임 업데이트하도록 수정 (현재 Sister.tsx에서 `currentPosition.current`를 초기값만 전달)
- 사운드 볼륨을 거리 기반으로 조절: 멀리서도 작게라도 들리도록 `refDistance`와 `rolloffFactor` 조정
- `refDistance: 5`, `rolloffFactor: 0.5`로 변경하여 멀리서도 미세하게 들리게
- 랜덤 재생 간격: 3~8초

### 1-4. 검사 캐릭터 애니메이션/방향 수정

**파일**: `app/components/game/Player.tsx`

**수정사항**:
- 항상 달리기 애니메이션 재생 (이동 여부와 무관)
- 모델 방향 180도 회전: `<primitive>` 에 `rotation-y={Math.PI}`를 추가하여 뒷모습이 보이도록

```tsx
<primitive object={scene} scale={1} rotation-y={Math.PI} />
```

---

## Phase 2: UI/UX 리디자인 (겨울 + 귀멸의 칼날 컨셉)

### 2-1. 디자인 컨셉

**테마**: 눈보라 + 귀멸의 칼날 (화풍, 일본 전통 문양)
- **컬러팔레트**: 어두운 남색(#0a1628), 빙하 블루(#4a9eff), 혈색 레드(#dc2626), 순백(#f0f4ff)
- **폰트**: 기존 Geist 유지하되, 제목에 일본풍 느낌의 굵은 폰트 스타일
- **배경**: 눈 파티클 CSS 애니메이션 + 그라데이션
- **UI 요소**: 반투명 유리 효과(glassmorphism) + 전통 문양 테두리

### 2-2. StartScreen 리디자인

**파일**: `app/components/ui/StartScreen.tsx`

- 배경: 어두운 남색 그라데이션 + CSS 눈 파티클 애니메이션
- 타이틀: 큰 일본풍 서체 스타일, 그림자 효과
- 카드: 반투명 유리 효과, 전통 문양 보더
- 버튼: 빙하 블루 글로우 효과
- 조작 설명: 아이콘 기반으로 직관적 표시

### 2-3. ClearScreen 리디자인 (클리어/패배)

**파일**: `app/components/ui/ClearScreen.tsx`

**클리어 시**:
- 밝은 따뜻한 톤 배경, 빛 파티클 효과
- "여동생을 찾았습니다!" 메시지에 빛나는 텍스트 효과

**패배 시** (혈귀에 의한 사망):
- 어두운 붉은 톤 배경
- "혈귀에게 당했습니다..." 메시지
- 화면 깨지는/균열 효과

### 2-4. GameHUD 스타일링

**파일**: `app/components/ui/GameHUD.tsx`

- 타이머: 화면 상단 중앙, 반투명 배경
- 미니맵: 화면 우하단 (Phase 3에서 구현)
- 전체적으로 반투명 + 블러 효과

---

## Phase 3: 미니맵 + 시각 이펙트

### 3-1. 소형 미니맵 추가

**파일**: `app/components/ui/Minimap.tsx` (신규)

- 화면 우하단에 120x120px 원형 미니맵
- 플레이어 위치: 중앙 고정 (화살표로 방향 표시)
- 여동생 위치: 미니맵 범위 내일 때만 작은 점으로 표시 (맵 전체 대비 상대적 위치)
- 혈귀 위치: 붉은 점으로 표시 (범위 내일 때만)
- 맵 스케일: 맵 전체(160m x 160m)를 미니맵에 맞춤
- 반투명 배경, 겨울 테마 보더
- `playerPosition`, `sisterPosition`, `demonPositions`를 props로 받음

```typescript
interface MinimapProps {
  playerPosition: Vector3;
  playerRotation: number;
  sisterPosition: Vector3;
  demonPositions: Vector3[];
  mapSize?: number; // 160 (맵 전체 크기)
}
```

### 3-2. 발자국 셰이더 효과

**파일**: `app/components/game/Footprints.tsx` (신규)

- 플레이어 이동 시 지면에 발자국 데칼(decal) 생성
- 구현 방식: Three.js `Mesh` + 커스텀 `ShaderMaterial`
  - 발자국 텍스처를 작은 평면 메시로 지면에 배치
  - opacity를 시간에 따라 감소시켜 4~5초 후 페이드아웃
- 일정 간격(0.8m)마다 발자국 생성
- 최대 발자국 수: 50개 (오래된 것부터 재활용 - 오브젝트 풀링)
- 발자국 메시: 작은 PlaneGeometry(0.3 x 0.4) + 알파 텍스처

```typescript
// ShaderMaterial uniforms
uniforms: {
  uTime: { value: 0 },      // 생성 시점
  uFadeStart: { value: 4.0 }, // 페이드 시작 시간
  uFadeDuration: { value: 1.0 }, // 페이드 지속 시간
  uColor: { value: new Color('#c8d8e8') }, // 눈 위 발자국 색
}
```

### 3-3. 눈 내리기 효과 개선

**파일**: `app/components/game/Snowstorm.tsx`

**현재**: 빠른 눈보라만 존재 (낙하 속도 -3~-5)

**수정**:
- 기존 눈보라 파티클 유지하되 낙하 속도를 조정
- 천천히 내리는 눈 레이어 추가: 낙하 속도 -0.5~-1.5
- 파티클 크기 다양화: 0.05~0.15 (원래 0.1 고정)
- 바람 효과 감소: x/z 속도를 줄여서 자연스럽게
- 부드러운 흔들림 효과: sin 파형으로 좌우 미세 흔들림

---

## Phase 4: 혈귀 적 시스템

### 4-1. BloodDemon 컴포넌트

**파일**: `app/components/game/BloodDemon.tsx` (신규)

- `blooddemon.glb` 모델 로드
- 걷기 애니메이션 재생 (항상)
- 랜덤 이동: Sister와 유사하지만 속도 1.5m/s (느린 배회)
- 방향 전환 간격: 6초
- 맵 바운더리: 70m 이내

```typescript
interface BloodDemonProps {
  initialPosition: Vector3;
  onPositionUpdate: (id: number, position: Vector3) => void;
  id: number;
}
```

### 4-2. Game.tsx에 혈귀 통합

**파일**: `app/components/game/Game.tsx`

- 5마리 혈귀 랜덤 배치 (원점에서 15~60m 거리, 균등 분포)
- 각 혈귀 위치 추적
- **근접 감지** (거리 < 15m): ColorHint에 어둠 효과 추가 (배경이 어두워짐)
- **충돌 감지** (거리 < 2m): 게임 오버 트리거
- 새 GameState 추가: `"gameover"`

```typescript
export type GameState = "start" | "playing" | "clear" | "gameover";
```

### 4-3. 혈귀 근접 시 화면 어두워짐

**파일**: `app/components/game/ColorHint.tsx`

- 기존 여동생 거리 기반 따뜻한 색감 + 혈귀 거리 기반 어둠 효과
- 혈귀 가까이: 화면 가장자리에 어두운 비네팅 + 붉은 기운
- 두 효과가 독립적으로 동작

```typescript
interface ColorHintProps {
  distance: number;       // 여동생까지 거리
  maxDistance?: number;
  demonDistance: number;   // 가장 가까운 혈귀까지 거리
  demonMaxDistance?: number;
}
```

### 4-4. 게임오버 UI

**파일**: `app/components/ui/GameOverScreen.tsx` (신규)

- 어두운 붉은 배경 + 균열/깨지는 효과
- "혈귀에게 당했습니다..." 메시지
- 경과 시간 표시
- "다시 하기" 버튼
- 귀멸의 칼날 스타일의 연출

---

## Phase 5: 게임 종료 전환 이펙트

### 5-1. 클리어 전환 이펙트

**파일**: `app/components/ui/TransitionEffect.tsx` (신규)

**여동생 발견 시**:
1. 화면이 서서히 밝아짐 (white fade, 1.5초)
2. 눈보라 파티클이 천천히 멈춤
3. 따뜻한 빛 파티클 CSS 효과
4. 1.5초 후 ClearScreen으로 전환

### 5-2. 게임오버 전환 이펙트

**혈귀 충돌 시**:
1. 화면이 붉게 번쩍임 (red flash)
2. 화면에 균열 효과 (CSS crack overlay)
3. 서서히 어두워짐 (dark fade, 1.5초)
4. 1.5초 후 GameOverScreen으로 전환

### 5-3. 전환 상태 관리

**파일**: `app/page.tsx`

- 새 상태: `transitioning` (boolean)
- `transitionType`: `"clear"` | `"gameover"` | null
- 전환 중에는 게임 입력 비활성화
- 전환 완료 후 최종 화면으로 이동

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);
const [transitionType, setTransitionType] = useState<"clear" | "gameover" | null>(null);
```

---

## Technical Considerations

### 성능
- 발자국 오브젝트 풀링 (50개 제한)으로 GC 방지
- 혈귀 5마리 추가로 인한 렌더링 부하: 모델이 2.2MB로 가벼워 문제 없음
- 미니맵은 HTML Canvas 2D로 구현해 Three.js 렌더링과 분리

### 오디오
- `usePositionalAudio` 내부에서 `sourcePosition`을 ref가 아닌 매 프레임 갱신값으로 처리
- AudioContext resume를 게임 시작 시 명시적으로 호출

### 모델 프리로드
- `useGLTF.preload("/model/blooddemon.glb")` 추가

---

## Acceptance Criteria

### Phase 1 - 핵심 버그
- [ ] 게임 플레이 중 화면 상단에 MM:SS 형식 타이머가 실시간 표시됨
- [ ] 마우스 클릭(누르고 있기) 시 전진, 마우스 좌우 이동 시 방향 회전
- [ ] 마우스를 놓으면 이동이 멈춤, 포인터 락이 발생하지 않음
- [ ] 여동생 사운드 3종이 랜덤 간격(3~8초)으로 재생됨
- [ ] 멀리서도 작은 볼륨으로 사운드가 들림
- [ ] 검사 캐릭터가 항상 달리기 애니메이션을 재생함
- [ ] 검사 캐릭터의 뒷모습이 사용자에게 보임

### Phase 2 - UI/UX
- [ ] StartScreen이 겨울+귀멸의 칼날 테마로 리디자인됨
- [ ] ClearScreen이 테마에 맞게 리디자인됨
- [ ] 게임 중 HUD가 반투명 + 블러 스타일로 표시됨

### Phase 3 - 미니맵 + 이펙트
- [ ] 우하단에 원형 미니맵이 표시되고 플레이어/여동생/혈귀 위치가 보임
- [ ] 플레이어 이동 시 바닥에 발자국이 나타남
- [ ] 발자국이 4~5초 후 페이드아웃됨
- [ ] 눈이 천천히 자연스럽게 내림 (기존 눈보라 + 느린 눈 레이어)

### Phase 4 - 혈귀
- [ ] 혈귀 5마리가 맵에 랜덤 배치되어 걷기 애니메이션으로 배회함
- [ ] 혈귀 근접 시(15m 이내) 화면이 어두워지고 붉은 기운이 감돌음
- [ ] 혈귀 충돌 시(2m 이내) 게임이 종료됨
- [ ] 게임오버 UI가 표시됨

### Phase 5 - 전환 이펙트
- [ ] 여동생 발견 시 밝아지는 전환 효과 후 ClearScreen 표시
- [ ] 혈귀 충돌 시 붉은 번쩍임 + 어두워지는 전환 효과 후 GameOverScreen 표시
- [ ] 전환 효과 중에는 게임 입력이 비활성화됨

---

## Dependencies & Risks

| 의존성/리스크 | 대응 |
|---|---|
| blooddemon.glb 모델의 애니메이션 이름 불확실 | 로드 후 `names` 배열에서 동적 탐색 |
| 발자국 셰이더 성능 | 오브젝트 풀링 + 최대 50개 제한 |
| 마우스 조작 변경으로 PC/모바일 동시 지원 | 마우스 이벤트 + 기존 TouchControls 통합 검토 |
| AudioContext 브라우저 정책 | 게임 시작 버튼 클릭 시 명시적 resume |

---

## 파일 변경 목록

### 수정 파일
| 파일 | 변경 내용 |
|---|---|
| `app/page.tsx` | GameState에 "gameover" 추가, 전환 상태 관리, GameOverScreen 통합 |
| `app/components/game/Game.tsx` | 혈귀 배치, 충돌 감지, 미니맵 데이터 전달, HUD 통합 |
| `app/components/game/Player.tsx` | 마우스 조작 변경, 항상 애니메이션 재생, 모델 180도 회전 |
| `app/components/game/Snowstorm.tsx` | 느린 눈 레이어 추가, 파티클 크기 다양화 |
| `app/components/game/ColorHint.tsx` | 혈귀 근접 시 어둠+붉은 효과 추가 |
| `app/components/ui/StartScreen.tsx` | 겨울+귀멸의 칼날 테마 리디자인 |
| `app/components/ui/ClearScreen.tsx` | 테마 리디자인 |
| `app/hooks/usePositionalAudio.ts` | 위치 업데이트 버그 수정, AudioContext resume 강화 |
| `app/globals.css` | 전환 이펙트 CSS 애니메이션, 눈 파티클 CSS |

### 신규 파일
| 파일 | 설명 |
|---|---|
| `app/components/ui/GameHUD.tsx` | 게임 중 타이머 + 미니맵 컨테이너 |
| `app/components/ui/Minimap.tsx` | 소형 원형 미니맵 |
| `app/components/ui/GameOverScreen.tsx` | 혈귀 사망 시 게임오버 화면 |
| `app/components/ui/TransitionEffect.tsx` | 클리어/게임오버 전환 이펙트 |
| `app/components/game/BloodDemon.tsx` | 혈귀 NPC 컴포넌트 |
| `app/components/game/Footprints.tsx` | 발자국 셰이더 이펙트 |

---

## References & Research

### Internal References
- 현재 조작 시스템: `app/components/game/Player.tsx:59-83` (포인터 락 로직)
- 오디오 시스템: `app/hooks/usePositionalAudio.ts:92-140` (재생 로직)
- NPC 이동 패턴: `app/components/game/Sister.tsx:68-106` (혈귀 이동에 재활용)
- 색감 힌트: `app/components/game/ColorHint.tsx:14-46` (혈귀 효과 확장)
- 파티클 시스템: `app/components/game/Snowstorm.tsx:40-68` (눈 효과 개선)

### Assets
- `/public/model/blooddemon.glb` (2.2MB) - 혈귀 3D 모델
- `/public/audio/sister-sound-1/2/3.mp3` - 여동생 사운드 3종
