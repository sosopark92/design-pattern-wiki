---
title: "Observer / Event Bus (한국어)"
aliases: ["Pub-Sub", "이벤트 리스너", "이벤트 기반 아키텍처"]
tags: [behavioral]
sources:
  - "https://refactoring.guru/design-patterns/observer"
  - "https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/"
  - "knowledge/reviews/opencode-bus"
created: 2026-04-21
updated: 2026-04-22
---

# Observer / Event Bus (옵저버 패턴 / 이벤트 버스)

옵저버 패턴은 하나의 객체(Subject)의 상태가 변했을 때, 그것을 구독하고 있는 여러 객체(Observer)에게 자동으로 알림을 보내는 행동 패턴이다. 1:N 관계를 정의하며, Subject가 바뀌면 등록된 Observer 전체가 통보를 받는다.

Subject 역할을 하나의 공유 싱글톤(버스)으로 추출하면 옵저버 패턴이 **이벤트 버스**가 된다. 이것이 **이벤트 기반 아키텍처(Event-Driven Architecture, EDA)** 의 핵심이다: 컴포넌트들이 직접 호출 대신 이벤트를 통해 통신하는 시스템 설계 방식.

## 의도

- 하나의 객체 상태 변화를 여러 의존 객체에게 자동으로 전파한다
- Subject와 Observer를 분리해 느슨한 결합을 만든다
- 런타임에 구독/해지를 동적으로 처리할 수 있다
- EDA 맥락에서: 독립적인 컴포넌트들이 서로를 모르면서도 시스템 상태 변화에 반응할 수 있게 한다

## 구조

옵저버 패턴의 네 가지 참여자:

1. **Subject (주체)** — Observer 목록을 유지하고, 상태 변화 시 전체에게 통보한다
2. **Observer (관찰자)** — 통보를 받기 위한 인터페이스를 정의한다
3. **Concrete Subject** — 상태를 저장하고 변화 시 통보를 트리거한다
4. **Concrete Observer** — 통보 인터페이스를 구현하고, 변화에 반응한다

이벤트 버스 / EDA의 다섯 가지 핵심 구성요소:

1. **Event Source (이벤트 소스)** — 의미 있는 행동에서 이벤트를 생성한다 (예: "예약 확정" 버튼 클릭)
2. **Event (이벤트)** — 시스템의 의미 있는 발생 또는 상태 변화를 나타낸다; 타입과 payload를 담는다
3. **Event Broker / Bus (이벤트 버스)** — Publisher에서 모든 매칭 Subscriber로 이벤트를 라우팅하는 중앙 허브
4. **Publisher (발행자)** — 이벤트를 비동기로 발행한다; 누가 듣는지 알 필요 없다
5. **Subscriber (구독자)** — 특정 이벤트 타입에 관심을 등록한다; 다른 구독자와 독립적으로 반응한다

보조 역할: **Event Handler** (구독자별 응답 로직 정의), **Dispatcher** (이벤트를 올바른 핸들러로 라우팅), **Listener** (관련 이벤트 모니터링).

## 언제 사용하는가

- 하나의 변화가 다른 객체들을 변경시켜야 하는데, 그 대상이 얼마나 될지 사전에 알 수 없을 때
- 객체가 다른 객체들에게 알려야 하지만, 그 대상이 누구인지 몰라야 할 때
- 런타임에 구독/해지가 필요할 때
- 여러 독립 서비스가 동일한 트리거에 반응해야 하는데 서로 결합되면 안 될 때 (EDA)
- 분산된 컴포넌트 간 실시간 반응성이 필요할 때

## 언제 사용하지 않는가

- Observer 수가 고정되어 컴파일 시점에 이미 알고 있는 경우 (직접 메서드 호출이 더 간단)
- 콜백 실행 순서가 중요한 경우 (통보 순서는 예측 불가)
- 성능이 매우 중요하고 통보 오버헤드를 감당하기 어려운 경우
- 컴포넌트 간 강한 일관성(strong consistency)이 필요한 경우 — EDA는 본질적으로 결과적 일관성(eventual consistency)

## 전달 방식 (Push vs Pull)

두 가지 방식이 있으며, 모두 [[knowledge/reviews/opencode-bus]]에서 확인할 수 있다:

- **Push 방식** (`subscribeCallback`): 버스가 구독자에게 콜백을 직접 호출한다. 코드가 단순하지만, 콜백이 실패하면 디스패치 루프 전체에 영향을 줄 수 있다. opencode는 `Effect.tryPromise`로 감싸 방어한다.
- **Pull 방식** (`subscribe` → `Stream` 반환): 구독자가 자신의 속도로 이벤트를 소비한다. 비동기 파이프라인에 자연스럽게 맞으며, 백프레셔는 스트림 인프라가 처리한다.

## 장단점

### 장점

- 개방/폐쇄 원칙 — Subject나 Publisher를 수정하지 않고 새 Observer를 추가할 수 있다
- 느슨한 결합 — Publisher와 Subscriber가 서로의 구체적인 타입을 몰라도 된다
- 런타임 동적 구독
- 독립적인 서비스 간 실시간 반응성과 확장성

### 단점

- 통보 순서가 예측 불가
- Observer를 해지하지 않으면 메모리 누수 발생
- Observer가 많아지면 이벤트 흐름 추적이 어려워진다
- 분산 시스템에서 이벤트 순서 보장과 일관성 유지가 어렵다
- 비동기 환경에서 디버깅이 어렵다 — 단일 콜 스택이 없어서 추적이 힘들다
- 이벤트 발생과 구독자 응답 사이에 지연(latency)이 생긴다

## 실제 적용 사례

- **금융 서비스**: 거래 이벤트 발생 시 사기 탐지, 알림, 감사 로그가 각각 독립적으로 반응
- **이커머스**: 주문 완료 → 재고, 알림, 분석, 배송이 버스를 통해 반응
- **통신**: 네트워크 모니터링 이벤트가 알림, 로깅, 장애 복구 시스템으로 퍼진다
- **온라인 게임**: 플레이어 행동이 게임 상태, 리더보드, 상대 클라이언트에 브로드캐스트
- **항공 예매** (연습 시나리오): `booking.confirmed` → 결제·마일리지·수하물·탑승권이 각자 반응

## 실제 사례

- [[knowledge/reviews/opencode-bus]] — 3-레이어 이벤트 버스: Registry(`bus-events.ts`), 로컬 타입 디스패치(`src-bus-index.ts`), 글로벌 전파(`global.ts`)

## 출처

- https://refactoring.guru/design-patterns/observer
- https://www.geeksforgeeks.org/system-design/event-driven-architecture-system-design/
- [[knowledge/reviews/opencode-bus]]
