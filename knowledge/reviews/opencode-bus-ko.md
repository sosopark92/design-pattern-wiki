---
title: "리뷰: opencode-bus (한국어)"
source_type: github
language: TypeScript
reviewed: 2026-04-21
source: https://github.com/anomalyco/opencode/tree/dev/packages/opencode/src/bus
snippets:
  - raw/snippets/opencode/bus-events.ts
  - raw/snippets/opencode/global.ts
  - raw/snippets/opencode/src-bus-index.ts
---

# 리뷰: opencode-bus

## 이 코드가 하는 일

세 파일이 함께 opencode의 컴포넌트 간 통신을 위한 타입-세이프 이벤트 버스를 구현한다. 세 파일은 독립적이지 않다 — 각각 이벤트 계약 정의, 로컬 타입 디스패치, process-level 전파라는 별도의 책임을 담당한다.

## 파일별 분석

### `bus-events.ts` — 이벤트 계약 레이어

```ts
const registry = new Map<string, Definition>()

export function define<Type, Properties>(type, properties) {
  registry.set(type, result)
  return result
}
```

`define()`은 이벤트 타입을 문자열 키와 Zod 스키마 쌍으로 등록한다. 전역 `registry` Map은 버스에 존재할 수 있는 모든 이벤트의 공식 카탈로그다. `payloads()`는 이 카탈로그를 Zod의 discriminated union으로 변환해 검증에 사용한다.

**패턴: Registry**
registry는 "어떤 이벤트가 존재하는가?"를 타입 시스템 수준에서 답한다. 이 레이어가 없으면 발행자가 임의의 문자열 키와 미검증 payload를 내보낼 수 있다 — 이벤트 버스의 고전적 유지보수 문제.

---

### `global.ts` — process-level 전파 레이어

```ts
export const GlobalBus = new EventEmitter<{ event: [GlobalEvent] }>()
```

Effect 의존성 없는 순수 Node.js `EventEmitter`. `GlobalEvent`는 `directory`, `project`, `workspace`, `payload`를 담아 인스턴스 경계를 넘어 라우팅할 수 있는 충분한 컨텍스트를 제공한다.

**패턴: Observer (최소 형태)**
이 파일이 교과서의 옵저버 패턴과 가장 유사하다: 이벤트 타입 하나, 여러 리스너, `GlobalEvent` 형태 외에는 타입 안전성 없음. 단순함은 의도적이다 — 이 파일은 탈출구이지 핵심 시스템이 아니다.

**왜 따로 존재하는가:** `src-bus-index.ts`의 `Bus.Service`는 인스턴스(열린 디렉토리) 단위로 스코프된다. 여러 프로젝트를 동시에 열면 `Bus.Service` 인스턴스도 여러 개 생긴다. `GlobalBus`는 이 경계를 넘는 단일 싱글톤이다. 로컬에서 발행된 모든 이벤트는 이 버스로도 전달된다.

---

### `src-bus-index.ts` — 로컬 디스패치 레이어

핵심 구현체. 일반 콜백 대신 Effect-TS `PubSub`을 사용한다.

**패턴: Event Bus (Subject를 공유한 Observer)**

```ts
type State = {
  wildcard: PubSub<Payload>
  typed: Map<string, PubSub<Payload>>
}
```

2-tier 디스패치: 이벤트 타입별 전용 PubSub(`typed`, 첫 구독 시 lazily 생성)과 wildcard 구독자를 위한 공유 PubSub. `publish()`는 항상 두 채널에 모두 쓴다:

```ts
if (ps) yield* PubSub.publish(ps, payload)  // typed 채널
yield* PubSub.publish(s.wildcard, payload)   // wildcard 채널
GlobalBus.emit("event", { ... })             // process-level 전파
```

**패턴: 2-tier 디스패치 (성능 최적화)**
이 분리 없이는 publish마다 타입과 무관하게 전체 구독자를 순회해야 한다. 분리하면 타입별 디스패치는 O(해당 타입 구독자 수). Wildcard 구독자는 타입 채널 수와 무관하게 단일 PubSub publish만 받는다.

