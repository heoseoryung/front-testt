# 충돌 리포트

API 명세 변경 적용 과정에서 발생한 이전 코드와의 충돌 기록.

---

## [ORDER-02] `createOrder` URL 오류 — `/orders/get` (명세: `/orders/subject`)

- **발생일**: 2026-04-25
- **최종 명세 확정**: 2026-04-27 (`/orders/subject` 로 변경)
- **관련 파일**: `src/api/orderApi.js`
- **상태**: ❌ 미해결 (코드 미반영)

### 내용

`createOrder` endpoint URL이 `/orders/get`으로 설정되어 있으나 명세 기준은 `POST /orders/subject`다 (2026-04-27 서버 변경). Cart API의 `GET /cart/get`과 혼동한 것으로 추정.

### 영향 범위

| 파일 | 현재 값 | 명세 값 |
| ---- | ------- | ------- |
| `src/api/orderApi.js` | `url: '/orders/get'` | `url: '/orders/subject'` |

---

## [CHECKOUT-04] `requestPayment` orderId `order-` prefix로 인한 PaymentSuccessPage 파괴

- **발생일**: 2026-04-25
- **관련 파일**: `src/pages/CheckoutPage.jsx`, `src/pages/PaymentSuccessPage.jsx`
- **상태**: ❌ 미해결

### 내용

`requestPayment` 호출 시 orderId를 `` `order-${orderId}` `` 형식으로 전달함. Toss가 `successUrl`로 리다이렉트할 때 이 값이 그대로 URL 파라미터로 전달되어, `PaymentSuccessPage`에서 다음 문제가 연쇄 발생한다.

### 파괴 경로

```
requestPayment({ orderId: "order-123" })
  → successUrl?orderId=order-123&paymentKey=...&amount=...
  → PaymentSuccessPage

  Number("order-123") = NaN

  ├── useSubscribePaymentEventsQuery(NaN)  → SSE /payments/orders/NaN/events 연결 (잘못된 경로)
  ├── confirmPayment({ orderId: NaN })     → 서버 400 / 결제 승인 실패
  └── navigate("/order/detail/order-123") → 라우트 불일치 (orderId 파라미터가 숫자가 아님)
```

### 수정 방향 (미적용)

`CheckoutPage.jsx`에서 `` `order-${orderId}` `` → `String(orderId)` 로 되돌리거나,  
`PaymentSuccessPage.jsx`에서 `order-` prefix를 제거한 뒤 숫자로 변환한다.

### 영향 범위

| 파일 | 문제 코드 |
| ---- | --------- |
| `src/pages/CheckoutPage.jsx` | `` orderId: `order-${orderId}` `` in `requestPayment` |
| `src/pages/PaymentSuccessPage.jsx` | `Number(orderId)` — `"order-123"` 입력 시 `NaN` |

---

## [CART-01] `DELETE /cart/selected` 제거

- **발생일**: 2026-04-24
- **관련 명세**: CartServer API 명세서 (2026-04-24 업데이트)
- **상태**: ✅ 해결 — 2026-04-24 Cart API 재업데이트로 선택삭제 복원

### 내용

기존 명세에 있던 `DELETE /api/v1/cart/selected` (선택 항목 일괄 삭제) 엔드포인트가 한때 제거됐으나, 이후 Cart API 재업데이트에서 엔드포인트 구조가 변경되어 복원됨.

### 최종 엔드포인트 구조

| 엔드포인트 | 용도 |
| ---------- | ---- |
| `DELETE /cart/selected` | **단건 삭제** — 카드 1개 「삭제」 버튼 |
| `DELETE /cart/selecteditems` | **복수 삭제** — 체크박스 선택 「선택삭제」 버튼 |

### 영향 범위

| 파일 | 변경 내용 |
| ---- | --------- |
| `src/api/cartApi.js` | `removeCartItem` URL → `/cart/selected`, `removeSelectedCartItems` 추가 (`DELETE /cart/selecteditems`) |
| `src/pages/CartPage.jsx` | 「선택삭제」 버튼 및 `handleRemoveSelected` 핸들러 복원, 더보기 페이지네이션 추가 |

### 현재 상태

선택삭제 기능 복원 완료 (2026-04-24). 단건·복수 삭제 엔드포인트 분리 적용.

---

## [CHECKOUT-01] `renderPaymentMethods` Promise fulfilled 미전이

- **발생일**: 2026-04-24
- **관련 파일**: `src/pages/CheckoutPage.jsx`
- **상태**: ✅ 해결 — useEffect 의존성 배열 수정

### 내용

Toss 결제위젯의 `renderPaymentMethods` Promise가 fulfilled 상태로 전이되지 않아 결제수단 UI가 로드되지 않는 문제.

### 원인

위젯 렌더링 useEffect의 의존성 배열에 `finalAmount > 0` (boolean 표현식)을 사용한 것이 원인.

```js
// 문제 코드
}, [widgets, finalAmount > 0, widgetsRendered])
```

**실행 흐름**:
1. `loadTossPayments` 완료 → `setWidgets(w)` → dep `widgets` 변화 → effect 실행
2. 이 시점에 `finalAmount = 0` (product fetch 진행 중) → `finalAmount <= 0` guard → 조기 반환
3. product fetch 완료 → `onReady` 호출 → `finalAmount` 증가
4. dep `finalAmount > 0`이 `false → true` 로 전환되어야 effect 재실행되는데, product fetch가 느리거나 실패하면 전환이 일어나지 않음
5. effect 재실행 없음 → `renderPaymentMethods` 호출되지 않음 → 스피너 무한 표시

