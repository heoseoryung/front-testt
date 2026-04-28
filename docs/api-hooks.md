# RTK Query API Hooks 명세

기준일: 2026-04-28

프로젝트의 모든 RTK Query 훅 상세 명세. 단일 `createApi`(`src/api/apiSlice.js`)에 `injectEndpoints`로 도메인별 주입.

> 비즈니스 정책·상태 구조·캐시 전략 상세는 `docs/domain/*.md` 참조.

---

## 공통 사항

> **Base URL:** `https://localhost:8072/api/v1/`


### Request Headers (전체 공통)

| 헤더 | 값 | 설명 |
|---|---|---|
| `Cookie` | `access_token=...; refresh_token=...` | HttpOnly 쿠키 — 브라우저 자동 전송 |
| `X-XSRF-TOKEN` | `{XSRF-TOKEN 쿠키 값}` | CSRF 방어 — **Mutation 전용** (POST·PUT·DELETE) |
| `Content-Type` | `application/json` | Body가 있는 요청에만 적용 |

### Response Headers (전체 공통)

| 헤더 | 값 | 설명 |
|---|---|---|
| `Content-Type` | `application/json` | 일반 응답 |
| `Set-Cookie` | `access_token=...; HttpOnly` | 로그인·토큰 갱신 시만 서버가 세팅 |




---

## Auth (`src/api/authApi.js`)

---

### `useGetCsrfQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/api/v1/csrf` |

**Request**
- Parameters: 없음
- Body: 없음

**Response**
- Status: `200`
- Body: 없음 (Set-Cookie로 XSRF-TOKEN 발급)
- Headers: `Set-Cookie: XSRF-TOKEN={value}; Path=/`

---

### `useGetMeQuery` / `useLazyGetMeQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/users/me` |

**Request**
- Parameters: 없음
- Body: 없음

**Response Body (서버 원본)**
```json
{
  "userId": "username123",
  "name": "홍길동",
  "email": "user@example.com",
  "profileImgUrl": "https://lh3.googleusercontent.com/a/...",
  "phoneNumber": "010-1234-5678",
  "smsAllowed": true,
  "emailAllowed": false,
  "updatedAt": "2026-04-16T00:00:00"
}
```

**컴포넌트 수신값** (`transformResponse: res.data` 후)
```json
{
  "userId": "username123",
  "name": "홍길동",
  "email": "user@example.com",
  "profileImgUrl": "https://lh3.googleusercontent.com/a/...",
  "phoneNumber": "010-1234-5678",
  "smsAllowed": true,
  "emailAllowed": false,
  "updatedAt": "2026-04-16T00:00:00"
}
```

> `transformResponse`: `res.data` 추출 → 컴포넌트는 `data` 필드 직접 수신.  
> Cache Tag: `['Auth']`

---

### `useGetTermsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/auth/terms` |

**Request**
- Parameters: 없음
- Body: 없음
- 인증: 불필요

**Response Body**
```json
{
  "terms": [
    { "id": "service_terms",   "title": "서비스 이용약관",        "content": "...", "required": true,  "version": "1.0", "lastUpdated": "2024-01-01" },
    { "id": "privacy_policy",  "title": "개인정보보호정책",        "content": "...", "required": true,  "version": "1.0", "lastUpdated": "2024-01-01" },
    { "id": "marketing_sms",   "title": "SMS 마케팅 정보 수신",    "content": "...", "required": false, "version": "1.0", "lastUpdated": "2024-01-01" },
    { "id": "marketing_email", "title": "이메일 마케팅 정보 수신", "content": "...", "required": false, "version": "1.0", "lastUpdated": "2024-01-01" }
  ]
}
```

> `transformResponse`: 각 약관에 `required: t.required ?? t.isRequired ?? false` normalize 적용.

---

### `useLoginMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/login` |

**Request Body**
```json
{
  "username": "testuser",
  "password": "TestPass1234!"
}
```

**Response Body**
```json
{ "accessToken": "eyJ..." }
```
Headers: `Set-Cookie: access_token=...; HttpOnly`, `Set-Cookie: refresh_token=...; HttpOnly`

> 응답 바디의 `accessToken`은 저장하지 않는다 (No Token Storage 원칙). 토큰은 HttpOnly 쿠키로만 사용.  
> 성공 후 `getMe` forceRefetch 자동 실행.

---

### `useSignupMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/signup` |

**Request Body**
```json
{
  "username": "testuser",
  "name": "홍길동",
  "email": "test@example.com",
  "password": "TestPass1234!",
  "phoneNumber": "010-1234-5678",
  "termsAgreed": {
    "service_terms": true,
    "privacy_policy": true,
    "marketing_sms": false,
    "marketing_email": false
  }
}
```

> 비밀번호 규칙: 8~20자, 대·소문자 + 숫자 + 특수문자(`@$!%*?&`) 각 1개 이상.

**Response Body**
```json
{ "accessToken": "eyJ..." }
```
Headers: `Set-Cookie: access_token=...; HttpOnly`, `Set-Cookie: refresh_token=...; HttpOnly`

> 응답 바디의 `accessToken`은 저장하지 않는다 (No Token Storage 원칙).

---

### `useRefreshMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/refresh` |

**Request Body**: 없음 (쿠키의 refresh_token 사용)

**Response**
- Status: `200`
- 새 access_token HttpOnly 쿠키 갱신

---

### `useLogoutMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/logout` |

**Request**
- Body: 없음

**Response**
- Status: `200`
- 서버가 HttpOnly 쿠키 만료 처리

> 성공·실패 무관하게 `dispatch(logout())` 실행.

---

### `useSendEmailVerifyMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/email/send` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | Y | 인증 코드를 발송할 이메일 주소 |

**Request Body**: 없음

**Response Body**
```json
{ "message": "인증 코드 발송 완료" }
```

