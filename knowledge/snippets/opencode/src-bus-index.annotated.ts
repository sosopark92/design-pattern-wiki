// =============================================================================
// EVENT BUS PATTERN — src/bus/index.ts (opencode)
//
// 전체 아키텍처: 2-tier dispatch
//
//   [Publisher]
//       │
//       ▼
//   Bus.publish(def, props)
//       │
//       ├──► typed PubSub  (해당 이벤트 타입을 구독한 구독자에게만)
//       ├──► wildcard PubSub  (모든 이벤트를 구독하는 구독자에게)
//       └──► GlobalBus.emit()  (다른 인스턴스로 크로스-인스턴스 전파)
//
// Tier 1 (Local Bus): Effect PubSub — per-instance, typed, functional reactive
// 현재 인스턴스 안에서만 이벤트 전달
// Tier 2 (Global Bus): Node.js EventEmitter — cross-instance, untyped, imperative
// 인스턴스 밖으로도 이벤트 전달

// 인스턴스: InstanceState로 격리된 디렉토리/프로젝트/워크스페이스 단위
// 인스턴스 A: 프로젝트 A를 위한 로컬 bus
// 인스턴스 B: 프로젝트 B를 위한 로컬 bus
// A 안에서 publish한 이벤트는 A의 구독자에게만 전달되고, B의 구독자는 받지 않음
// =============================================================================

import z from "zod"
import { Effect, Exit, Layer, PubSub, Scope, Context, Stream } from "effect"
import { EffectBridge } from "@/effect"
import { Log } from "../util"
import { BusEvent } from "./bus-event"
// GlobalBus = Node.js EventEmitter. 인스턴스 경계를 넘어야 할 때만 사용.
// (예: SSE로 클라이언트에 이벤트 전달, 다른 서버 인스턴스 통지)
import { GlobalBus } from "./global"
import { InstanceState } from "@/effect"
import { makeRuntime } from "@/effect/run-service"

const log = Log.create({ service: "bus" })

// ---------------------------------------------------------------------------
// InstanceDisposed — 인스턴스 종료를 알리는 sentinel 이벤트
//
// BusEvent.define()은 두 가지 일을 동시에 한다:
//   1. { type, properties } 정의 객체 반환  →  타입 안전한 publish/subscribe에 사용
//   2. 전역 registry에 등록  →  payloads()로 OpenAPI 스키마 생성에 사용
//
// 즉 이벤트 정의 = 런타임 디스패치 키 + 스키마 선언이 한 곳에 모임 (Single Source of Truth)
// ---------------------------------------------------------------------------
export const InstanceDisposed = BusEvent.define(
  "server.instance.disposed", //런타임 디스패치 키
  z.object({
    directory: z.string(),
  }),
)

// ---------------------------------------------------------------------------
// Payload<D> — Bus를 통해 전달되는 이벤트의 공통 형태
//
// type: 런타임 라우팅 키 (어느 typed PubSub으로 보낼지 결정)
// properties: Zod로 검증된 실제 데이터 (Zod는 데이터 검증 라이브러리)
//
// D가 없으면 Payload = 와일드카드 구독용 (모든 이벤트를 하나의 타입으로 받음)
// D를 지정하면 Payload<D> = 특정 이벤트 타입에 좁혀진(narrowed) 구독용
// ---------------------------------------------------------------------------
type Payload<D extends BusEvent.Definition = BusEvent.Definition> = {
  type: D["type"]
  properties: z.infer<D["properties"]>
}

// ---------------------------------------------------------------------------
// State — 인스턴스당 Bus의 내부 상태
//
// wildcard: 모든 이벤트가 흐르는 단일 채널 (subscribeAll용)
// typed: 이벤트 타입 → 전용 채널 맵 (subscribe(def)용, lazy 생성)
//
// 핵심 설계 결정: typed PubSub을 미리 만들지 않고 lazy하게 생성한다.
// → 실제로 구독자가 생긴 이벤트 타입의 채널만 메모리에 존재
// → 수십 개의 이벤트 정의가 있어도 구독 없으면 PubSub 객체 0개
// ---------------------------------------------------------------------------
type State = {
  wildcard: PubSub.PubSub<Payload>
  typed: Map<string, PubSub.PubSub<Payload>>
}

