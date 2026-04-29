# Payment 도메인

기준일: 2026-04-29

## 개요

`paymentserver`는 프론트와 TossPayments를 연결하는 결제 브리지 역할을 담당한다.  
외부 공개 경로는 `gatewayserver` 기준 `/api/v1/payments/**` 이고, 내부 `paymentserver`는 `/payments/**` 경로를 사용한다.

> **Base URL:** `https://localhost:8072/api/v1`

---

## 결제 상태값 정의

| status | 설명 |
|---|---|
| `READY` | 결제 준비 (prepare 완료) |
| `PAID` | 결제 승인 완료 (confirm 완료) |
| `CANCELLED` | 결제 취소 완료 |

---

## API 엔드포인트 (`src/api/paymentApi.js`)

`apiSlice.injectEndpoints()`로 정의.

| 훅 | 메서드 | 경로 | 구현 여부 |
|---|---|---|:---:|
| `usePreparePaymentMutation()` | POST | `/payments/prepare` | ✅ |
| `useConfirmPaymentMutation()` | POST | `/payments/confirm` | ✅ |
| `useCancelPaymentMutation()` | POST | `/payments/{paymentId}/cancel` | ❌ 미구현 |
| `useGetPaymentByOrderIdQuery(orderId)` | GET | `/payments/orders/{orderId}` | ❌ 미구현 |
| `useSubscribePaymentEventsQuery(orderId)` | GET SSE | `/payments/orders/{orderId}/events` | ✅ |

---

## `POST /payments/prepare`

결제 준비 레코드를 생성한다. 주문 생성 후 Toss 위젯 `requestPayment()` 호출 전에 실행.

### Request Body

| Name | Type | Required | Description |
|---|---|:---:|---|
| `orderId` | Long | ✅ | 주문 ID |
| `orderName` | String | ✅ | 주문명 또는 대표 상품명 |
| `amount` | Long | ✅ | 결제 금액 (1 이상) |
| `customerName` | String | ❌ | 주문자명 |
| `customerEmail` | String | ❌ | 주문자 이메일 |
| `currency` | String | ❌ | 통화 코드, 기본값 `KRW` |

```json
{
  "orderId": 200001,
  "orderName": "어글어글 스팀 100g 8종",
  "amount": 12900,
  "customerName": "홍길동",
  "customerEmail": "test@example.com",
  "currency": "KRW"
}
```

### Success Response — `201 Created`

```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 200001,
  "orderName": "어글어글 스팀 100g 8종",
  "amount": 12900,
  "customerName": "홍길동",
  "customerEmail": "test@example.com",
  "currency": "KRW",
  "status": "READY"
}
```

### Error Response

| Code | 설명 |
|---|---|
| `400` | 요청 파라미터 누락 또는 검증 실패 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `500` | 서버 내부 오류 |

---

## `POST /payments/confirm`

Toss 위젯 결제 성공 후 받은 결제 정보를 최종 승인한다.  
`successUrl` 리다이렉트 시 URL 파라미터(`paymentKey`, `orderId`, `amount`)를 그대로 전달.

### Request Body

| Name | Type | Required | Description |
|---|---|:---:|---|
| `paymentKey` | String | ✅ | Toss 위젯이 반환한 결제 키 |
| `orderId` | Long | ✅ | 주문 ID |
| `amount` | Long | ✅ | 결제 금액 |

```json
{
  "paymentKey": "tgen_20260417123456abc123",
  "orderId": 200001,
  "amount": 12900
}
```

### Success Response — `200 OK`

```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 200001,
  "userId": 7,
  "provider": "TOSS",
  "method": "CARD",
  "easyPayProvider": null,
  "amount": 12900,
  "currency": "KRW",
  "paymentKey": "tgen_20260417123456abc123",
  "status": "PAID",
  "failureCode": null,
  "failureMessage": null,
  "approvedAt": "2026-04-17T15:30:00",
  "canceledAt": null
}
```

### Error Response

| Code | 설명 |
|---|---|
| `400` | 요청 파라미터 누락 또는 검증 실패 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `409` | Toss 승인 실패 또는 결제 상태 충돌 |
| `500` | 서버 내부 오류 |

---

## `POST /payments/{paymentId}/cancel`

승인된 결제를 취소한다.

### Path Parameters

| Name | Type | Required | Description |
|---|---|:---:|---|
| `paymentId` | String | ✅ | 내부 결제 ID (`paymentId`) |

### Request Body