---

### `useVerifyEmailMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/auth/email/verify` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | Y | 이메일 주소 |
| `code` | string | Y | 발송된 인증 코드 |

**Request Body**: 없음

**Response Body**
```json
{ "message": "인증 완료" }
```

---

## Category (`src/api/categoryApi.js`)

> Search Server (`/search/categories`) 경유. GNB·상품 필터에 사용.

---

### `useGetCategoriesQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/categories` |

**Request**
- Parameters: 없음
- Body: 없음

**Response Body (서버 원본)**
```json
{
  
  
    {
      "id": "SNACK_JERKY",
      "label": "Snack & Jerky",
      "subCategories": [
        { "id": 11, "code": "JERKY", "label": "육포" }
      ]
    }
  
}
```

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": "SNACK_JERKY",
    "name": "Snack & Jerky",
    "subCategories": [ { "id": 11, "code": "JERKY", "name": "육포" } ],
    "children": [ { "id": 11, "code": "JERKY", "name": "육포" } ]
  }
]
```

> `id`는 **문자열 코드** (예: `"SNACK_JERKY"`) — Search Server의 `category` 파라미터로 그대로 전달.  
> subCategories/children 항목의 `name`은 서버 원본 `label` 필드를 매핑한 값.  
> `children`은 `subCategories`의 별칭(alias).  
> Cache Tag: `[{ type: 'Category', id: 'LIST' }]`

---

## Product (`src/api/productApi.js`)

Product Server(`/api/v1/product`)의 상품 상세·요약 조회. 목록·검색·베스트셀러는 `searchApi.js` 참조.

---

### `useGetProductByIdQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/product/:id` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | Long | Y | 상품 ID |

**Response Body (서버 원본)**
```json
{
  "productId": 1,
  "productName": "어글어글 스테이크",
  "categoryId": 1,
  "categoryName": "Meal",
  "brandName": "스위피테린",
  "brandId": 10,
  "content": "",
  "detailImagelUrl": ["https://bucket.s3.ap-northeast-2.amazonaws.com/..."],
  "price": 15000,
  "status": "판매중",
  "tags": "[판매1위]",
  "salesCount": 5200,
  "stockQuantity": 50,
  "stockStatus": "IN_STOCK",
  "imageUrls": ["https://bucket.s3.ap-northeast-2.amazonaws.com/..."],
  "options": [
    { "optionId": 1, "optionName": "1인분", "extraPrice": 0, "stockQuantity": 30, "stockStatus": "IN_STOCK" }
  ]
}
```

**컴포넌트 수신값** (`transformResponse` 후)
```js
{
  id, name, brand, brandId, categoryId, category,
  desc,          // content
  price, status, tags, salesCount,
  img,           // imageUrls[0]
  images,        // imageUrls
  stockStatus, stockQuantity,
  detailImgs,    // detailImagelUrl (flat 처리)
  options: [{ id, label, extra, stockQuantity, stockStatus }],
  relatedProducts,
}
```

> Cache Tag: `[{ type: 'Product', id }]`

---

### `useGetProductOptionsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/product/:id/options` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | Long | Y | 상품 ID |

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  { "id": 1, "label": "1인분", "extra": 0, "stockQuantity": 30, "stockStatus": "AVAILABLE" }
]
```

> Cache Tag: `[{ type: 'Product', id: 'options-{id}' }]`

---

### `useGetProductCategoriesQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/product/categories` |

**Request**: 파라미터 없음

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": 1,
    "name": "Meal",
    "displayOrder": 1,
    "children": [
      { "id": 11, "name": "스팀", "displayOrder": 1, "children": [] }
    ]
  }
]
```

> Product Server 기준 카테고리 트리. GNB·필터용 카테고리는 `useGetCategoriesQuery`(Search Server) 사용.  
> Cache Tag: `[{ type: 'Category', id: 'PRODUCT_TREE' }]`

---

### `useGetProductSummaryQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/product/frontend/:id` |

장바구니·주문 등 경량 상품 정보가 필요한 컨텍스트 전용.

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | Long | Y | 상품 ID |

**Response Body (서버 원본)**
```json
{
  "imageUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/product/images/uuid.png",
  "productId": 1,
  "productName": "어글어글 동물복지 연어마들렌",
  "options": [
    { "optionId": 1, "optionName": "단품" },
    { "optionId": 2, "optionName": "3개 세트" }
  ]
}
```

**컴포넌트 수신값** (`transformResponse` 후)
```js
{
  id,       // productId
  name,     // productName
  img,      // imageUrl
  price,    // price (없으면 0)
  options: [{ id, label }]   // optionId, optionName
}
```

> Cache Tag: `[{ type: 'Product', id: 'summary-{id}' }]`

---

## Cart (`src/api/cartApi.js`)

> 아이템 식별: `productId + optionId` 조합 (cartItemId 없음)  
> 모든 Mutation: `invalidatesTags: [{ type: 'Cart', id: 'LIST' }]`  
> 금액은 클라이언트 계산 — `useGetProductByIdQuery`의 `price + option.extra × quantity` 합산

---

### `useGetCartQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/cart/get?page={page}` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `page` | number | N | 페이지 번호 (0-based, 기본값 0) |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "userId": 5,
  "selectedItemCount": 1,
  "allSelected": false,
  "hasSelectedItems": true,
  "page": 0,
  "size": 10,
  "hasNext": false,
  "items": [
    { "productId": 55, "optionId": 3, "quantity": 2, "isSelected": true, "isSoldOut": false }
  ]
}
```