// ---------------------------------------------------------------------------
// Interface — Bus 서비스가 외부에 노출하는 계약(contract)
//
// Effect API (subscribe, subscribeAll, subscribeCallback, subscribeAllCallback):
//   Effect 런타임 안에서 사용. 조합(compose) 가능.
//
// 두 종류의 구독 API를 제공하는 이유:
//   subscribe()        → Stream 반환: Effect 파이프라인 안에서 조합할 때
//   subscribeCallback() → 언리스너 함수 반환: React/외부 코드 등 Effect 밖에서 쓸 때

// Effect<Success, Error, Requirements>를 성공값, 에러, 필요한 의존성
// ---------------------------------------------------------------------------
export interface Interface {
  readonly publish: <D extends BusEvent.Definition>(
    def: D,
    properties: z.output<D["properties"]>,
  ) => Effect.Effect<void>
  readonly subscribe: <D extends BusEvent.Definition>(def: D) => Stream.Stream<Payload<D>>
  readonly subscribeAll: () => Stream.Stream<Payload>
  readonly subscribeCallback: <D extends BusEvent.Definition>(
    def: D,
    callback: (event: Payload<D>) => unknown,
  ) => Effect.Effect<() => void>
  readonly subscribeAllCallback: (callback: (event: any) => unknown) => Effect.Effect<() => void>
}

// ---------------------------------------------------------------------------
// Service — Effect의 의존성 주입(DI) 컨테이너
//
// Context.Service<Service, Interface>()("@opencode/Bus") 의미:
//   - "@opencode/Bus" = DI 태그 (런타임에 이 키로 서비스를 찾음)
//   - 다른 Effect 코드에서 yield* Service로 이 서비스를 주입받음
//   - 구현체(layer)와 인터페이스(Interface)를 분리 → 테스트 시 mock layer 교체 가능
// ---------------------------------------------------------------------------
export class Service extends Context.Service<Service, Interface>()("@opencode/Bus") {}

