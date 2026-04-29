# Product Server API 수정본

기준일: 2026-04-29

> Base URL: `https://localhost:8072/api/v1/product`

--

## GET `/api/v1/product/{productId}`

상품 상세 정보를 조회합니다.

### Path Parameters

| Name        | Type   | Required | Description    |
| :---------- | :----- | :------: | :------------- |
| `productId` | `Long` |    O     | 조회할 상품 ID |

### Success Response

Response Status Code: `200 OK`

```json
{
  "productId": 185,
  "productName": "어글어글 스팀 100g 8종",
  "categoryId": 163,
  "categoryName": "오독오독",
  "brandName": "어글어글",
  "brandId": 3,
  "content": "기호성 높은 강아지 간식",
  "detailImageUrls": ["https://cdn.example.com/product/detail-1.jpg"],
  "price": 12900,
  "priceDisplay": "12,900원",
  "status": "판매중",
  "tags": ["NEW"],
  "keywords": "강아지간식,스팀",
  "salesCount": 5200,
  "deliveryFee": 3000,
  "deliveryMethod": "택배",
  "stockQuantity": 42,
  "stockStatus": "AVAILABLE",
  "imageUrls": ["https://cdn.example.com/product/main.jpg"],
  "options": [
    {
      "optionId": 10,
      "optionName": "닭가슴살",
      "extraPrice": 0,
      "stockQuantity": 10,
      "stockStatus": "AVAILABLE"
    }
  ]
}
```

### Error Response

Response Status Code: `401 Unauthorized`

---

## GET `/api/v1/product/{productId}/options`

특정 상품의 옵션 목록을 조회합니다.

### Path Parameters

| Name        | Type   | Required | Description    |
| :---------- | :----- | :------: | :------------- |
| `productId` | `Long` |    O     | 조회할 상품 ID |

### Success Response

Response Status Code: `200 OK`

```json
[
  {
    "optionId": 10,
    "optionName": "닭가슴살",
    "extraPrice": 0,
    "stockQuantity": 10,
    "stockStatus": "AVAILABLE"
  },
  {
    "optionId": 11,
    "optionName": "연어",
    "extraPrice": 500,
    "stockQuantity": 0,
    "stockStatus": "SOLDOUT"
  }
]
```

> 옵션이 없는 상품은 빈 배열(`[]`)을 반환합니다.

### Error Response

Response Status Code: `500 Internal Server Error`

---

## GET `/api/v1/product/categories`

전체 카테고리 목록을 트리 구조로 조회합니다.

### Path Parameters

없음

### Success Response

Code: `200 OK`

```json
[
  {
    "categoryId": 100,
    "name": "Snack & Jerky",
    "displayOrder": 1,
    "children": [
      {
        "categoryId": 163,
        "name": "오독오독",
        "displayOrder": 1,
        "children": []
      }
    ]
  }
]
```

### Error Response

Response Status Code: `500 Internal Server Error`

---

## GET `/api/v1/product/frontend/{productId}`

프론트 장바구니/주문 요약용 단건 상품 정보를 조회합니다.

### Path Parameters

| Name        | Type   | Required | Description |
| :---------- | :----- | :------: | :---------- |
| `productId` | `Long` |    O     | 상품 ID     |

### Success Response

Response Status Code: `200 OK`

```json
{
  "imageUrl": "https://cdn.example.com/product/main.jpg",
  "productId": 185,
  "productName": "어글어글 동물복지 연어마들렌",
  "price": 12900,
  "options": [
    {
      "optionId": 1,
      "optionName": "단품"
    },
    {
      "optionId": 2,
      "optionName": "3개 세트"
    }
  ]
}
```

> 옵션이 없는 상품은 `options: []`를 반환합니다.

### Error Response

Response Status Code: `401 Unauthorized`