> 더보기 방식: `hasNext=true`이면 더보기 버튼 노출, 클릭 시 `page+1` 요청 후 기존 목록 뒤에 누적.  
> `isSoldOut: true` 항목은 UI에서 체크·수량 변경 비활성.  
> 표시용 데이터(이름·이미지·가격·옵션명)는 `useGetProductByIdQuery(productId)` 별도 조회.  
> Cache Tag: `[{ type: 'Cart', id: '{productId}-{optionId}' }, ..., { type: 'Cart', id: 'LIST' }]`  
> **호출 시 반드시 숫자 `0`을 명시** — `useGetCartQuery(0)`. 인자를 생략하면 `undefined`가 전달되어 CartPage의 캐시 엔트리(`0`)와 분리된 별도 요청이 발생한다.

---

### `useAddCartItemMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/cart/additem` |

**Request Body**
```json
{ "productId": 55, "optionId": 3, "quantity": 2 }
```

> 동일 `productId + optionId`가 이미 있으면 수량 합산.  
> `invalidatesTags: [{ type: 'Cart', id: 'LIST' }]`

---

### `useUpdateCartItemQuantityMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/cart/quantity` |

**Request Body**
```json
{ "productId": 55, "optionId": 3, "quantity": 3 }
```

> `quantity = 0` 이면 서버에서 해당 아이템 삭제.

---

### `useUpdateCartItemOptionMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/cart/option` |

**Request Body**
```json
{ "productId": 55, "optionId": 3, "newOptionId": 4 }
```

> 변경 대상 옵션이 이미 존재하면 수량 합산 후 기존 항목 삭제.

---

### `useRemoveCartItemMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/cart/selected` |

**Request Body**
```json
{ "productId": 55, "optionId": 3 }
```

> 카드 1개 「삭제」 버튼에 사용하는 단건 삭제.

---

### `useRemoveSelectedCartItemsMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/cart/selecteditems` |

**Request Body**
```json
{
  "items": [
    { "productId": 55, "optionId": 3 },
    { "productId": 56, "optionId": 0 }
  ]
}
```

> 체크박스로 선택한 여러 상품 일괄 삭제 (「선택삭제」 버튼).  
> 전체 삭제 시 현재 장바구니 전체 items를 담아 호출.  
> `invalidatesTags: [{ type: 'Cart', id: 'LIST' }]`

---

### `useSelectCartItemMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/cart/select` |

**Request Body**
```json
{ "productId": 55, "optionId": 3, "isSelected": true }
```

> UI 선택 상태는 Redux `cartSlice`가 관리, 서버 저장용으로만 호출.  
> `invalidatesTags: [{ type: 'Cart', id: 'LIST' }]`

---

### `useSelectAllCartItemsMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/cart/select-all` |

**Request Body**
```json
{ "isSelectedAll": true }
```

> 전체 선택/해제를 단일 요청으로 처리. UI 상태는 Redux `checkAllItems` / `uncheckAllItems` 로 동기 관리.  
> `invalidatesTags: [{ type: 'Cart', id: 'LIST' }]`

---

---

## Order (`src/api/orderApi.js`)

---

### `useGetOrdersQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/orders` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `page` | number | N | 페이지 번호 |
| `size` | number | N | 페이지 크기 |
| `status` | string | N | 주문 상태 필터 (`PENDING` \| `PREPARING` \| ...) |
| `period` | string | N | 기간 필터 |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `start_date` | string | N | 조회 시작일 `yyyy-MM-dd` |
| `end_date` | string | N | 조회 종료일 `yyyy-MM-dd` |
| `status` | string | N | OrderState (예: `ORDER_COMPLETED`, `PAYMENT_FAILED`) |
| `page` | number | N | 페이지 번호 (0-based) |

**컴포넌트 수신값** (`normalizeOrder` 후)
```json
{
  "content": [
    {
      "id": 1,
      "date": "2026-04-20 14:30:00",
      "status": "ORDER_COMPLETED",
      "ordererName": "홍길동",
      "paymentMethod": "",
      "couponDiscount": 0,
      "failedReason": null,
      "failedAt": null,
      "items": [],
      "productPrice": 35000,
      "shippingPrice": 0,
      "discountPrice": 0,
      "total": 35000,
      "address": {
        "recipient": "홍길동",
        "zipCode": "",
        "address": "서울특별시 강남구 테헤란로 123",
        "phone": "010-1234-5678",
        "memo": ""
      }
    }
  ],
  "totalPages": 1,
  "totalElements": 1
}
```

> 목록 응답에는 items가 포함되지 않음 — 상세 조회(`getOrderById`)에서 items 포함.  
> Cache Tag: `[{ type: 'Order', id }, ..., { type: 'Order', id: 'LIST' }]`

---

### `useGetOrderByIdQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/orders/:orderId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `orderId` | number | Y | 주문 ID |

**컴포넌트 수신값** (`normalizeOrder` 후, items 포함)
```json
{
  "id": 1,
  "date": "2026-04-20 14:30:00",
  "status": "ORDER_COMPLETED",
  "ordererName": "홍길동",
  "failedReason": null,
  "failedAt": null,
  "items": [
    {
      "productId": 10,
      "name": "어글어글 동물복지 연어마들렌",
      "option": "단품",
      "qty": 2,
      "price": 17500,
      "img": null,
      "trackingNo": "",
      "company": "",
      "itemStatus": "ORDER_COMPLETED"
    }
  ],
  "productPrice": 35000,
  "shippingPrice": 0,
  "discountPrice": 0,
  "total": 35000,
  "address": {
    "recipient": "홍길동",
    "zipCode": "",
    "address": "서울특별시 강남구 테헤란로 123",
    "phone": "010-1234-5678",
    "memo": ""
  }
}
```

> Cache Tag: `[{ type: 'Order', id: orderId }]`

---

### `useCreateOrderMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/orders` |