// ---------------------------------------------------------------------------
// layer — Service의 실제 구현을 제공하는 Effect Layer
//
// Layer.effect(Service, ...) = "Service 태그에 이 Effect를 실행한 결과를 바인딩"
// 앱 시작 시 한 번 실행되어 Service 인스턴스를 DI 컨테이너에 등록함
// ---------------------------------------------------------------------------
export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    // -------------------------------------------------------------------------
    // InstanceState.make — 디렉토리(프로젝트)별 격리된 상태 생성
    //
    // opencode는 여러 프로젝트를 동시에 열 수 있다.
    // 각 디렉토리(인스턴스)마다 독립적인 wildcard + typed PubSub을 가져야
    // 프로젝트 A의 이벤트가 프로젝트 B 구독자에게 새어나가지 않는다.
    // InstanceState는 그 격리를 보장하는 컨텍스트 키 역할을 한다.
    // -------------------------------------------------------------------------
    const state = yield* InstanceState.make<State>(
      Effect.fn("Bus.state")(function* (ctx) {
        // unbounded: 버퍼 크기 제한 없음.
        // 이벤트 유실 없이 모두 전달해야 하는 버스에 적합.
        // (bounded를 쓰면 버퍼 풀 시 publisher가 블로킹될 수 있음)
        const wildcard = yield* PubSub.unbounded<Payload>()
        const typed = new Map<string, PubSub.PubSub<Payload>>()

        // -------------------------------------------------------------------
        // Finalizer — 인스턴스 종료 시 정리 순서가 중요하다
        //
        // 순서:
        //   1. InstanceDisposed 이벤트를 먼저 publish (구독자들이 정리 기회를 얻음)
        //   2. wildcard PubSub shutdown (더 이상 이벤트 수신 불가)
        //   3. 모든 typed PubSub shutdown
        //
        // shutdown 전에 InstanceDisposed를 보내지 않으면 구독자가 "갑자기 채널이 닫힘"을
        // 감지할 뿐 이유를 알 수 없다. sentinel 이벤트가 graceful teardown을 가능하게 함.
        // -------------------------------------------------------------------
        yield* Effect.addFinalizer(() =>
          Effect.gen(function* () {
            yield* PubSub.publish(wildcard, {
              type: InstanceDisposed.type,
              properties: { directory: ctx.directory },
            })
            yield* PubSub.shutdown(wildcard)
            for (const ps of typed.values()) {
              yield* PubSub.shutdown(ps)
            }
          }),
        )

        return { wildcard, typed }
      }),
    )

    // -----------------------------------------------------------------------
    // getOrCreate — typed PubSub의 lazy 초기화
    //
    // 패턴: get-or-create (map에 없으면 만들어서 넣고 반환)
    // Effect.gen으로 감싼 이유: PubSub.unbounded()가 Effect를 반환하기 때문
    //
    // 이 함수 덕분에 State 초기화 시 모든 이벤트 타입의 PubSub을 미리 만들 필요가 없다.
    // 첫 subscribe(def) 호출 시점에 해당 타입의 채널이 생성된다.
    // -----------------------------------------------------------------------
    function getOrCreate<D extends BusEvent.Definition>(state: State, def: D) {
      return Effect.gen(function* () {
        let ps = state.typed.get(def.type)
        if (!ps) {
          ps = yield* PubSub.unbounded<Payload>()
          state.typed.set(def.type, ps)
        }
        return ps as unknown as PubSub.PubSub<Payload<D>>
      })
    }

    // -----------------------------------------------------------------------
    // publish — 2-tier dispatch의 핵심
    //
    // 발행 순서:
    //   1. typed PubSub (해당 이벤트 타입 구독자)
    //      - typed.get()으로 채널을 찾는다. 없으면 skip (구독자 없음 = 채널 없음)
    //      - getOrCreate를 쓰지 않는 이유: publish 시 채널을 lazy 생성하면
    //        "구독자 없는 채널"이 생겨 메모리 누수. publish는 있을 때만 보냄.
    //   2. wildcard PubSub (모든 이벤트 구독자)
    //      - 항상 발행. wildcard는 항상 존재.
    //   3. GlobalBus.emit() (크로스-인스턴스 전파)
    //      - Node.js EventEmitter로 인스턴스 경계 밖으로 이벤트를 내보냄
    //      - directory/project/workspace 메타데이터를 함께 전송
    //        → 수신 측에서 "어느 인스턴스의 이벤트인가"를 구분할 수 있게
    // -----------------------------------------------------------------------
    function publish<D extends BusEvent.Definition>(def: D, properties: z.output<D["properties"]>) {
      return Effect.gen(function* () {
        const s = yield* InstanceState.get(state)
        const payload: Payload = { type: def.type, properties }
        log.info("publishing", { type: def.type })

        // typed 먼저: 특정 이벤트만 기다리는 구독자가 wildcard보다 먼저 받을 보장은 없지만,
        // typed → wildcard 순서를 지키면 "타입 구독자가 wildcard 구독자보다 먼저 처리"
        // 라는 일관된 순서가 생긴다.
        const ps = s.typed.get(def.type)
        if (ps) yield* PubSub.publish(ps, payload)
        yield* PubSub.publish(s.wildcard, payload)

        const dir = yield* InstanceState.directory
        const context = yield* InstanceState.context
        const workspace = yield* InstanceState.workspaceID

        // Tier 2: Effect 세계 밖으로 이벤트를 내보냄
        // GlobalBus는 Node.js EventEmitter이므로 Effect 없이 .on()으로 구독 가능
        GlobalBus.emit("event", {
          directory: dir,
          project: context.project.id,
          workspace,
          payload,
        })
      })
    }

    // -----------------------------------------------------------------------
    // subscribe — 특정 이벤트 타입을 Stream으로 구독
    //
    // Stream.unwrap: Effect<Stream>을 Stream으로 펼침
    //   → getOrCreate가 Effect를 반환하므로 필요
    //
    // Stream.ensuring: 스트림 종료(정상/에러/취소 모두) 시 로그 출력
    //   → 구독이 언제 끊기는지 추적 가능 (디버깅에 중요)
    //
    // Stream.fromPubSub: PubSub을 consume하는 구독자 하나를 생성
    //   Effect PubSub은 fan-out: 구독자 N명이면 이벤트가 N개 복사되어 전달
    // -----------------------------------------------------------------------
    function subscribe<D extends BusEvent.Definition>(def: D): Stream.Stream<Payload<D>> {
      log.info("subscribing", { type: def.type })
      return Stream.unwrap(
        Effect.gen(function* () {
          const s = yield* InstanceState.get(state)
          const ps = yield* getOrCreate(s, def)
          return Stream.fromPubSub(ps)
        }),
      ).pipe(Stream.ensuring(Effect.sync(() => log.info("unsubscribing", { type: def.type }))))
    }

    // -----------------------------------------------------------------------
    // subscribeAll — 모든 이벤트를 Stream으로 구독 (wildcard)
    //
    // subscribe()와 구조 동일. 차이점:
    //   - getOrCreate 불필요 (wildcard는 항상 존재)
    //   - Payload<D>가 아닌 Payload (모든 이벤트 타입의 공통 형태)
    // -----------------------------------------------------------------------
    function subscribeAll(): Stream.Stream<Payload> {
      log.info("subscribing", { type: "*" })
      return Stream.unwrap(
        Effect.gen(function* () {
          const s = yield* InstanceState.get(state)
          return Stream.fromPubSub(s.wildcard)
        }),
      ).pipe(Stream.ensuring(Effect.sync(() => log.info("unsubscribing", { type: "*" }))))
    }

    // -----------------------------------------------------------------------
    // on — PubSub을 callback 기반 API로 브리지하는 내부 헬퍼
    //
    // Effect 세계(PubSub, Stream)와 콜백 세계를 잇는 어댑터.
    // subscribeCallback / subscribeAllCallback이 이 함수를 공유한다.
    //
    // 구독 생명주기:
    //   1. EffectBridge.make(): Effect 코드를 Effect 런타임 밖에서 실행할 수 있는 포털
    //   2. Scope.make(): 이 구독의 리소스 생명주기를 담는 스코프
    //   3. PubSub.subscribe(pubsub): 스코프에 묶인 구독자 토큰 생성
    //   4. Stream.fromSubscription → Stream.runForEach: 이벤트마다 callback 호출
    //   5. Effect.forkScoped: 백그라운드에서 비동기 실행 (non-blocking)
    //
    // 반환값 () => void:
    //   - 호출하면 Scope를 닫음 → PubSub 구독 해제 + fork된 fiber 취소
    //   - React의 useEffect cleanup 패턴과 동일한 구조
    //   - bridge.fork(): cleanup은 Effect 런타임 밖에서 실행되므로
    //     EffectBridge를 통해 Effect 코드를 "외부에서 실행"
    //
    // callback 에러 처리:
    //   - Effect.tryPromise + Effect.ignore: callback이 throw/reject해도
    //     구독 자체는 계속 살아있음. 에러 로그만 남기고 다음 이벤트를 처리.
    // -----------------------------------------------------------------------
    function on<T>(pubsub: PubSub.PubSub<T>, type: string, callback: (event: T) => unknown) {
      return Effect.gen(function* () {
        log.info("subscribing", { type })
        const bridge = yield* EffectBridge.make()
        const scope = yield* Scope.make()
        const subscription = yield* Scope.provide(scope)(PubSub.subscribe(pubsub))

        yield* Scope.provide(scope)(
          Stream.fromSubscription(subscription).pipe(
            Stream.runForEach((msg) =>
              Effect.tryPromise({
                try: () => Promise.resolve().then(() => callback(msg)),
                catch: (cause) => {
                  log.error("subscriber failed", { type, cause })
                },
              }).pipe(Effect.ignore),
            ),
            Effect.forkScoped,
          ),
        )

        return () => {
          log.info("unsubscribing", { type })
          // Scope.close = 이 구독에 묶인 모든 리소스 해제
          // bridge.fork = Effect 코드를 현재 Effect 컨텍스트 밖에서 실행
          bridge.fork(Scope.close(scope, Exit.void))
        }
      })
    }

    // -----------------------------------------------------------------------
    // subscribeCallback / subscribeAllCallback
    //
    // on()의 얇은 래퍼. 차이:
    //   subscribeCallback: getOrCreate로 typed PubSub 획득 후 on()
    //   subscribeAllCallback: wildcard PubSub에 직접 on()
    //
    // Effect.fn("이름"): 이 Effect에 tracing 이름을 붙임 (디버깅/프로파일링용)
    // -----------------------------------------------------------------------
    const subscribeCallback = Effect.fn("Bus.subscribeCallback")(function* <D extends BusEvent.Definition>(
      def: D,
      callback: (event: Payload<D>) => unknown,
    ) {
      const s = yield* InstanceState.get(state)
      const ps = yield* getOrCreate(s, def)
      return yield* on(ps, def.type, callback)
    })

    const subscribeAllCallback = Effect.fn("Bus.subscribeAllCallback")(function* (callback: (event: any) => unknown) {
      const s = yield* InstanceState.get(state)
      return yield* on(s.wildcard, "*", callback)
    })

    // Service.of(): Interface를 만족하는 객체를 Service 태그에 등록
    return Service.of({ publish, subscribe, subscribeAll, subscribeCallback, subscribeAllCallback })
  }),
)