| Name | Type | Required | Description |
|---|---|:---:|---|
| `reason` | String | ✅ | 취소 사유 (자유 텍스트) |
| `reasonType` | String | ✅ | 취소 사유 타입 (`"USER"` 등 enum) |
| `cancelAmount` | Long | ✅ | 취소 금액 |

```json
{
  "reason": "고객 단순 변심",
  "reasonType": "USER",
  "cancelAmount": 12900
}
```

### Success Response — `200 OK`

```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 200001,
  "userId": 7,
  "provider": "TOSS",
  "method": "CARD",
  "easyPayProvider": null,
  "amount": 12900,
  "currency": "KRW",
  "paymentKey": "tgen_20260417123456abc123",
  "status": "CANCELLED",
  "failureCode": null,
  "failureMessage": null,
  "approvedAt": "2026-04-17T15:30:00",
  "canceledAt": "2026-04-17T16:00:00"
}
```

### Error Response

| Code | 설명 |
|---|---|
| `400` | 요청 파라미터 누락 또는 검증 실패 |
| `401` | 인증 실패 |
| `403` | 권한 없음 |
| `404` | 결제 정보 없음 |
| `409` | 취소 상태 충돌 |
| `500` | 서버 내부 오류 |

---

## `GET /payments/orders/{orderId}`

주문 ID 기준으로 현재 결제 상태를 조회한다.

### Path Parameters

| Name | Type | Required | Description |
|---|---|:---:|---|
| `orderId` | Long | ✅ | 주문 ID |

### Success Response — `200 OK`

```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 200001,
  "userId": 7,
  "provider": "TOSS",
  "method": "CARD",
  "easyPayProvider": null,
  "amount": 12900,
  "currency": "KRW",
  "paymentKey": "tgen_20260417123456abc123",
  "status": "PAID",
  "failureCode": null,
  "failureMessage": null,
  "approvedAt": "2026-04-17T15:30:00",
  "canceledAt": null
}
```

### Error Response

| Code | 설명 |
|---|---|
| `401` | 인증 실패 |
| `404` | 결제 정보 없음 |
| `500` | 서버 내부 오류 |

---

## `GET /payments/orders/{orderId}/events` — SSE

주문 ID 기준으로 결제 상태 이벤트를 SSE(Server-Sent Events)로 구독한다.  
프론트는 이 스트림을 열어두고 결제 완료/실패 메시지를 실시간으로 수신한다.

### Path Parameters

| Name | Type | Required | Description |
|---|---|:---:|---|
| `orderId` | Long | ✅ | 주문 ID |

### Response Headers

```
Content-Type: text/event-stream;charset=UTF-8
```

### Event: `payment-status`

```text
event: payment-status
id: 200001
data: {"orderId":200001,"paymentId":"pay_7b3e04d227af44d2b2a2b9f7b7f1c555","status":"PAID","message":"결제가 완료되었습니다.","failureCode":null,"failureMessage":null,"approvedAt":"2026-04-17T15:30:00","failedAt":null}
```

### Heartbeat

```text
:keepalive
```

> - heartbeat 간격: `100ms`
> - 재연결 시 마지막 상태 이벤트 1건을 replay 한다.
> - 승인 실패: `status: "FAILED"`, `message: "결제에 실패했습니다."`

### Error Response

| Code | 설명 |
|---|---|
| `401` | 인증 실패 |
| `500` | 서버 내부 오류 |

---

## Toss 위젯 초기화 주의사항

```js
// CheckoutPage.jsx — SDK 초기화
const w = tp.widgets({ customerKey: String(user.userId) })
```

- `customerKey`는 **string 타입** 필수 (Toss SDK 요구사항). `user.userId`가 숫자로 오는 경우를 대비해 반드시 `String()`으로 변환.
- 허용 문자: 알파벳·숫자·`@`, `.`, `_`, `-`, `+`, `=` (2~300자)
- 이메일·전화번호 등 추측 가능한 값은 customerKey로 사용 금지 (Toss 정책)

### `requestPayment` 현재 파라미터 상태 (2026-04-25)

```js
await widgets.requestPayment({
  orderId: `order-${orderId}`,   // ⚠️ prefix 포함 — PaymentSuccessPage 호환 문제 발생 ([CHECKOUT-04])
  orderName,
  customerName: user.name ?? '',
  customerEmail: user.email ?? '',
  successUrl: ...,
  failUrl: ...,
  // customerMobilePhone: ...  ← 주석 처리됨
})
```

---

## 환경변수

| 변수 | 설명 | fallback |
|---|---|---|
| `VITE_TOSS_CLIENT_KEY` | Toss 결제 SDK 초기화 키 (`CheckoutPage.jsx`) | 없음 — 반드시 `.env`에 존재해야 함 |
| `VITE_BASE_URL` | 결제 성공/실패 콜백 URL 도메인 (`successUrl`, `failUrl`) | `window.location.origin` |