**Request Body**
```json
{
  "user_id": "username123",
  "receiver_name": "홍길동",
  "receiver_phone": "010-1234-5678",
  "receiver_addr": "서울특별시 강남구 테헤란로 123 101동 101호",
  "items": [{ "productId": 1, "optionId": 10, "quantity": 2 }]
}
```

**Response** (text/plain, 201 Created)
```
100번 주문이 접수되었습니다. 현재 상태는 ORDER_CHECKED_OUT 입니다.
```

**transformResponse 결과** (프론트 수신값)
```json
{ "orderId": 100 }
```

> 응답이 텍스트이므로 `responseHandler: 'text'` 설정 후 정규식으로 orderId 추출.  
> 성공 후 `setLastCreatedOrder` dispatch.  
> `invalidatesTags: [{ type: 'Order', id: 'LIST' }]`

---

### `useCancelOrderMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/orders/:orderId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `orderId` | number | Y | 주문 ID |

**Request Body**: 없음

**Response** (text/plain, 202 Accepted)
```
1번 주문 취소 요청이 접수되었습니다.
```

> 현재 서버 saga 비활성화로 실제 호출 시 `409 Conflict` 반환.  
> `responseHandler: 'text'` 설정.  
> `invalidatesTags: [{ type: 'Order', id: orderId }]`

---

### `useGetOrderHistoryQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/orders/me/history` |

**Request**: 없음

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": 1,
    "orderId": 10,
    "productId": 100,
    "optionId": 1001,
    "productName": "어글어글 동물복지 연어마들렌",
    "optionName": "단품",
    "price": 17500,
    "quantity": 2,
    "totalPrice": 35000,
    "status": "ORDER_COMPLETED",
    "failedReason": null,
    "failedAt": null
  }
]
```

> 주문 단위가 아닌 주문 상세 item 단위 이력. 내역 없으면 `204 No Content`.  
> Cache Tag: `[{ type: 'Order', id: 'HISTORY' }]`

---

### `useGetOrderCsHistoryQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/orders/:orderId/cs-history` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `orderId` | number | Y | 주문 ID |

> 취소·교환·반품 내역. 현재 서버 구현상 `204 No Content` 반환.  
> Cache Tag: `[{ type: 'Order', id: 'CS_{orderId}' }]`

---

## Review (`src/api/reviewApi.js`)

---

### `useGetProductReviewsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/products/:productId/reviews` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `productId` | number | Y | 상품 ID |

**Request Query Parameters** (`params` 객체)
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `page` | number | N | 페이지 번호 |
| `size` | number | N | 페이지 크기 |
| `sortBy` | string | N | `createdAt` \| `rating` \| `helpful` |

**Response Body (서버 원본)**
```json
{
  "content": [
    {
      "reviewId": 1,
      "memberName": "홍*동",
      "createdAt": "2026-04-10T12:00:00",
      "viewCount": 5,
      "rating": 5,
      "content": "정말 좋아요",
      "imageUrls": ["https://..."],
      "helpfulCount": 12,
      "optionName": "1kg"
    }
  ],
  "totalPages": 3,
  "totalElements": 32
}
```

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "content": [
    {
      "id": 1,
      "name": "홍*동",
      "date": "2026. 04. 10",
      "views": 5,
      "rating": 5,
      "text": "정말 좋아요",
      "imgs": ["https://..."],
      "helpfulCount": 12,
      "optionText": "구매옵션: 1kg"
    }
  ],
  "totalPages": 3,
  "totalElements": 32
}
```

> 평균별점·분포·카테고리 통계는 **`useGetProductReviewStatsQuery`** 별도 호출 필요.  
> Cache Tag: `[{ type: 'Review', id: 'PRODUCT_{productId}' }]`

---

### `useGetProductReviewStatsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/products/:productId/reviews/stats` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `productId` | number | Y | 상품 ID |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "averageRating": 4.5,
  "totalCount": 32,
  "distribution": [
    { "stars": 5, "pct": 20 },
    { "stars": 4, "pct": 8 },
    { "stars": 3, "pct": 3 },
    { "stars": 2, "pct": 1 },
    { "stars": 1, "pct": 0 }
  ],
  "categoryStats": [
    { "label": "선호도", "topAnswer": "매우 좋아요", "pct": 75 }
  ]
}
```

> 서버 원본 `ratingDistribution`은 객체(`{"5": 20, ...}`) 또는 배열 양쪽 대응.  
> Cache Tag: `[{ type: 'Review', id: 'STATS_{productId}' }]`

---

### `useGetMyReviewsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/reviews/mine` |

**Request Query Parameters**: `params` 객체 (page, size 등)

**Response Body**: `useGetProductReviewsQuery`의 `content[]`와 동일 구조.

> Cache Tag: `[{ type: 'Review', id: 'MINE' }]`

---

### `useGetReviewHighlightsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/main/review-highlights` |

**Request**
- Parameters: 없음
- Body: 없음

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "title": "베스트 포토리뷰",
  "items": [
    { "id": 1, "img": "https://...", "title": "상품명", "rating": "★ 4.8(32)", "href": "/review" }
  ]
}
```

> `title`은 `res.title ?? res.sectionTitle ?? ''` 순으로 추출.  
> Cache Tag: `[{ type: 'Review', id: 'HIGHLIGHTS' }]`

---

### `useCreateReviewMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/products/:productId/reviews` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `productId` | number | Y | 상품 ID |

**Request Body** (FormData)
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `orderId` | number | Y | 주문 ID |
| `rating` | number | Y | 1~5 정수 |
| `content` | string | Y | 최소 10자 ~ 최대 1,000자 |
| `images` | file[] | N | 최대 10장 (jpg·jpeg·png·webp, 장당 최대 10MB) |
| `video` | file | N | 최대 1개 (mp4·mov·avi·webm, 최대 500MB) |
| `tags[preference]` | number | N | `1`\|`2`\|`3` |
| `tags[repurchase]` | number | N | `1`\|`2`\|`3` |
| `tags[freshness]` | number | N | `1`\|`2`\|`3` |