**패턴: Registry (`bus-events.ts` 사용)**
파일 상단에서 `BusEvent.define(...)`으로 `Bus.InstanceDisposed`를 정의한다 — 계약 레이어가 실제로 어떻게 소비되는지 보여주는 예시.

**패턴: Effect lifecycle / 리소스 관리**
`Effect.addFinalizer()`가 종료 전 `InstanceDisposed` 이벤트를 발행하고, 모든 PubSub을 닫는 것을 보장한다. 구독 정리는 `Scope.make()`를 사용 — 반환된 unsubscribe 함수가 `Scope.close()`를 호출한다.

**두 가지 구독 인터페이스:**
- `subscribe(def)` → `Stream<Payload>` — Pull 방식: 소비자가 자신의 속도로 이벤트를 소비, 백프레셔는 스트림 인프라가 처리
- `subscribeCallback(def, callback)` → `Effect<() => void>` — Push 방식: 버스가 콜백을 호출; `Effect.tryPromise`로 감싸 cascade 실패 방지

## 식별된 패턴

| 패턴 | 파일 | 위치 |
| ---- | ---- | ---- |
| **[[knowledge/concepts/observer]]** | 세 파일 모두 | 핵심 구독 메커니즘 |
| **Event Bus** | `src-bus-index.ts`, `global.ts` | Subject를 싱글톤으로 추출 |
| **Registry** | `bus-events.ts` | `registry` Map + `define()` |
| **2-tier Dispatch** | `src-bus-index.ts:27-28` | `wildcard` + `typed` PubSub 분리 |
| **Effect lifecycle** | `src-bus-index.ts:56-70` | `InstanceState`, `addFinalizer`, `Scope` |

## 강점

- **종단간 타입 안전**: `BusEvent.define()` + Zod로 payload 형식이 맞지 않으면 컴파일 시점에 실패
- **두 가지 전달 방식**: Stream(Pull)과 콜백(Push)이 서로 다른 소비자 요구를 인프라 중복 없이 커버
- **2-tier 디스패치**: 타입 이벤트에 대한 O(전체 구독자) fan-out 방지
- **정확한 정리**: 모든 구독 리소스에 명시적 finalizer 경로 존재
- **GlobalBus 브리지**: 메인 버스를 process 스코프에 결합하지 않고 process-level 전파 가능
- **에러 격리**: 콜백 구독자를 `Effect.tryPromise`로 감싸 한 구독자의 실패가 다른 구독자에 영향 없음

## 안티패턴 / 냄새

발견되지 않음. 주의할 부분 하나:

- `subscribeAll` / `subscribeAllCallback`이 wildcard payload에 `any`를 사용한다. 의도적 트레이드오프("전체 이벤트"라는 의미에서 필터링 없음)이지만, 호출자는 payload 쪽 타입 안전성을 잃는다.

## 개선 제안

- 이벤트 순서 보장에 대한 문서화: 단일 typed 채널 내에서 이벤트가 발행 순서대로 전달되는가? (PubSub 의미론상 yes이겠지만 명시되지 않음)
- wildcard payload에 `any` 대신 타입이 있는 기본 인터페이스 고려
- `unbounded` PubSub의 대용량 이벤트 시 백프레셔 처리 가이드라인 추가

## 진단

**잘 설계된 프로덕션 수준의 코드다.** 세 파일의 분리는 의도적이고 명확하다: 계약 정의, 로컬 디스패치, 글로벌 전파가 각각 단일 책임을 갖는다. 2-tier 디스패치는 대부분의 이벤트 버스 구현이 생략하는 성숙한 최적화다. Zod를 통한 파이프라인 전체의 타입 안전성은 런타임 에러의 전체 범주를 방지한다. Stream + 콜백의 이중 인터페이스는 서로 다른 소비자 맥락에 실질적인 유연성을 제공한다.

주된 공백은 문서화다 — 이벤트 순서 보장과 `unbounded` PubSub의 백프레셔 동작이 코드 어디에도 명시되지 않는다.

## 연결 문서

- [[knowledge/concepts/observer]] — 세 파일 모두의 기반 메커니즘
- [[knowledge/connections/observer-event-bus]] — 구조적 비교 전체; 3-레이어 아키텍처