### 해결

`finalAmount > 0` boolean 표현식 대신 `finalAmount` 값 자체를 의존성으로 사용.

```js
// 수정 코드
}, [widgets, finalAmount, widgetsRendered])
```

`finalAmount`가 0→양수로 변할 때, 그리고 이후 금액이 바뀔 때마다 effect가 재실행된다. `widgetsRendered` guard가 중복 렌더링을 방지하므로 안전하다.

### 영향 범위

| 파일 | 변경 내용 |
| ---- | --------- |
| `src/pages/CheckoutPage.jsx` | 위젯 렌더 useEffect dep `finalAmount > 0` → `finalAmount` |

---

## [CHECKOUT-02] 위젯 금액 동기화 effect의 `widgetsRendered` dep 누락

- **발생일**: 2026-04-24
- **관련 파일**: `src/pages/CheckoutPage.jsx`
- **상태**: ✅ 해결 — useEffect 의존성 배열에 `widgetsRendered` 추가

### 내용

`finalAmount`가 변경되는 시점에 `widgetsRendered = false`이면 금액 동기화 effect가 guard에서 조기 반환된다. 이후 `widgetsRendered = true`가 돼도 dep에 없으므로 effect가 재실행되지 않아 위젯 표시 금액과 실제 결제 금액이 불일치한다.

### 원인

```js
// 문제 코드
}, [finalAmount])
```

`widgetsRendered`가 dep에 없어, `widgetsRendered`가 `false → true`로 전환될 때 effect가 재실행되지 않음.

### 재현 흐름

1. 첫 번째 product 로드 → `finalAmount = 10000` → 위젯 render effect 진행 중 (`setAmount(10000)`)
2. 두 번째 product 로드 → `finalAmount = 15000` → 금액 동기화 effect 실행
   - `widgetsRendered = false` → guard 반환
3. `renderPaymentMethods` 완료 → `setWidgetsRendered(true)`
4. `finalAmount` 변화 없음 → 금액 동기화 effect 미실행
5. 위젯: 10000 / UI: 15000 → **결제 금액 불일치**

### 해결

```js
// 수정 코드
}, [finalAmount, widgetsRendered])
```

`widgetsRendered`가 `true`로 전환되는 순간 effect가 재실행되어 최신 `finalAmount`로 위젯 금액을 동기화한다.

### 영향 범위

| 파일 | 변경 내용 |
| ---- | --------- |
| `src/pages/CheckoutPage.jsx` | 금액 동기화 useEffect dep `[finalAmount]` → `[finalAmount, widgetsRendered]` |

---

## [ORDER-01] Order Server API 명세 변경 적용 (2026-04-24)

- **발생일**: 2026-04-24
- **관련 파일**: `src/api/orderApi.js`, `src/pages/CheckoutPage.jsx`, `docs/domain/order.md`
- **상태**: ✅ 해결 — 명세 변경 사항 코드·문서에 반영 완료

### 변경 내용

| 항목 | 이전 | 이후 |
| ---- | ---- | ---- |
| `POST /orders` request body | `user_id` 포함 | `user_id` 제거 (서버가 쿠키에서 추출) |
| `POST /orders` response | `{ orderId: 200001 }` JSON | plain `Long` text (예: `200001`) |
| `DELETE /orders/{order_id}` | `409 Conflict` (미구현) | `202 Accepted` (정상) |
| order_state | — | `ORDER_CANCELLED` 추가 |

### 영향 범위

| 파일 | 변경 내용 |
| ---- | --------- |
| `src/api/orderApi.js` | `createOrder` — `responseHandler: 'text'` 추가, `transformResponse` → `Number(res)` 방식으로 변경 |
| `src/pages/CheckoutPage.jsx` | `createOrder` 호출부에서 `user_id: Number(user.userId)` 제거 |
| `docs/domain/order.md` | `user_id` 필드 제거, response body plain Long 명세, `ORDER_CANCELLED` 상태 추가, DELETE 202 정상화 |

---

## [CHECKOUT-03] `createOrder` 응답 envelope 미처리로 `orderId` null

- **발생일**: 2026-04-24
- **관련 파일**: `src/api/orderApi.js`, `src/pages/CheckoutPage.jsx`
- **상태**: ✅ 해결 — `transformResponse`에서 `res.data ?? res` envelope 처리 추가

### 내용

`createOrder` 완료 후 `orderId`가 `null`로 추출되어 `requestPayment`가 호출되지 않는 문제.

### 원인

```js
// 문제 코드
transformResponse: (res) => ({ orderId: res.orderId ?? res.order_id ?? null }),
```

게이트웨이가 `{ data: { orderId: 200001 } }` 형태로 응답을 감싸는 경우 `res.orderId`는 `undefined` → `orderId = null`.

`handlePayment`에서 `if (!orderId) throw new Error('주문 ID를 확인할 수 없습니다.')` 실행 → catch → `requestPayment` 미도달.

### 해결

```js
// 수정 코드
transformResponse: (res) => { const d = res.data ?? res; return { orderId: d.orderId ?? d.order_id ?? null } },
```

`res.data ?? res`로 envelope를 먼저 벗긴 뒤 `orderId`를 추출. 다른 endpoint의 `transformResponse`와 동일한 패턴.

### 영향 범위

| 파일 | 변경 내용 |
| ---- | --------- |
| `src/api/orderApi.js` | `createOrder` `transformResponse` — `res.data ?? res` envelope 처리 추가 |
| `docs/domain/order.md` | `POST /orders` Success Response body 및 envelope 주의사항 명세 추가 |