**Response Body**
```json
{ "message": "리뷰가 등록되었습니다." }
```

> `invalidatesTags: ['PRODUCT_{productId}', 'MINE']`

---

### `useUpdateReviewMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/reviews/:reviewId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `reviewId` | number | Y | 리뷰 ID |

**Request Body**: `useCreateReviewMutation`과 동일 구조 (FormData)

> `invalidatesTags: [reviewId, 'MINE']`

---

### `useDeleteReviewMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/reviews/:reviewId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `reviewId` | number | Y | 리뷰 ID |

**Request Body**: 없음

**Response**: `204 No Content`

> `invalidatesTags: [reviewId, 'MINE']`

---

### `useMarkReviewHelpfulMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/reviews/:reviewId/helpful` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `reviewId` | number | Y | 리뷰 ID |

**Request Body**: 없음

**Response Body**
```json
{ "message": "도움돼요 처리되었습니다." }
```

> `invalidatesTags: [{ type: 'Review', id: reviewId }]`

---

## User (`src/api/userApi.js`)

---

### `useGetProfileQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/users/profile` |

**컴포넌트 수신값** (`transformResponse: res.data` 후)
```json
{
  "userSummary": {
    "id": 1,
    "name": "홍길동",
    "profileImgUrl": "https://lh3.googleusercontent.com/a/...",
    "greetingMessage": "홍길동님 안녕하세요!",
    "membershipLevel": "일반회원"
  },
  "benefits": { "points": 0, "couponCount": 0, "orderTotalCount": 3 },
  "orderStatusSummary": {
    "recentPeriod": "최근 3개월",
    "mainStatuses": { "pendingPayment": 0, "preparing": 0, "shipping": 0, "delivered": 0 },
    "subStatuses": { "cancelled": 0, "exchanged": 0, "returned": 0 }
  },
  "activityCounts": { "wishlistCount": 0, "postCount": 0, "regularDeliveryCount": 0 }
}
```

> Cache Tag: `['User']`

---

### `useUpdateProfileMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/users/profile` |

**Request Body**
```json
{
  "phoneNumber": "010-1234-5678",
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!",
  "confirmPassword": "NewPass1!",
  "marketingConsent": { "smsAllowed": true, "emailAllowed": false }
}
```

> `name`·`email`은 서버에서 수정하지 않음 (전송해도 무시).

**Response Body** — 수정된 사용자 데이터 반환
```json
{
  "status": "success",
  "data": { "userId": "user1234", "name": "홍길동", "phoneNumber": "010-1234-5678", "smsAllowed": true, ... }
}
```

> `invalidatesTags: ['Auth', 'User']` — `getMe` + `getProfile` 동시 갱신.

---

### `useDeleteAccountMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/users` |

**Request Body**
```json
{ "password": "CurrentPass1!" }
```

> 소셜 전용 계정은 `password` 없이 `{}` 가능.

**Response Body**
```json
{ "status": "success", "data": { "withdrawal_date": "2026-04-27T10:20:33" } }
```

---

### `useGetAddressesQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/users/addresses` |

**컴포넌트 수신값** (`transformResponse: res.data` 후)
```json
{
  "totalCount": 1,
  "addresses": [
    {
      "addressId": 10,
      "addressName": "집",
      "isDefault": true,
      "recipientName": "홍길동",
      "phoneNumber": "010-1234-5678",
      "postcode": "06236",
      "baseAddress": "서울 강남구 테헤란로 123",
      "detailAddress": "101동 1001호",
      "extraAddress": "역삼동",
      "addressType": "ROAD",
      "updatedAt": "2026-04-27T10:20:33"
    }
  ]
}
```

> Cache Tag: `['Address']`

---

### `useCreateAddressMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/users/addresses` |

**Request Body**
```json
{
  "addressName": "집",
  "postcode": "06236",
  "baseAddress": "서울 강남구 테헤란로 123",
  "detailAddress": "101동 1001호",
  "extraAddress": "역삼동",
  "addressType": "ROAD",
  "isDefault": true
}
```

> `recipientName`·`phoneNumber`는 서버가 자동 채움. 첫 번째 배송지는 자동 기본 배송지.

**Response Body** — 등록된 배송지 전체 데이터 반환 (`useGetAddressesQuery`와 동일 주소 구조)

> `invalidatesTags: ['Address']`

---

### `useUpdateAddressMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `PUT` |
| **URL** | `/users/addresses/:addressId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `addressId` | number | Y | 배송지 ID |

**Request Body**: `useCreateAddressMutation`과 동일 구조.

> `invalidatesTags: ['Address']`

---

### `useDeleteAddressMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/users/addresses/:addressId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `addressId` | number | Y | 배송지 ID |

**Response Body**
```json
{ "status": "success", "data": { "deleted_address_id": 10 } }
```

> `invalidatesTags: ['Address']`

---

## Search (`src/api/searchApi.js`)

> Search Server 전용 — `/search/*` 경로.

### 공통 응답 포맷

```json
{
  "status": "success",
  "totalElements": 100,
  "totalPages": 9,
  "currentPage": 0,
  "size": 12,
  "isFirst": true,
  "isLast": false,
  "hasNext": true,
  "hasPrevious": false,
  "extra": {},
  "data": []
}
```

`normalizePage()` 후 컴포넌트 수신 공통 필드: `content[]`, `totalPages`, `totalElements`, `currentPage`, `hasNext`, `hasPrevious`, `isFirst`, `isLast`, `extra`

---