export const defaultLayer = layer

// ---------------------------------------------------------------------------
// makeRuntime — Effect 런타임을 일반 JS/TS 코드에서 쓸 수 있게 래핑
//
// runPromise: Effect → Promise (async 컨텍스트에서 사용)
// runSync:    Effect → 동기값 (동기 컨텍스트에서 사용)
//
// 아래의 export 함수들(publish, subscribe, subscribeAll)은 Effect를 모르는
// 호출자(예: React 컴포넌트, CLI 핸들러)를 위한 plain JS API다.
// Effect 세계와 일반 JS 세계 사이의 경계(seam)가 여기서 만들어진다.
// ---------------------------------------------------------------------------
const { runPromise, runSync } = makeRuntime(Service, layer)

// runSync 사용 가능 조건:
//   subscribe 체인(InstanceState.get → PubSub.subscribe → Scope.make → forkScoped)이
//   완전히 동기적일 때만 안전하다. 비동기 단계가 추가되면 런타임 에러 발생.
export async function publish<D extends BusEvent.Definition>(def: D, properties: z.output<D["properties"]>) {
  return runPromise((svc) => svc.publish(def, properties))
}

// runSync: subscribe 설정 자체는 동기적 (채널 등록, fiber fork까지만)
// 실제 이벤트 수신은 백그라운드 fiber에서 비동기로 처리
export function subscribe<D extends BusEvent.Definition>(
  def: D,
  callback: (event: { type: D["type"]; properties: z.infer<D["properties"]> }) => unknown,
) {
  return runSync((svc) => svc.subscribeCallback(def, callback))
}

export function subscribeAll(callback: (event: any) => unknown) {
  return runSync((svc) => svc.subscribeAllCallback(callback))
}

export * as Bus from "."