> - `.env` 파일 마지막 줄에 개행문자가 없으면 dotenv 파서가 해당 줄을 읽지 못한다. `cat -A .env` 실행 시 모든 줄 끝에 `$`가 있어야 정상.
> - `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm`은 Toss 공식 문서 샘플 키. 실제 테스트 시 Toss 개발자 콘솔에서 발급한 프로젝트 전용 키(`test_ck_...`)로 교체 필요.

---

## 프론트 연동 흐름

```
1. createOrder              → POST /orders/subject               → orderId (Long) 획득
2. preparePayment           → POST /payments/prepare            → 결제 레코드 생성 (status: READY)
3. requestPayment           → Toss 위젯 호출 (orderId: `order-${orderId}`)  → 사용자 결제 진행
4. successUrl 리다이렉트    → /payment/success?paymentKey=...&orderId=order-{id}&amount=...
5. SSE 구독 시작            → GET /payments/orders/{orderId}/events  → payment-status 이벤트 대기
6. confirmPayment           → POST /payments/confirm            → 결제 처리 트리거
7. SSE: payment-status      → status: PAID / FAILED             → UI 상태 전환 (primary)
   (SSE 미수신 fallback)    → confirm 응답 status: PAID         → UI 상태 전환 (fallback)
8. navigate                 → /order/detail/:orderId
```

> ⚠️ **알려진 문제 ([CHECKOUT-04])**: step 3에서 Toss `requestPayment`에 `` `order-${orderId}` `` 형식으로 전달하므로,  
> step 4 이후 URL 파라미터 `orderId`가 `"order-123"` 문자열이 된다.  
> `PaymentSuccessPage`는 이를 `Number("order-123") = NaN`으로 변환하여 `confirmPayment`·SSE 모두 실패한다.

> ⚠️ **알려진 문제 ([PAYMENT-01])**: `orderId`가 Snowflake ID(64비트, 약 10¹⁸ 규모) 형태일 경우,  
> `Number(orderId)` 변환 시 JS `Number.MAX_SAFE_INTEGER`(약 9×10¹⁵)를 초과하여 정밀도가 손실된다.  
> 손실된 값이 `confirmPayment` body·SSE URL에 사용되면 서버가 주문을 찾지 못해 결제 승인 후에도 스피너가 무한 대기 상태가 된다.  
> **수정 방향**: `Number(orderId)` 대신 string 그대로 전달 (SSE URL은 템플릿 리터럴이므로 string 전달 시 정상 동작).

> - `prepare`와 `confirm`은 모두 프론트가 직접 호출한다.
> - 외부 공개 경로는 모두 `gatewayserver` 기준 `/api/v1/payments/**`이다. 내부 `paymentserver` 경로 `/payments/**`를 직접 호출하지 않는다.
> - 프론트가 `userId`를 body에 보내지 않는다. `X-User-Id` 헤더는 gatewayserver가 인증 성공 후 내부적으로 주입한다.
> - 승인 완료 후 최종 결제 내역 화면은 `orderserver` 기준으로 조회한다.
> - 실시간 완료 알림이 필요하면 `GET /payments/orders/{orderId}/events` SSE를 구독한다.

---

## `PaymentSuccessPage.jsx` 동작 명세

파일 경로: `src/pages/PaymentSuccessPage.jsx`  
라우트: `/payment/success` (ProtectedRoute)

### 역할

Toss 결제 완료 후 `successUrl`로 리다이렉트된 페이지.  
SSE(`useSubscribePaymentEventsQuery`)로 결제 상태 이벤트를 구독하고, `POST /payments/confirm`으로 결제 처리를 트리거한다.  
`payment-status` SSE 이벤트가 최종 UI 전환의 primary 소스이며, SSE 미수신 시 confirm 응답이 fallback으로 작동한다.

---

### URL 파라미터 추출

Toss가 `successUrl`로 리다이렉트할 때 아래 세 파라미터를 쿼리스트링으로 전달한다.

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `paymentKey` | String | Toss가 발급한 결제 키 — confirm body에 그대로 전달 |
| `orderId` | String (→ Number) | 주문 ID — 현재 `"order-{id}"` 형식으로 수신됨 (⚠️ [CHECKOUT-04] 참고) |
| `amount` | String (→ Number) | 결제 금액 — `Number(amount)`로 변환 후 전달 |

```js
const paymentKey = searchParams.get('paymentKey')
const orderId    = searchParams.get('orderId')
const amount     = searchParams.get('amount')
```