### `useSearchProductsQuery` / `useLazySearchProductsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `title` | string | N | — | 상품명 검색 |
| `keyword` | string | N | — | 키워드 검색 |
| `category` | string | N | `ALL` | 카테고리 코드 (예: `"SNACK_JERKY"`) |
| `subCategory` | string | N | — | 서브카테고리 |
| `minPrice` | number | N | — | 최소 가격 |
| `maxPrice` | number | N | — | 최대 가격 |
| `searchScope` | string | N | — | 검색 범위 |
| `sortType` | string | N | `최신순` | 정렬 방식 |
| `page` | number | N | `0` | 페이지 번호 (0-based) |
| `size` | number | N | `12` | 페이지 크기 |

**컴포넌트 수신값** (`normalizePage` + `normalizeSearchProduct` 후)
```json
{
  "content": [
    {
      "id": 1,
      "name": "사료명",
      "img": "https://...",
      "price": 30000,
      "originalPrice": 35000,
      "discountRate": 14,
      "discountTag": "14% 할인",
      "isNew": false,
      "productTag": "베스트",
      "productUrl": "/product/detail/1",
      "category": "SNACK_JERKY"
    }
  ],
  "totalPages": 5,
  "totalElements": 48,
  "currentPage": 0,
  "hasNext": true,
  "extra": { "trendingKeywords": ["사료", "간식"] }
}
```

> `extra.trendingKeywords`는 검색 액션일 때만 포함.  
> Cache Tag: `[{ type: 'Search', id: 'PRODUCTS' }]`

---

### `useGetHomeBestsellerQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/home-bestseller` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `size` | number | N | `3` | 조회 개수 |

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": 1,
    "rank": 1,
    "name": "사료명",
    "img": "https://...",
    "price": 30000,
    "score": 4.8,
    "salesCount": 320,
    "createdAt": "2026-04-01T00:00:00",
    "productUrl": "/product/detail/1"
  }
]
```

> 랜딩페이지 `BestSellers.jsx`가 이 훅을 사용.  
> Cache Tag: `[{ type: 'Search', id: 'HOME_BESTSELLER' }]`

---

### `useGetTastePicksQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/taste-picks` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `brandName` | string | N | `오독오독` | 허용값: `오독오독` \| `어글어글` \| `스위피` (`#오독오독` 형식도 허용) |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "tags": [
    { "brandName": "오독오독", "tagName": "#오독오독", "selected": true },
    { "brandName": "어글어글", "tagName": "#어글어글", "selected": false },
    { "brandName": "스위피",   "tagName": "#스위피",   "selected": false }
  ],
  "selectedBrandName": "오독오독",
  "products": [
    {
      "id": 1,
      "name": "오독오독 바삭한 간식",
      "img": "https://...",
      "price": 12000,
      "brandName": "오독오독",
      "productUrl": "/product/detail/1"
    }
  ]
}
```

> 랜딩페이지 `ProductTabs.jsx`가 이 훅을 사용. `tags[].selected`로 활성 탭 결정.  
> Cache Tag: `[{ type: 'Search', id: 'TASTE_PICKS_{brandName}' }]`

---

### `useGetBestsellerProductsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/bestseller` |

베스트셀러 탭 6개 조회.

**컴포넌트 수신값**
```json
{
  "content": [
    { "id": 1, "name": "사료명", "img": "https://...", "price": 30000, "salesRank": 1, "rankTag": "판매 1위", "productUrl": "/product/detail/1" }
  ]
}
```

> Cache Tag: `[{ type: 'Search', id: 'BESTSELLER' }]`

---

### `useGetMainBannersQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/main-banners` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": 1,
    "img": "https://...",
    "href": "/product/detail/1",
    "alt": "배너 상품 1",
    "displayOrder": 0
  }
]
```

> 서버 원본 필드: `productId`, `imageUrl`, `displayOrder`, `isHero`.  
> 랜딩페이지 `HeroSlider.jsx`가 이 훅을 사용.  
> Cache Tag: `[{ type: 'Search', id: 'MAIN_BANNERS' }]`

---

### `useGetSimilarProductsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/:productId/similar` |

**Request**: `{ productId: number, size?: number }` (기본 size=3)

**컴포넌트 수신값**
```json
[
  { "id": 1, "name": "사료명", "img": "https://...", "tags": ["NEW"], "price": 30000, "productUrl": "/product/detail/1" }
]
```

> 태그 우선순위: `[NEW]` > `[판매 1위]` > `[판매 2위]` > `[판매 3위]`  
> Cache Tag: `[{ type: 'Search', id: 'SIMILAR_{productId}' }]`

---

### `useGetAutocompleteQuery` / `useLazyGetAutocompleteQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/autocomplete` |

**Request**: `name` (string, 필수)  
**응답**: `[{ id, title }]`

---

### `useGetTrendingKeywordsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/products/trending` |

**응답**: `[{ rank, keyword, score }]`

---

### `useSearchReviewsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/reviews` |

**Request**: `{ productId?, keyword?, sortType?, reviewType?, page?, size? }`

---

### `useSearchNoticesQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/notices` |

**Request**: `{ searchRange?, searchType?, keyword?, page?, size? }`  
> `size` 파라미터는 서버에서 항상 10으로 고정 처리 — 미전송 권장.  
> `extra.menuTitle`: `"NOTICE"`

---

### `useSearchFaqsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/faq` |

> ⚠️ 경로 주의: `/search/faq`가 아닌 `/faq` (Board Server 직접 경유)

**Request**: `{ searchRange?, searchType?, keyword?, page? }`  
> `size` 파라미터는 서버에서 항상 10으로 고정 처리 — 미전송.

**컴포넌트 수신값** (`normalizePage` 후)
```json
{
  "content": [
    {
      "id": 1,
      "title": "배송 관련 자주 묻는 질문",
      "author": "관리자",
      "createdAt": "2026-04-24",
      "viewCount": 120,
      "faqDetailUrl": "/api/v1/faqs/1"
    }
  ],
  "totalPages": 2,
  "totalElements": 15
}
```

