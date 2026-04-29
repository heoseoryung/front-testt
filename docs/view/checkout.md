# CheckoutPage 뷰 명세

> 파일: `src/pages/CheckoutPage.jsx`  
> 라우트: `/checkout` (ProtectedRoute)

---

## 진입 조건

- 장바구니에서 체크된 상품(`checkedItemIds`)이 1개 이상이어야 정상 진입.
- 체크된 상품이 없으면 "주문할 상품이 없습니다" 화면 + 장바구니 이동 버튼 표시.
- 장바구니 데이터는 `useGetCartQuery(0)` — 명시적으로 `page=0` 전달 (`/cart/get?page=0`).

---

## 레이아웃

```
Header (sticky)
└── max-w-[1200px] grid lg:grid-cols-3
    ├── 왼쪽 (lg:col-span-2)
    │   ├── 배송지 섹션 (접기/펼치기)
    │   ├── 주문상품 섹션
    │   └── 결제수단 섹션 (Toss 위젯)
    └── 오른쪽 (sticky top-24)
        ├── 주문 예상 금액 요약
        └── 결제하기 버튼
```

---

## 배송지 섹션

### 필드 목록

| 필드 | 필수 | 설명 |
|------|:----:|------|
| 받는사람 | ✅ | 로그인 사용자 `name` 자동 채움 |
| 주소 (우편번호 + 기본주소 + 나머지주소) | ✅ | 카카오 주소 검색 팝업 (`AddressSearch`) |
| 휴대폰 | ✅ | 로그인 사용자 `phoneNumber` 자동 채움 |
| 배송 메시지 | ❌ | 드롭다운 선택 (아래 참고) |

### 배송 메시지 드롭다운

선택 가능한 프리셋:

| 값 | 표시 텍스트 |
|----|------------|
| `문 앞에 놓아주세요` | 문 앞에 놓아주세요 |
| `경비실에 맡겨주세요` | 경비실에 맡겨주세요 |
| `배송 전 연락 바랍니다` | 배송 전 연락 바랍니다 |
| `부재 시 문 앞에 놓아주세요` | 부재 시 문 앞에 놓아주세요 |
| `직접 받겠습니다` | 직접 받겠습니다 |
| `직접 입력` | → 텍스트 input 노출 (최대 100자) |

- 미선택 시 기본값은 빈 문자열 (메시지 없이 주문).
- `직접 입력` 선택 시 텍스트 input이 드롭다운 아래에 노출된다.
- 배송 메시지는 주문 생성 시 `receiver_addr` 뒤에 공백으로 연결해 전송 (백엔드 별도 필드 없음).

#### receiver_addr 조합 규칙

```
[우편번호] [기본주소] [추가주소] [나머지주소] [배송메시지]
```

빈 값은 자동 제거 (`filter(Boolean)`). 배송 메시지가 없으면 주소만 전송.

---

## 주문상품 섹션

- `CheckoutItemRow` — 상품 이미지 · 이름 · 옵션 · 수량 · 소계 표시.
- 상품 정보는 `useGetProductByIdQuery(productId)`로 개별 조회.
- 소계(`rowTotal`)가 확정되면 `onReady` 콜백으로 부모(`priceMap`)에 보고.

---

## 금액 계산

| 항목 | 계산 |
|------|------|
| 총 상품금액 | `Σ (기본가 + 옵션추가금) × 수량` |
| 최종 결제 금액 | 총 상품금액 (배송비 0원 고정 — 추후 정책 변경 시 이 문서 업데이트) |

---

## 결제 플로우

```
결제하기 클릭
 ├─ 유효성 검사 (받는사람 · 주소 · 휴대폰)
 ├─ POST /orders/subject  →  orderId 발급 (text/plain, user_id 미포함)
 ├─ POST /payments/prepare  →  백엔드 결제 레코드 생성
 ├─ widgets.setAmount()  →  Toss 위젯 금액 동기화
 └─ widgets.requestPayment()
      ├─ 성공  →  /payment/success (Toss 리다이렉트)
      └─ 실패  →  /payment/fail   (Toss 리다이렉트)
```

- `USER_CANCEL` 에러는 토스트 없이 조용히 처리.
- 결제 중 버튼 비활성화(`paying` 상태).

---

## Toss 결제위젯 초기화 순서

1. `loadTossPayments(VITE_TOSS_CLIENT_KEY)` → SDK 로드
2. `tp.widgets({ customerKey: String(user.userId) })` → 위젯 인스턴스 생성 (`customerKey`는 반드시 문자열)
3. `widgets.setAmount({ currency: 'KRW', value: finalAmount })` 후 `renderPaymentMethods` + `renderAgreement` → 렌더 (1회)
4. `finalAmount` 변경 시 `widgets.setAmount()` 재호출로 동기화

> **useEffect 의존성 주의**: 위젯 렌더 useEffect 의존성 배열은 `[widgets, finalAmount, widgetsRendered]`.  
> `finalAmount > 0` (boolean)이 아닌 `finalAmount` (number) 그대로 사용해야 금액 변경을 정확히 감지한다.

---

## 환경변수

| 변수 | 용도 |
|------|------|
| `VITE_TOSS_CLIENT_KEY` | Toss Payments 클라이언트 키 |
| `VITE_BASE_URL` | successUrl · failUrl 도메인 (없으면 `window.location.origin`) |
