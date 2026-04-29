# Order 뷰 명세

> 파일: `src/pages/OrderPage.jsx`, `src/pages/OrderDetailPage.jsx`

---

## OrderPage (주문조회 목록)

> 라우트: `/order/list` (ProtectedRoute)

### 필터 UI

| 필터 | 옵션 | API 파라미터 |
| :--- | :--- | :--- |
| 주문상태 | 전체·입금전·배송준비중·배송중·배송완료·취소·교환·반품 | `status` (STATUS_API_MAP 매핑) |
| 조회기간 | 오늘·1개월·3개월·6개월·기간설정 | `period` (`1d`/`1m`/`3m`/`6m`) 또는 `start_date`/`end_date` |
| 페이지 크기 | 고정 3건 (`PAGE_SIZE = 3`) | `size=3` |

- 기간설정 선택 시 `DayPicker`(range 모드) 노출.
- 필터 변경 시 `page`를 `1`로 초기화.

### 주문 카드 구조

> `GET /orders` 응답에 `items` 배열이 없어 order 헤더 레벨 데이터만 렌더링한다.

```
┌──────────────────────────────────────────────────────┐
│ 헤더: 주문일(order.date)  주문번호(order.id)  상세보기 > │
├──────────────────────────────────────────────────────┤
│ 바디: 주문상태(STATUS_DISPLAY_MAP)  색상(STATUS_COLOR_MAP)│
│       받는 분 · receiver_name                         │
├──────────────────────────────────────────────────────┤
│ 푸터: 상품금액 X원 - 할인 0원   최종 결제금액 X원      │
└──────────────────────────────────────────────────────┘
```

### 주문 상태 표시 매핑

| order_state | 표시 라벨 | 색상 |
| :--- | :--- | :--- |
| `ORDER_COMPLETED` | 주문완료 | 녹색 `#3ea76e` |
| `PAYMENT_COMPLETED` | 결제완료 | 녹색 `#3ea76e` |
| `INVENTORY_RESERVED` | 결제대기 | 녹색 `#3ea76e` |
| `ORDER_CHECKED_OUT` | 주문접수 | 황색 `#f59e0b` |
| `ORDER_CANCELLED` | 주문취소 | 적색 `#ef4444` |
| `PAYMENT_FAILED` | 결제실패 | 적색 `#ef4444` |
| `INVENTORY_RESERVATION_FAILED` | 재고부족 | 적색 `#ef4444` |
| `INVENTORY_DEDUCTION_FAILED` | 처리오류 | 적색 `#ef4444` |
| `INVENTORY_RELEASE_FAILED` | 취소오류 | 적색 `#ef4444` |
| `INVENTORY_RELEASED` | 주문취소 | 회색 `#888` |

### 페이지네이션

- `<Pagination>` 컴포넌트 사용. 페이지 변경 시 `window.scrollTo(0, 0)`.
- `page` state는 1-indexed (`useState(1)`). 백엔드도 1-indexed (`page=1` = 첫 페이지).

---

## OrderDetailPage (주문상세조회)

> 라우트: `/order/detail/:id` (ProtectedRoute)

### 데이터 흐름

```
useGetOrderByIdQuery(id)          → GET /orders/{order_id}   (주문 헤더 + items)
  └─ items[].productId
       └─ useGetProductSummaryQuery(productId)  → GET /product/frontend/{productId}  (이미지 취득)
```

- `GET /orders/{order_id}` items에 `imageUrl`이 없으므로 각 상품마다 `getProductSummary`를 별도 호출해 이미지를 가져온다.
- 이미지 우선순위: `item.img` (향후 백엔드 추가 시) → `summary?.img` → 🐾 placeholder.
- RTK Query 캐시로 동일 `productId`의 중복 요청은 자동 방지.

### 섹션 구성

| 섹션 | 내용 |
| :--- | :--- |
| 주문 정보 | 주문번호, 주문일자, 주문자, 주문처리상태 |
| 주문 상품 | 상품 이미지 + 구매후기 버튼 / 상품명, 옵션, 수량·금액 / 상태 배지 / 송장번호 |
| 결제 정보 | 결제수단, 총 결제금액, 총 주문금액, 할인금액 |
| 배송지 정보 | 받는 분, 우편번호, 주소, 휴대폰, 배송메시지 |

### 주문 상품 카드 구조

- 아이템 행 레이아웃: `flex gap-14 py-10 first:pt-0`

```
┌──────────────┐  상품명              [상태 배지]
│   이미지     │  [옵션명]
│  128 × 128   │  수량 : N개 / X원
├──────────────┤
│  구매후기    │
└──────────────┘
```

### 구매후기 버튼

- 이미지 바로 아래 배치, 모든 주문 상품에 항상 노출.
- 클릭 시 `/review/write`(ProtectedRoute)로 이동.
- navigate state: `{ orderId, productId, productName, productImage }`.
- `WriteReviewPage`에서 `location.state`로 수신.