> Cache Tag: `[{ type: 'FAQ', id: 'LIST' }]`

---

### `useGetBrandStoryQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/brand-story` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "mainCard": {
    "imageUrl": "https://...",
    "buttonText": "브랜드 스토리",
    "buttonUrl": "/brand-story"
  }
}
```

> Cache Tag: `[{ type: 'Search', id: 'BRAND_STORY' }]`

---

### `useGetBrandStoryDetailQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/brand-story/detail` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  { "imageUrl": "https://...", "displayOrder": 1 },
  { "imageUrl": "https://...", "displayOrder": 2 }
]
```

> 페이지네이션 없음. `displayOrder` 기준 오름차순 정렬 후 렌더링.  
> Cache Tag: `[{ type: 'Search', id: 'BRAND_STORY_DETAIL' }]`

---

### `useGetSearchCategoriesQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/categories` |

> `categoryApi.js`의 `useGetCategoriesQuery`와 동일 엔드포인트. 검색 필터에서 직접 사용 시 이 훅 사용.  
> Cache Tag: `[{ type: 'Search', id: 'CATEGORIES' }]`

---

### `useGetNavigationQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/navigation` |

**Request**: 파라미터 없음

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  { "key": "STORE",      "label": "STORE",        "emoji": "🐾", "route": "/product/list?categoryId=ALL" },
  { "key": "BESTSELLER", "label": "베스트셀러",   "emoji": "🏆", "route": "/best" },
  { "key": "BRAND",      "label": "브랜드 스토리","emoji": "✨", "route": "/brand-story" }
]
```

> 서버 `route` 필드 불일치 보정: `key` 기반으로 클라이언트 라우터와 일치하는 경로로 재매핑.  
> GNB 상단 탭 렌더링에 사용.  
> Cache Tag: `[{ type: 'Search', id: 'NAVIGATION' }]`

---

### `useGetReviewHeaderQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/search/reviews/header` |

**Request Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `productId` | number | N | 특정 상품의 리뷰 헤더 조회 시 전달 |

**컴포넌트 수신값** (`transformResponse` 후 — res 그대로 반환)
```json
{
  "avgRating": 4.7,
  "totalCount": 312,
  "ratingDistribution": { "5": 72, "4": 18, "3": 6, "2": 2, "1": 2 }
}
```

> Cache Tag: `productId` 있으면 `[{ type: 'Search', id: 'REVIEW_HEADER_{productId}' }]`, 없으면 `REVIEW_HEADER`

---

## Wishlist (`src/api/wishlistApi.js`)

---

### `useGetWishlistQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/wishlist` |

**Request**
- Parameters: 없음
- Body: 없음

**컴포넌트 수신값** (`transformResponse` 후)
```json
[
  {
    "id": 1,
    "name": "사료명",
    "price": 27000,
    "img": "https://...",
    "currentOption": "1kg",
    "options": ["1kg", "2kg"]
  }
]
```

> Cache Tag: `[{ type: 'Wishlist', id: 'LIST' }]`

---

### `useAddWishlistItemMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/wishlist` |

**Request Body**
```json
{ "productId": 1 }
```

**Response Body**
```json
{ "message": "관심상품에 추가되었습니다." }
```

> `invalidatesTags: [{ type: 'Wishlist', id: 'LIST' }]`

---

### `useRemoveWishlistItemMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `DELETE` |
| **URL** | `/wishlist/:productId` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `productId` | number | Y | 상품 ID |

**Request Body**: 없음

**Response**: `204 No Content`

> `invalidatesTags: [{ type: 'Wishlist', id: 'LIST' }]`

---

## Payment (`src/api/paymentApi.js`)

> Base URL: `https://localhost:8072/api/v1/payments`  
> Toss Payments 연동 브리지 — 프론트 결제 플로우: `createOrder` → `preparePayment` → `widgets.requestPayment()` → (Toss 리다이렉트) → `confirmPayment`

---

### `usePreparePaymentMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/payments/prepare` |

**Request Body**
```json
{
  "orderId": 100,
  "orderName": "어글어글 스팀 100g 8종",
  "amount": 35000,
  "customerName": "홍길동",
  "customerEmail": "user@example.com",
  "currency": "KRW"
}
```

**Response Body** (201 Created)
```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 100,
  "orderName": "어글어글 스팀 100g 8종",
  "amount": 35000,
  "customerName": "홍길동",
  "customerEmail": "user@example.com",
  "currency": "KRW",
  "status": "READY"
}
```

> `preparePayment` 후 Toss SDK `widgets.requestPayment()` 호출.

---

### `useConfirmPaymentMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/payments/confirm` |

**Request Body**
```json
{
  "paymentKey": "tgen_20260417123456abc123",
  "orderId": 100,
  "amount": 35000
}
```

**Response Body** (200 OK)
```json
{
  "paymentId": "pay_7b3e04d227af44d2b2a2b9f7b7f1c555",
  "orderId": 100,
  "status": "APPROVED",
  "method": "CARD",
  "amount": 35000,
  "currency": "KRW",
  "approvedAt": "2026-04-17T15:30:00"
}
```

> `PaymentSuccessPage`에서 Toss 리다이렉트 파라미터(`paymentKey`, `orderId`, `amount`)로 호출.  
> 성공 후 `/order/detail/:orderId`로 이동.  
> `invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Cart', id: 'LIST' }]`

---

### `useSubscribePaymentEventsQuery`

| 항목 | 값 |
|---|---|
| **메서드** | SSE (`EventSource`) |
| **URL** | `/payments/orders/{orderId}/events` |

**인자**: `orderId` (number)

