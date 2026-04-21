# Event-bus Pattern

The Event Bus pattern is a design pattern used in software architecture to facilitate communication between **decoupled components** through a central, asynchronous "bus". Publishers send events to the bus, while subscribers listen for specific events, enabling components to interact without being aware of each other, thus enhancing scalability and maintainability.

## Core Components & Synonyms

Publisher: Sends messages/events to the bus.  
Subscriber: Listens for specific event types on the bus.  
Event Bus: Acts as a broker, router, or mediator. 

EventBus = Publisher와 Subscriber 간 이벤트 교환을 하게 하는 통신 중재자 역할  
Subscriber = 이벤트 버스에서 특정 이벤트를 수신, 필요한 특정 이벤트를 구독(subscribe)  
             이벤트가 버스에 게시 되면 구독자에게 알림이 전송되어 특정 작업 수행  
Publisher = 이벤트를 생성, 구독자가 누구인지 알 필요 없이 이벤트 버스에 이벤트를 게시  
  

## 예시

'쇼핑몰 주문시스템(Publisher)'에서 '주문완료(Event)'됐다는 신호를 받았다고 해보자.

'주문완료' Event가 발생하면:
**쇼핑몰 주문 시스템(Publisher)**은 아래와 같은 시스템을 직접 호출하지 않고 **“주문 완료(Event)”**만 버스에 알림을 보내면 된다.

예를 들어,
한 고객이 쇼핑몰에서 운동화 한 켤레를 장바구니에 담고 결제를 완료했을 때

고객 화면에서는 “주문이 정상적으로 접수되었습니다” 표시되어 보이지만

시스템 안에서는 여러 일이 동시에 필요하다.

- 재고 시스템: 재고 차감 요청
- 이메일 시스템: 이메일 발송 요청
- 포인트 시스템: 포인트 계산 요청
- 물류 시스템: 물류 전달 요청
- 통계 시스템: 통계 반영 요청
- 로그 시스템: 로그 저장 요청

이벤트 버스가 없다면 주문 시스템은 이런 걸 직접 해야 한다.

그러나 이벤트 버스가 있으면 주문 시스템은 “주문이 정상적으로 끝났어" 이 사실만 알리면 된다.

이벤트 버스는 "중앙 안내 방송" 역할이다.
누가 주문완료(OrderPlaced) 이벤트를 듣고 있는지 알고 있고, 그 이벤트가 올라오면 등록된 시스템들에게 그 사실을 전달한다.
이때 이벤트 버스는 직접 일을 처리하지 않고 그냥 전달만 한다.

이벤트 버스에게 이벤트를 전달 받은 하위 시스템들 (Subscriber)들은 각자에게 주어진 일을 하게 된다.
: 재고 업데이트, 이메일 전송, 포인트 계산, 출고 목록 생성 등등

어느날 쇼핑몰 사장님이 “주문 확인 메일 말고 문자도 보내자.”라고 하면,
주문 시스템 코드에 문자 발송 로직을 직접 넣지 않고 "문자 시스템"을 생성만 해주면 된다.

이것이 바로 이벤트 버스 패턴의 가장 큰 장점인 "느슨한 연결" 이다. 주문 시스템은 다른 시스템들의 상세 구현을 몰라도 된다는 것.

```python

class EventBus: # 이벤트 버스
    def __init__(self):
        self.listeners = {} #구독자 목록

    def subscribe(self, event_type, listener): # key = 이벤트 이름 value = 이벤트 발생 시 실행할 시스템
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(listener)

    def publish(self, event_type, data):
        listeners = self.listeners.get(event_type, []) #해당 이벤트를 구독한 시스템 목록 가져오기
        for listener in listeners: #시스템 하나씩 실행
            try:
                listener(data)
            except Exception as e:
                print(f"{listener.__name__} 실행 중 오류 발생: {e}")


def send_email(order):
    print(f"[이메일] 주문 {order['order_id']} 확인 메일 발송")

def update_stock(order):
    print(f"[재고] 상품 {order['product_id']} 재고 차감")

def add_points(order):
    print(f"[포인트] 사용자 {order['user_id']}에게 포인트 적립")


bus = EventBus()
bus.subscribe("order_placed", send_email)
bus.subscribe("order_placed", update_stock)
bus.subscribe("order_placed", add_points)

order_data = {
    "order_id": 101,
    "user_id": 7,
    "product_id": "A100"
}

'''
'order_placed'를 듣고 있는 시스템 목록을 찾고
send_email(order_data) 실행
update_stock(order_data) 실행
add_points(order_data) 실행
'''

bus.publish("order_placed", order_data)

```

### 장점

- 객체들끼리 직접 강하게 연결되지 않음
- 기능 추가가 쉬움
- 큰 시스템에서 확장성이 좋음
- 여러 모듈이 독립적으로 움직이기 좋음

### 단점

- 이벤트 흐름이 눈에 잘 안 보일 수 있음
- 디버깅이 어려워질 수 있음
- 이벤트가 너무 많아지면 복잡해짐
- 누가 언제 처리하는지 추적이 힘들 수 있음

## 옵저버 패턴과의 차이점

옵저버 패턴 = 직접 구독
이벤트 버스 패턴 = 중앙 통로(버스)를 통한 간접 전달
