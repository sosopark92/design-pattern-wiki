import z from "zod"
import { Effect, Exit, Layer, PubSub, Scope, Context, Stream } from "effect"
import { EffectLogger } from "@/effect/logger"
import { Log } from "../util/log"
import { BusEvent } from "./bus-event"
import { GlobalBus } from "./global"
import { WorkspaceContext } from "@/control-plane/workspace-context"
import { InstanceState } from "@/effect/instance-state"
import { makeRuntime } from "@/effect/run-service"

export namespace Bus {
  const log = Log.create({ service: "bus" })

  // [Event Bus] 버스 자체가 발행할 수 있는 시스템 이벤트 정의.
  // BusEvent.define()은 bus-events.ts의 Registry에 이 이벤트를 등록한다.
  // "버스가 종료될 때 버스 스스로 이벤트를 발행한다" — 자기 자신도 발행자.
  export const InstanceDisposed = BusEvent.define(
    "server.instance.disposed",
    z.object({
      directory: z.string(),
    }),
  )

  type Payload<D extends BusEvent.Definition = BusEvent.Definition> = {
    type: D["type"]
    properties: z.infer<D["properties"]>
  }

  // [Event Bus — 2-tier 구조]
  // 이 버스의 핵심 상태. 채널이 두 개다:
  //   wildcard: 모든 이벤트를 받는 공유 PubSub — "전체 구독"용
  //   typed:    이벤트 타입별 전용 PubSub Map — "특정 이벤트만 구독"용
  //
  // publish할 때 항상 두 채널 모두에 쓴다.
  // 이렇게 분리하면 typed 채널 구독자는 자기 타입의 이벤트만 받으므로
  // 불필요한 fan-out 없이 O(해당 타입 구독자 수)로 디스패치된다.
  type State = {
    wildcard: PubSub.PubSub<Payload>
    typed: Map<string, PubSub.PubSub<Payload>>
  }

  // [Event Bus — 공개 인터페이스]
  // 이 인터페이스가 버스의 계약이다. 발행(publish)과 구독(subscribe) 두 축으로 구성.
  // 구독은 두 가지 방식을 제공:
  //   Stream 방식 — 소비자가 자신의 속도로 이벤트를 꺼내감 (Pull)
  //   Callback 방식 — 버스가 이벤트 발생 시 함수를 호출함 (Push, 내부는 Stream 위에 구현)
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

  export class Service extends Context.Service<Service, Interface>()("@opencode/Bus") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const state = yield* InstanceState.make<State>(
        Effect.fn("Bus.state")(function* (ctx) {
          const wildcard = yield* PubSub.unbounded<Payload>()
          const typed = new Map<string, PubSub.PubSub<Payload>>()

          // [Event Bus — 리소스 정리]
          // 버스가 종료될 때 반드시 실행되는 finalizer.
          // 순서가 중요하다: 먼저 InstanceDisposed 이벤트를 발행해
          // 구독자들이 "버스가 꺼진다"는 신호를 받을 수 있게 한 뒤,
          // 그 다음에 모든 PubSub을 shutdown한다.
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

      // [Event Bus — typed 채널 lazy 생성]
      // typed Map에 해당 타입의 PubSub이 없으면 그때 만든다.
      // 모든 이벤트 타입의 PubSub을 미리 만들지 않고,
      // 첫 구독자가 생길 때 비로소 채널이 만들어진다.
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

      // [Event Bus — 발행]
      // 하나의 publish 호출이 세 곳에 동시에 전달된다:
      //   1. typed 채널 (해당 타입 구독자만)
      //   2. wildcard 채널 (전체 구독자)
      //   3. GlobalBus (다른 인스턴스/프로세스로 전파)
      // typed 채널은 구독자가 없으면(채널 자체가 없으면) 건너뛴다.
      function publish<D extends BusEvent.Definition>(def: D, properties: z.output<D["properties"]>) {
        return Effect.gen(function* () {
          const s = yield* InstanceState.get(state)
          const payload: Payload = { type: def.type, properties }
          log.info("publishing", { type: def.type })

          const ps = s.typed.get(def.type)
          if (ps) yield* PubSub.publish(ps, payload)   // typed 채널
          yield* PubSub.publish(s.wildcard, payload)   // wildcard 채널

          const dir = yield* InstanceState.directory
          const context = yield* InstanceState.context
          const workspace = yield* InstanceState.workspaceID

          GlobalBus.emit("event", {                    // process-level 전파
            directory: dir,
            project: context.project.id,
            workspace,
            payload,
          })
        })
      }

      // [Event Bus — Stream 구독 (Pull)]
      // PubSub을 Stream으로 변환해서 반환한다.
      // 소비자가 Stream을 소비하는 속도로 이벤트를 꺼내간다.
      // 구독 해제는 Stream이 끝날 때(또는 Scope가 닫힐 때) 자동 처리.
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

      function subscribeAll(): Stream.Stream<Payload> {
        log.info("subscribing", { type: "*" })
        return Stream.unwrap(
          Effect.gen(function* () {
            const s = yield* InstanceState.get(state)
            return Stream.fromPubSub(s.wildcard)
          }),
        ).pipe(Stream.ensuring(Effect.sync(() => log.info("unsubscribing", { type: "*" }))))
      }

      // [Event Bus — Callback 구독 (Push)]
      // 내부는 PubSub → Stream → runForEach → callback 호출 구조.
      // 겉으로는 콜백처럼 보이지만 실제로는 Stream 위에서 동작한다.
      //
      // Effect.tryPromise로 감싸는 이유:
      //   콜백 하나가 예외를 던져도 다른 구독자에 영향이 없도록 격리.
      //
      // Scope를 반환하는 이유:
      //   구독 해제 시 () => Scope.close(scope) 를 호출하면
      //   Stream 실행, PubSub 구독이 모두 정리된다 — 메모리 누수 없음.
      function on<T>(pubsub: PubSub.PubSub<T>, type: string, callback: (event: T) => unknown) {
        return Effect.gen(function* () {
          log.info("subscribing", { type })
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
            Effect.runFork(Scope.close(scope, Exit.void).pipe(Effect.provide(EffectLogger.layer)))
          }
        })
      }

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

      return Service.of({ publish, subscribe, subscribeAll, subscribeCallback, subscribeAllCallback })
    }),
  )

  export const defaultLayer = layer

  const { runPromise, runSync } = makeRuntime(Service, layer)

  // [Event Bus — 외부 공개 API]
  // Effect 런타임을 모르는 호출자를 위한 일반 async/sync 래퍼.
  // 내부의 Effect 세계를 바깥으로 노출하지 않고 사용할 수 있게 한다.
  export async function publish<D extends BusEvent.Definition>(def: D, properties: z.output<D["properties"]>) {
    return runPromise((svc) => svc.publish(def, properties))
  }

  export function subscribe<D extends BusEvent.Definition>(
    def: D,
    callback: (event: { type: D["type"]; properties: z.infer<D["properties"]> }) => unknown,
  ) {
    return runSync((svc) => svc.subscribeCallback(def, callback))
  }

  export function subscribeAll(callback: (event: any) => unknown) {
    return runSync((svc) => svc.subscribeAllCallback(callback))
  }
}
