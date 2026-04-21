---
title: "Observer (한국어)"
aliases: ["Pub-Sub", "이벤트 리스너"]
tags: [behavioral]
sources:
  - "https://refactoring.guru/design-patterns/observer"
  - "knowledge/reviews/opencode-bus"
created: 2026-04-21
updated: 2026-04-21
---

# Observer (옵저버 패턴)

옵저버 패턴은 하나의 객체(Subject)의 상태가 변했을 때, 그것을 구독하고 있는 여러 객체(Observer)에게 자동으로 알림을 보내는 행동 패턴이다. 1:N 관계를 정의하며, Subject가 바뀌면 등록된 Observer 전체가 통보를 받는다.

## 의도

- 하나의 객체 상태 변화를 여러 의존 객체에게 자동으로 전파한다
- Subject와 Observer를 분리해 느슨한 결합을 만든다
- 런타임에 구독/해지를 동적으로 처리할 수 있다

## 구조

네 가지 참여자:

1. **Subject (주체)** — Observer 목록을 유지하고, 상태 변화 시 전체에게 통보한다
2. **Observer (관찰자)** — 통보를 받기 위한 인터페이스를 정의한다
3. **Concrete Subject** — 상태를 저장하고 변화 시 통보를 트리거한다
4. **Concrete Observer** — 통보 인터페이스를 구현하고, 변화에 반응한다

## 언제 사용하는가

- 하나의 변화가 다른 객체들을 변경시켜야 하는데, 그 대상이 얼마나 될지 사전에 알 수 없을 때
- 객체가 다른 객체들에게 알려야 하지만, 그 대상이 누구인지 몰라야 할 때
- 런타임에 구독/해지가 필요할 때

## 언제 사용하지 않는가

- Observer 수가 고정되어 컴파일 시점에 이미 알고 있는 경우 (직접 메서드 호출이 더 간단)
- 콜백 실행 순서가 중요한 경우 (통보 순서는 예측 불가)
- 성능이 매우 중요하고 통보 오버헤드를 감당하기 어려운 경우

## 전달 방식 (Push vs Pull)

두 가지 방식이 있으며, 모두 [[knowledge/reviews/opencode-bus]]에서 확인할 수 있다:

- **Push 방식** (`subscribeCallback`): 버스가 구독자에게 콜백을 직접 호출한다. 코드가 단순하지만, 콜백이 실패하면 디스패치 루프 전체에 영향을 줄 수 있다. opencode는 `Effect.tryPromise`로 감싸 방어한다.
- **Pull 방식** (`subscribe` → `Stream` 반환): 구독자가 자신의 속도로 이벤트를 소비한다. 비동기 파이프라인에 자연스럽게 맞으며, 백프레셔는 스트림 인프라가 처리한다.

## Event Bus 변형

Subject 역할을 하나의 공유 싱글톤(버스)으로 추출하면 옵저버 패턴이 **이벤트 버스**가 된다. 발행자는 `publish(타입, payload)`만 호출하면 되고, 구독자는 `subscribe(타입)`만 하면 된다. 양쪽 모두 이벤트 타입 계약만 알면 된다. opencode에서는 `BusEvent.define()` + Zod 스키마가 이 계약을 강제한다.

구조적 비교와 3-레이어 아키텍처 전체 설명은 [[knowledge/connections/observer-event-bus]]를 참고하라.

## 장단점

### 장점

- 개방/폐쇄 원칙 — Subject를 수정하지 않고 새 Observer를 추가할 수 있다
- 느슨한 결합 — Subject와 Observer가 서로의 구체적인 타입을 몰라도 된다
- 런타임 동적 구독

### 단점

- 통보 순서가 예측 불가
- Observer를 해지하지 않으면 메모리 누수 발생
- Observer가 많아지면 이벤트 흐름 추적이 어려워진다

## 실제 사례

- [[knowledge/reviews/opencode-bus]] — 3-레이어 이벤트 버스: Registry(`bus-events.ts`), 로컬 타입 디스패치(`src-bus-index.ts`), 글로벌 전파(`global.ts`)

## 출처

- https://refactoring.guru/design-patterns/observer
- [[knowledge/reviews/opencode-bus]]
