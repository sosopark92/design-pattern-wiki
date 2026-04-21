---
title: "연결: Observer와 Event Bus"
connects:
  - "knowledge/concepts/observer"
  - "knowledge/reviews/opencode-bus"
sources:
  - "knowledge/reviews/opencode-bus"
  - "raw/references/designPattern-eventbus.md"
created: 2026-04-21
updated: 2026-04-21
---

# 연결: Observer와 Event Bus

## 연결 고리

이벤트 버스는 Subject 역할을 공유된 중앙 중개자로 추출한 옵저버 패턴이다. 구조적 차이는 단 하나의 설계 결정에서 비롯된다: **Observer 목록을 누가 갖고 있는가?**

|                        | Observer                           | Event Bus              |
| ---------------------- | ---------------------------------- | ---------------------- |
| Observer 목록 소유     | Subject 자신 (예: `UserService`)   | Bus 싱글톤             |
| 발행자가 소비자를 아는가? | 암묵적으로 앎 (목록을 들고 있음)   | 전혀 모름              |
| 소비자가 발행자를 아는가? | Subject를 직접 참조해야 함         | 전혀 모름              |
| 여러 발행 주체         | 각 Subject가 별도로 존재           | 모두 하나의 Bus 공유   |
| 이벤트 타입 관리       | 암묵적 / 비체계적                  | Registry로 명시적 관리 |

## 핵심 인사이트

기본 옵저버에서는 **결합도가 Subject 쪽으로 이동한다**. 소비자가 세 가지 Subject의 이벤트를 받으려면 각각에 직접 구독해야 한다. Subject는 여전히 Observer 목록을 들고 있으므로 Observer를 "알고" 있는 셈이다.

이벤트 버스는 Subject 역할을 익명화·공유화함으로써 이 문제를 해결한다. `publish(이벤트타입, payload)`는 어떤 Subject 참조도 필요 없다. 소비자는 발행자를 모르고 `subscribe(이벤트타입)`만 하면 된다. 양쪽 모두 **이벤트 타입 계약**만 알면 된다. opencode에서는 `BusEvent.define()` + Zod 스키마가 이를 강제한다.

대가: 모든 이벤트가 버스를 공유하므로 **이벤트 타입 관리가 필수**가 된다. 이것이 Registry 패턴이 항상 Event Bus 구현과 함께 등장하는 이유다.

## 3-레이어 아키텍처 (opencode)

opencode는 이벤트 버스를 책임이 분리된 세 파일로 구현한다:

```
bus-events.ts      → 계약 레이어    (이벤트 타입 정의 + Zod 스키마 등록)
src-bus-index.ts   → 디스패치 레이어 (인스턴스별 typed/wildcard PubSub)
global.ts          → 전파 레이어    (process 경계를 넘는 단순 전달)
```

**`bus-events.ts` — Registry / 계약**

`define(type, zodSchema)`가 각 이벤트 타입을 전역 Map에 등록한다. "어떤 이벤트가 존재하는가?"를 타입 시스템 수준에서 답한다. 이 레이어가 없으면 버스는 임의의 문자열 키와 미검증 payload를 받게 된다 — 이벤트 버스의 고전적 함정("이벤트가 너무 많아지면 복잡해짐").

**`src-bus-index.ts` — 로컬 타입 디스패치**

Effect-TS PubSub으로 2-tier 디스패치를 구현한다(아래 참고). 단일 인스턴스(디렉토리) 내에서 typed 구독과 wildcard 구독을 처리한다. 로컬 디스패치 후 모든 이벤트를 `GlobalBus.emit()`으로 전달한다.

**`global.ts` — 글로벌 전파**

Effect 의존성 없는 순수 Node.js `EventEmitter`. `Bus.Service`가 인스턴스 단위로 스코프되어 있기 때문에 존재한다 — 여러 프로젝트가 열려 있으면 `Bus.Service`도 여러 개 생긴다. `GlobalBus`는 이 경계를 넘는 단일 process-level 버스다. 전달만 할 뿐 처리는 하지 않는다.

## 2-tier 디스패치 — 타입 필터링에 최적화된 옵저버

```ts
type State = {
  wildcard: PubSub<Payload>           // 모든 이벤트 수신
  typed: Map<string, PubSub<Payload>> // 이벤트 타입별 전용 PubSub, 첫 구독 시 lazily 생성
}
```

`publish()`는 항상 두 채널에 모두 쓴다:

```ts
if (ps) yield* PubSub.publish(ps, payload)   // typed (해당 타입 구독자만)
yield* PubSub.publish(s.wildcard, payload)    // wildcard (전체 이벤트 구독자)
```

이 분리 없이는 `publish()`마다 타입과 무관하게 전체 구독자를 스캔해야 한다 — O(전체 구독자). 분리하면 타입별 디스패치는 O(해당 타입 구독자 수)가 된다.

## Push vs Pull — 두 가지 전달 방식

opencode에서 둘 다 등장한다:

- **Push** (`subscribeCallback`): 버스가 콜백을 호출한다. 코드가 단순하다. opencode는 `Effect.tryPromise`로 감싸 콜백 실패가 디스패치 루프를 중단시키지 않도록 한다.
- **Pull** (`subscribe` → `Stream` 반환): 소비자가 자신의 속도로 이벤트를 소비한다. 비동기 파이프라인에 자연스럽게 맞으며, 백프레셔는 스트림 인프라가 처리한다.

## 이벤트 흐름 (처음부터 끝까지)

```
BusEvent.define("server.instance.disposed", z.object({...}))
  ↓ registry에 등록 (bus-events.ts)

Bus.publish(InstanceDisposed, { directory: "/foo" })
  ↓
  typed["server.instance.disposed"] PubSub → typed 구독자 (Push 또는 Pull)
  wildcard PubSub                          → wildcard 구독자 (Push 또는 Pull)
  GlobalBus.emit("event", {...})           → process 전체 전파 (global.ts)
```

## 근거

[[knowledge/reviews/opencode-bus]]에서 확인:

- `bus-events.ts` `registry` Map — 전체 계약 레이어를 뒷받침하는 Registry
- `State.wildcard` + `State.typed` (`src-bus-index.ts:27-28`) — 2-tier 구조
- `publish()` (`src-bus-index.ts:86-107`) — typed 먼저, 그 다음 wildcard, 마지막으로 GlobalBus
- `global.ts` — process 경계 탈출을 위한 plain EventEmitter

## 관련 문서

- [[knowledge/concepts/observer]] — 기반 메커니즘
- [[knowledge/reviews/opencode-bus]] — 근거 소스 (bus-events.ts, global.ts, src-bus-index.ts)