---

### 유효성 검사

세 값 중 하나라도 falsy이면 confirm을 호출하지 않고 즉시 에러 상태로 전환한다.

```js
if (!paymentKey || !orderId || !amount) {
  setErrorMsg('결제 정보가 올바르지 않습니다.')
  setStatus('error')
  return
}
```

---

### 이중 호출 방어 (`calledRef`)

`useRef(false)`로 만든 `calledRef`를 사용해 `useEffect` 내 confirm 호출이 단 한 번만 실행되도록 보장한다.  
React 18 StrictMode의 `useEffect` 이중 실행, 또는 컴포넌트 재렌더링으로 인한 중복 confirm 호출을 방지한다.

```js
const calledRef = useRef(false)

useEffect(() => {
  if (calledRef.current) return
  calledRef.current = true
  // confirm 호출 ...
}, [])
```

---

### SSE 연결 시점

`PaymentSuccessPage` 마운트 시 `orderId`가 URL 파라미터에 존재하면 즉시 연결된다.

```
Toss successUrl 리다이렉트
  → /payment/success?paymentKey=...&orderId=123&amount=...
  → PaymentSuccessPage 마운트
      ├── useSubscribePaymentEventsQuery 실행
      │     → RTK Query onCacheEntryAdded 호출
      │     → new EventSource(...)  ← 이 시점에 GET /payments/orders/123/events 요청 발생
      │
      └── useEffect (calledRef) 실행
            → confirmPayment({ paymentKey, orderId, amount }) 호출
```

SSE 연결과 confirm 호출은 페이지 마운트 시 거의 동시에 시작된다.  
SSE가 먼저 연결을 열어두고, confirm이 서버 측 결제 처리를 트리거하는 구조다.

### SSE 구독

```js
const { data: sseData } = useSubscribePaymentEventsQuery(Number(orderId), { skip: !orderId })
```

> ⚠️ `Number(orderId)` 는 Snowflake ID 수준의 값에서 정밀도를 잃는다 ([PAYMENT-01]). string 그대로 전달하는 것이 안전하다.

- `orderId`가 유효한 경우에만 SSE 연결 (`skip: !orderId`)
- RTK Query `onCacheEntryAdded` 내부에서 `new EventSource()` 생성 → 실제 HTTP 연결 수립
- `payment-status` 이벤트 수신 시 `sseData` 업데이트
- `status: 'PAID'` 또는 `status: 'FAILED'` 수신 후 `EventSource` 자동 종료
- 컴포넌트 언마운트(캐시 엔트리 제거) 시 `EventSource.close()` 호출
- `withCredentials: true` — HttpOnly 쿠키 인증 자동 포함

### 상태 흐름

| `status` | 전환 조건 | UI |
|---|---|---|
| `'loading'` | 초기값 | `<Spinner />` + "결제를 승인하고 있습니다..." |
| `'success'` | SSE `status: 'PAID'` (primary) 또는 confirm 응답 `status: 'PAID'` (fallback) | 체크 아이콘 + "결제가 완료되었습니다" + 2초 후 `/order/detail/:orderId` 이동 |
| `'error'` | SSE `status: 'FAILED'` 또는 파라미터 누락 또는 confirm 실패 | X 아이콘 + 오류 메시지 + [장바구니로 이동 / 주문 내역 보기] 버튼 |

> 상태 전환 시 이미 `'loading'`이 아니면 무시 — SSE와 confirm이 동시에 결과를 내려도 중복 전환 없음.

---

### 성공 후 네비게이션

`status === 'success'`를 감지하는 별도 `useEffect`에서 처리 — SSE와 confirm 어느 경로로 성공해도 단일 진입점.

```js
useEffect(() => {
  if (status !== 'success') return
  const timer = setTimeout(() => navigate(`/order/detail/${orderId}`, { replace: true }), 2000)
  return () => clearTimeout(timer)
}, [status])
```

- 2초 대기 후 `/order/detail/:orderId`로 이동 (`replace: true` — 히스토리 스택에 성공 페이지 미포함)

---

### 에러 처리 우선순위

| 소스 | 에러 메시지 |
|---|---|
| SSE `FAILED` | `sseData.failureMessage ?? sseData.message ?? '결제에 실패했습니다.'` |
| confirm 네트워크/서버 오류 | `err.data.message ?? err.message ?? '결제 승인 중 오류가 발생했습니다.'` |

- `errorMsg`가 이미 설정된 경우 confirm 오류 메시지로 덮어쓰지 않음 (SSE 메시지 우선 유지)
