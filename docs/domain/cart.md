# CartServer API 명세서

> Base URL: `https://localhost:8072/api/v1/cart`
> 기준일: 2026-04-29

---

## 공통 규칙

- 장바구니 상품 식별자: `productId + optionId`
- 옵션 없는 상품: `optionId = 0`
- 조회 응답: `page`, `size`, `hasNext` 포함 (더보기 방식)
- 쓰기 응답: 현재 장바구니 전체 상태 반환

---

## 공통 응답 구조

### 장바구니 항목

| 필드         | 타입    | 설명                          |
| ------------ | ------- | ----------------------------- |
| `productId`  | number  | 상품 ID                       |
| `optionId`   | number  | 옵션 ID (없으면 `0`)          |
| `quantity`   | number  | 수량                          |
| `isSelected` | boolean | 체크박스 선택 상태            |
| `isSoldOut`  | boolean | 품절 여부 — UI 비활성화 처리  |

### 조회 응답 (GET)

```json
{
  "userId": 10,
  "selectedItemCount": 1,
  "allSelected": false,
  "hasSelectedItems": true,
  "page": 0,
  "size": 10,
  "hasNext": true,
  "items": [...]
}
```

| 필드                 | UI 사용처                    |
| -------------------- | ---------------------------- |
| `allSelected`        | 전체선택 체크박스 상태       |
| `hasSelectedItems`   | 선택삭제 버튼 활성화 여부    |
| `selectedItemCount`  | 선택 개수 표시               |
| `hasNext`            | 더보기 버튼 노출 여부        |

### 에러 응답

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다.",
  "errors": { "productId": "must not be null" }
}
```

---

## 1. 장바구니 조회

### `GET /api/v1/cart/get?page={page}`

- 페이지네이션: **더보기 방식** — 응답 items를 기존 목록 뒤에 붙임
- 첫 호출: `page=0`, 더보기 클릭 시 `page+1` 호출
- `hasNext=false` 이면 더보기 버튼 미노출

---

## 2. 상품 담기

### `POST /api/v1/cart/additem`

```json
{ "productId": 1001, "optionId": 2001, "quantity": 2 }
```

- 옵션 없는 상품: `optionId` 생략 가능
- Response `201 CREATED`: CartResponse

---

## 3. 전체 선택 변경

### `PUT /api/v1/cart/select-all`

```json
{ "isSelectedAll": true }
```

Response: CartResponse

---

## 4. 개별 선택 변경

### `PUT /api/v1/cart/select`

```json
{ "productId": 1001, "optionId": 2001, "isSelected": false }
```

Response: CartResponse

---

## 5. 옵션 변경

### `PUT /api/v1/cart/option`

```json
{ "productId": 1001, "optionId": 2001, "newOptionId": 2002 }
```

Response: CartResponse

---

## 6. 수량 변경

### `PUT /api/v1/cart/quantity`

```json
{ "productId": 1001, "optionId": 2001, "quantity": 3 }
```

- `quantity = 0` 이면 해당 항목 삭제

Response: CartResponse

---

## 7. 단건 삭제

### `DELETE /api/v1/cart/selected`

```json
{ "productId": 1001, "optionId": 2001 }
```

- 장바구니 카드 1개 삭제 버튼에 사용

Response: CartResponse

---

## 8. 복수 삭제

### `DELETE /api/v1/cart/selecteditems`

```json
{
  "items": [
    { "productId": 1001, "optionId": 2001 },
    { "productId": 1002, "optionId": 0 }
  ]
}
```

- 체크박스로 선택한 여러 상품 삭제 (선택삭제 버튼)
- 전체 삭제 시 현재 장바구니 전체 items를 담아 호출

Response: CartResponse