**동작**
- `confirmPayment` 호출 후 결제 최종 상태를 SSE로 수신
- 이벤트 이름: `payment-status`
- `status === 'PAID'` 또는 `status === 'FAILED'` 수신 시 SSE 연결 자동 종료

**캐시 데이터 형태**
```json
{ "status": "PAID" }
```

> `queryFn`으로 구현 (HTTP 요청 없음 — 캐시 초기값 `{ status: null }`).  
> `withCredentials: true` 로 쿠키 포함.  
> `PaymentSuccessPage`에서 orderId로 구독, `status`가 확정되면 주문 상세 이동.

---

## Notice (`src/api/noticeApi.js`)

> Board Server 전용 — 공지·FAQ 상세 조회.  
> 목록은 `searchApi.js`(`useSearchNoticesQuery`, `useSearchFaqsQuery`) 참조.

---

### `useGetNoticeDetailQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/notices/:id` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | number | Y | 공지 ID |

**컴포넌트 수신값** (`normalizeNoticeDetail` 후)
```json
{
  "id": 3,
  "category": "일반",
  "title": "[공지] 배송 지연 공지",
  "isPinned": true,
  "images": ["https://s3.../notice.jpg"],
  "actions": [{ "label": "자세히보기", "targetUrl": "/cs", "actionType": "LINK", "sortOrder": 1 }],
  "content": "공지 본문 텍스트",
  "createdAt": "2026-04-24 08:31:51",
  "updatedAt": "2026-04-24 08:31:51"
}
```

> `author`·`viewCount` 없음 (FAQ 상세에만 존재).  
> Cache Tag: `[{ type: 'Notice', id }]`

---

### `useGetFaqDetailQuery`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/faqs/:id` |

**Request Path Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | number | Y | FAQ ID |

**컴포넌트 수신값** (`normalizeFaqDetail` 후)
```json
{
  "id": 1,
  "category": "FAQ",
  "title": "배송 관련 자주 묻는 질문",
  "isPinned": false,
  "images": [],
  "actions": [],
  "content": "FAQ 본문 텍스트",
  "author": "관리자",
  "viewCount": 120,
  "createdAt": "2026-04-24 08:31:51",
  "updatedAt": "2026-04-24 08:31:51"
}
```

> `author`·`viewCount`는 FAQ 전용 필드.  
> Cache Tag: `[{ type: 'FAQ', id }]`

---

## RAG (`src/api/ragApi.js`)

> RagServer — `/rag/**` 경로. 인증 필요 (gateway whitelist 미포함).  
> 공통 응답: `ApiResponse<T>` 래퍼, `transformResponse: (res) => res.data ?? res` 로 추출.  
> 상세 비즈니스 명세: `docs/domain/cs.md` 참조.

---

### `useGetSessionHistoryQuery(sessionId)`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/rag/sessions/{sessionId}` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "sessionId": "abc-123",
  "messageCount": 4,
  "messages": [{ "role": "USER", "content": "질문 내용", "timestamp": 1714276800000 }]
}
```

> Cache Tag: `[{ type: 'Rag', id: sessionId }]`

---

### `useGetDocumentStatusQuery(documentId)`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/rag/documents/{documentId}` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "documentId": "doc-001",
  "filename": "faq.pdf",
  "category": "FAQ",
  "status": "processed",
  "errorMessage": "",
  "chunkCount": 12,
  "createdAt": "2026-04-28T10:00:00Z",
  "updatedAt": "2026-04-28T10:01:00Z"
}
```

> 폴링 중단 조건: `status === 'processed' || status === 'failed'`  
> Cache Tag: `[{ type: 'Rag', id: 'DOC_{documentId}' }]`

---

### `useGetDocumentChunksQuery(documentId)`

| 항목 | 값 |
|---|---|
| **메서드** | `GET` |
| **URL** | `/rag/documents/{documentId}/chunks` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "documentId": "doc-001",
  "chunks": [{ "chunkIndex": 0, "chunkId": "c-001", "header": "소제목", "tokenCount": 120, "content": "청크 내용" }]
}
```

> Cache Tag: `[{ type: 'Rag', id: 'CHUNKS_{documentId}' }]`

---

### `useRagChatMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/rag/chat` |

**Request Body**
```json
{ "sessionId": "abc-123", "question": "배송 기간이 어떻게 되나요?" }
```

**컴포넌트 수신값** (`transformResponse` 후)
```json
{ "sessionId": "abc-123", "rewrittenQuestion": "배송 기간은?", "answer": "보통 2~3일 소요됩니다.", "sources": [] }
```

> `sessionId`는 첫 호출 시 생략 가능 — 서버가 신규 세션 생성 후 반환.

---

### `useHybridSearchMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/rag/search` |

**Request Body**
```json
{ "question": "배송비 정책", "topK": 5 }
```

**컴포넌트 수신값** (`transformResponse` 후)
```json
{
  "query": "배송비 정책",
  "topK": 5,
  "results": [{ "chunkId": "c-001", "documentId": "doc-001", "filename": "faq.pdf", "category": "FAQ", "chunkIndex": 0, "text": "...", "score": 0.92 }]
}
```

---

### `useUploadDocumentMutation`

| 항목 | 값 |
|---|---|
| **메서드** | `POST` |
| **URL** | `/rag/documents` |

**Request** (multipart/form-data)
| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `file` | File | Y | `.pdf` · `.docx` · `.txt` |
| `document_id` | string | N | 지정 문서 ID |
| `category` | string | N | `FAQ` \| `NOTICE` \| `POLICY` |

**컴포넌트 수신값** (`transformResponse` 후)
```json
{ "documentId": "doc-001", "filename": "faq.pdf", "category": "FAQ", "status": "pending", "chunkCount": 0, "message": "업로드 완료" }
```

> 업로드 직후 `status: 'pending'` — 이후 `useGetDocumentStatusQuery`로 폴링 (2초 간격).
