# Search 도메인

기준일: 2026-04-29

## 개요

별도 Search Server(`/api/v1/search/**`)가 제공하는 검색·추천·랭킹 API를 담당한다.  
RTK Query 엔드포인트는 `src/api/searchApi.js`(`injectEndpoints`)에 정의한다.

---

## Base Path

| 환경         | URL                                     |
| ------------ | --------------------------------------- |
| Gateway 경유 | `{VITE_API_BASE_URL}/search/`           |
| 예시 (로컬)  | `https://localhost:8072/api/v1/search/` |

> `VITE_API_BASE_URL`은 이미 `/api/v1`을 포함하므로 경로에 `/v1/` 중복 불필요.

---

## 공통 응답 포맷

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

---

## 엔드포인트 목록

| 훅                                                        | 메서드 | 경로                                   | 설명                                               |
| --------------------------------------------------------- | ------ | -------------------------------------- | -------------------------------------------------- |
| `useSearchProductsQuery` / `useLazySearchProductsQuery`   | GET    | `/search/products`                     | 상품 검색 (필터·페이지)                            |
| `useGetBestsellerProductsQuery`                           | GET    | `/search/products/bestseller`          | 베스트셀러 (랭킹)                                  |
| `useGetHomeBestsellerQuery`                               | GET    | `/search/products/home-bestseller`     | 홈 베스트셀러 섹션 (기본 3개)                      |
| `useGetTastePicksQuery(brandName?)`                       | GET    | `/search/products/taste-picks`         | 우리 아이 취향 저격 — 브랜드별 최신 상품 + 탭 목록 |
| `useGetSimilarProductsQuery`                              | GET    | `/search/products/{productId}/similar` | 유사 상품 추천                                     |
| `useGetAutocompleteQuery` / `useLazyGetAutocompleteQuery` | GET    | `/search/products/autocomplete`        | 검색어 자동완성                                    |
| `useGetTrendingKeywordsQuery`                             | GET    | `/search/products/trending`            | 인기 검색어                                        |
| `useSearchReviewsQuery`                                   | GET    | `/search/reviews`                      | 리뷰 검색                                          |
| `useGetReviewHeaderQuery`                                 | GET    | `/search/reviews/header`               | 리뷰 헤더 (평균 별점·총 리뷰 수·별점 분포)         |
| `useSearchNoticesQuery`                                   | GET    | `/search/notices`                      | 공지 목록 검색                                     |
| `useSearchFaqsQuery`                                      | GET    | `/faq`                                 | FAQ 목록 검색                                      |
| `useGetMainBannersQuery`                                  | GET    | `/search/products/main-banners`        | 메인 히어로 배너 (3개)                             |
| `useGetNavigationQuery`                                   | GET    | `/search/navigation`                   | GNB 항목 메타데이터 (key·label·emoji·route·api)    |
| `useGetBrandStoryQuery`                                   | GET    | `/search/brand-story`                  | 브랜드 스토리 메인카드 리소스                      |
| `useGetBrandStoryDetailQuery`                             | GET    | `/search/brand-story/detail`           | 브랜드 스토리 상세 카드 리스트                     |
| `useGetSearchCategoriesQuery`                             | GET    | `/search/categories`                   | 카테고리·서브카테고리 목록 (GNB·필터용)            |

---

## 상품 검색 (`/v1/search/products`)

### Query 파라미터

| 파라미터      | 설명                                                | 기본값   |
| ------------- | --------------------------------------------------- | -------- |
| `title`       | 상품명 검색어                                       | -        |
| `keyword`     | 보조 검색어                                         | -        |
| `category`    | 대카테고리 코드 (`ALL`, `SNACK_JERKY` 등)           | `ALL`    |
| `subCategory` | 서브카테고리 **코드** (`odokodok`, `ugle_jerky` 등) | -        |
| `minPrice`    | 최소 가격                                           | -        |
| `maxPrice`    | 최대 가격                                           | -        |
| `searchScope` | 검색 범위                                           | -        |
| `sortType`    | 최신순 / 판매량순 / 가격 높은순 / 가격 낮은순       | `최신순` |
| `page`        | 페이지 번호 (0-based)                               | `0`      |
| `size`        | 페이지 크기                                         | `12`     |

> `subCategory` 숫자 ID 문자열(예: `5`) 하위 호환 허용이나 **사용 금지** — 코드값(`odokodok`)만 사용.  
> 키워드 검색 시 `extra.trendingKeywords` 조건부 포함. 일반 카테고리 조회에서는 `extra` 생략될 수 있음.

### 서브카테고리 코드표

| 서브카테고리    | 코드                 |
| --------------- | -------------------- |
| 오독오독        | `odokodok`           |
| 어글어글 육포   | `ugle_jerky`         |
| 어글어글 우유껌 | `ugle_milk_gum`      |
| 오래먹는 간식   | `long_lasting_snack` |
| 스위피 테린     | `sweepy_terrine`     |
| 어글어글 스팀   | `ugle_steam`         |
| 스위피 그린빈   | `sweepy_greenbean`   |

### data[] 서버 원본 필드

```js
{
  id, imageUrl, productTitle, originalPrice, price,
  discountRate, discountTag, isNew, productTag, productUrl, category
}
```

### normalizeSearchProduct 변환

```js
{
  id:            item.id,
  name:          item.productTitle,
  img:           item.imageUrl,
  price:         item.price,
  originalPrice: item.originalPrice,
  discountRate:  item.discountRate,
  discountTag:   item.discountTag,
  isNew:         item.isNew,
  productTag:    item.productTag,
  productUrl:    `/product/detail/${item.id}`,  // 서버 productUrl(/products/30) 무시 — 클라이언트 라우터 기준으로 항상 직접 구성
  category:      item.category,
}
```

---

## 홈 베스트셀러 (`/v1/search/products/home-bestseller`)

### Query 파라미터

| 파라미터 | 기본값 | 설명      |
| -------- | ------ | --------- |
| `size`   | `3`    | 노출 개수 |

### data[] 필드

`rank`, `id`, `imageUrl`, `productTitle`, `price`, `score`, `salesCount`, `createdAt`, `productUrl`

### extra 필드

```js
{
  weights: { sales: 0.6, recent: 0.4 },  // 점수 계산 가중치
  updatedAt: string                        // 마지막 집계 시각
}
```

---

## 베스트셀러 (`/v1/search/products/bestseller`)

6건 고정 반환. 검색 랭킹 기반 (실판매량 집계 아님).

### data[] 필드

`id`, `imageUrl`, `productTitle`, `price`, `salesRank`, `rankTag`, `productUrl`

> `productUrl` 서버값(`/products/{id}`) 무시 — 항상 `/product/detail/${id}`로 직접 구성.

---

## 메인 배너 (`/v1/search/products/main-banners`)

최신 상품 이미지 기준 3개 반환. `isHero`는 항상 `true`.

### data[] 필드

`productId`, `imageUrl`, `displayOrder`, `isHero`

컴포넌트에서 사용할 정규화 형태:

```js
{ id: item.productId, img: item.imageUrl, href: `/product/detail/${item.productId}`, displayOrder: item.displayOrder }
```

### extra 필드

`updatedAt` — 마지막 배너 갱신 시각

---

## 우리 아이 취향 저격 (`/v1/search/products/taste-picks`)

홈 "우리 아이 취향 저격 제품" 섹션. 브랜드별 최신 상품 + 탭 목록을 함께 반환.

### Query 파라미터

| 파라미터    | 설명                                      |
| ----------- | ----------------------------------------- |
| `brandName` | 브랜드명 (생략 시 서버 기본값 `오독오독`) |

허용 브랜드: `오독오독` | `어글어글` | `스위피` (또는 `#오독오독` 형식도 허용)

### data[] 서버 원본 필드

`productId`, `imageUrl`, `title`, `price`, `brandName`, `productUrl`

### 응답 구조 (transformResponse 후)

```js
{
  tags: [                         // 탭 버튼 목록 (extra.tags)
    { brandName, tagName, selected }
  ],
  selectedBrandName: string,      // 현재 선택된 브랜드명 (extra.selectedBrandName)
  products: [                     // 해당 브랜드 상품 목록 (data[])
    { id, name, img, price, brandName, productUrl }
    // id   ← item.productId
    // name ← item.title
    // img  ← item.imageUrl
  ]
}
```

### 사용 패턴 (`ProductTabs.jsx`)

```js
const [activeBrand, setActiveBrand] = useState(null); // null = 서버 기본값
const { data } = useGetTastePicksQuery(activeBrand);

// 탭 클릭 시
setActiveBrand(tag.brandName); // 브랜드명 문자열로 변경 → 자동 재조회
```

---

## 브랜드 스토리 메인카드 (`/v1/search/brand-story`)

홈 브랜드 스토리 섹션의 메인 카드 리소스 (Vault/Config 기반).

### 응답 구조 (transformResponse: `res.data`)

```js
{
  mainCard: {
    imageUrl: string,
    buttonText: string,
    buttonUrl: string,
  }
}
```

---

## 브랜드 스토리 상세 (`/v1/search/brand-story/detail`)

브랜드 스토리 상세 페이지용 카드 리스트.

### 서버 응답 구조

```json
{
  "status": "success",
  "data": [
    { "imageUrl": "https://...", "displayOrder": 1 }
  ]
}
```

> 페이지네이션 없음 — `totalElements` 등 공통 포맷 필드 없이 `status` + `data[]`만 반환.

### data[] 필드

`imageUrl`, `displayOrder`

---

## 유사 상품 추천 (`/v1/search/products/{productId}/similar`)

상세 페이지 "이런 제품은 어때요?" 섹션 전용. `size=3` 고정 권장.

### data[] 필드

`productId`, `imageUrl`, `title`, `tags`, `price`

`tags[]` 우선순위: `[NEW]` → `[판매 1위/2위/3위]`

---

## 자동완성 (`/v1/search/products/autocomplete`)

### Query: `name` (필수)

### 응답: `[{ id, title }]`

---

## 인기 검색어 (`/v1/search/products/trending`)

### 응답: `[{ rank, keyword, score }]`

---

## 리뷰 검색 (`/v1/search/reviews`)

> 상품 리뷰 목록(`/products/{id}/reviews`)과 다름 — 전체 검색 전용.

### Query 파라미터

| 파라미터       | 설명                                         |
| -------------- | -------------------------------------------- |
| `productId`    | 상품 ID 필터                                 |
| `keyword`      | 내용/작성자 검색어                           |
| `sortType`     | `BEST` 또는 최신순                           |
| `reviewType`   | `ALL` / `IMAGE` / `VIDEO` / `TEXT`           |
| `page`, `size` | 페이징 (기본 `0`, `5`)                       |

### data[] 필드

`reviewId`, `productId`, `writerName`, `star`, `likeCount`, `reviewMediaUrl`, `mediaType`, `content`, `createdAt`, `reviewDetailUrl`

---

## 공지 · FAQ 검색

> 공지(`/search/notices`) · FAQ(`/faq`) 상세 명세는 **`docs/domain/notice.md`** 참조.

---

## 카테고리 목록 (`/search/categories`)

Vault 설정(`dseum.search.categories`) 기준 카테고리/서브카테고리 목록 반환. 하드코딩 없이 탭·필터 구성에 사용.

### 응답 `data[]` 필드

| 필드            | 타입   | 설명                                                                              |
| --------------- | ------ | --------------------------------------------------------------------------------- |
| `id`            | string | 카테고리 코드 (`"ALL"`, `"SNACK_JERKY"`, ...) — search `category` 파라미터로 전달 |
| `label`         | string | 표시용 이름 (`"ALL"`, `"Snack & Jerky"`, ...)                                     |
| `subCategories` | array  | `{ id, code, label }` 배열                                                        |

### 정규화 (`categoryApi.js` → `useGetCategoriesQuery`)

```js
{ id: cat.id, name: cat.label, subCategories/children: [{id, code, name: sub.label}] }
```

> **category**: URL `?categoryId=` 파라미터(코드값, `"SNACK_JERKY"`)를 그대로 전달.  
> **subCategory**: URL `?sub=` 파라미터(코드값, `"odokodok"`)를 그대로 전달. display name(`"오독오독"`) 전달 시 필터 미동작.  
> `categoryApi.js` `transformResponse`에서 `sub.code` 필드로 저장됨 — `StorePage`는 `sub.code`를 URL에 기록하고, `useStorePageController`가 이를 그대로 `subCategory` 파라미터로 전달.

### GNB 2계층 구조 (`Header.jsx`)

| 계층 | 항목 | 방식 | 표시 조건 |
|---|---|---|---|
| 상단 GNB | STORE / 베스트셀러 / 브랜드 스토리 | `NAV_ITEMS` 고정 배열 | 항상 표시 |
| Store 서브네비 | ALL / Snack & Jerky / Meal / Bakery | `useGetCategoriesQuery()` 동적 구성 | `/product/list` 경로일 때만 표시 |

- 상단 GNB 활성 상태: `location.pathname === item.to` — 초록 언더라인 상시 표시
- 서브네비 링크: `/product/list?categoryId={cat.id}`
- 서브네비 활성 상태: `searchParams.get('categoryId') ?? 'ALL'` 와 `cat.id` 비교 → `hover-primary active` (초록 필 스타일)

### `useStorePageController` 카테고리 연동

URL이 **단일 진실 공급원(Single Source of Truth)**이다. Redux 상태를 쓰지 않는다.

| URL 파라미터 | 역할 | 예시 |
|---|---|---|
| `?categoryId=` | 대카테고리 코드 | `?categoryId=SNACK_JERKY` |
| `?sub=` | 서브카테고리 코드 | `?sub=odokodok` |

- `categoryId` 변경 시 `setPage(1)` dispatch로 페이지만 초기화
- 서브카테고리 목록은 `useGetCategoriesQuery()`의 `activeCategory.subCategories`에서 동적으로 구성
- `StorePage`의 서브카테고리 pill은 `<Link to="?categoryId=...&sub=...">` — 클릭 시 이미 선택된 항목이면 `sub` 파라미터 제거(토글)
- `OdogPage.jsx` 제거됨 (2026-04-20) — `/product/list?categoryId=SNACK_JERKY&sub=odokodok` 으로 대체

---

## GNB 네비게이션 (`/search/navigation`)

GNB 항목 메타데이터를 서버에서 동적으로 조회한다. `Header.jsx`가 이 데이터를 기반으로 GNB를 렌더링한다.

### 응답 `data[]` 필드

| 필드    | 설명                                             |
| ------- | ------------------------------------------------ |
| `key`   | 항목 식별자 (`STORE`, `BESTSELLER`, `BRAND`)     |
| `label` | 표시 텍스트 (`STORE`, `베스트셀러`, `브랜드`)    |
| `emoji` | 이모지 — 렌더링: `emoji + label`                 |
| `route` | 서버 제공 경로 (클라이언트 라우터와 불일치 가능) |
| `api`   | 항목과 연결된 API 메타데이터 (하단 구조 참조)    |

#### `api` 필드 구조

```json
{
  "method": "GET",
  "endpoint": "/search/brand-story/detail",
  "query": {},
  "responsePath": "data"
}
```

| 필드           | 설명                                      |
| -------------- | ----------------------------------------- |
| `method`       | HTTP 메서드                               |
| `endpoint`     | API 경로                                  |
| `query`        | 기본 쿼리 파라미터 (`{}` 이면 파라미터 없음) |
| `responsePath` | 응답에서 데이터를 추출할 키 (`"data"`)    |

> 프론트에서 직접 사용하지 않는 서버 메타데이터. `Header.jsx`는 `key`·`label`·`emoji`·`route`만 사용.

> `SUBSCRIPTION` 키 제거됨 (2026-04-23) — 정기배송 기능 전면 삭제.

### 렌더링 규칙

- 표시: `{emoji} {label}` (예: `🐾 STORE`)
- API 실패 시 폴백: 이모지 없이 `label`만 표시 (`FALLBACK_NAV` 상수)

### route 불일치 보정 (`searchApi.js` `ROUTE_MAP`)

서버 `route` 필드가 클라이언트 라우터와 다를 수 있어 `key` 기반으로 매핑:

| key          | 서버 route                     | 클라이언트 실제 경로           |
| ------------ | ------------------------------ | ------------------------------ |
| `STORE`      | `/product/list?categoryId=ALL` | `/product/list?categoryId=ALL` |
| `BESTSELLER` | `/product/bestseller`          | `/best`                        |
| `BRAND`      | `/search/brand-story/detail`   | `/brand-story`                 |

---

## 리뷰 헤더 (`/search/reviews/header`)

평균 별점·총 리뷰 수·별점 분포를 조회한다.

### Query 파라미터

| 파라미터    | 설명                |
| ----------- | ------------------- |
| `productId` | 상품 ID 필터 (선택) |

### 응답

```js
{
  avgRating: number,          // 평균 별점
  totalCount: number,         // 총 리뷰 수
  ratingDistribution: {       // 별점별 비율 (%)
    "5": number, "4": number, "3": number, "2": number, "1": number
  }
}
```

---

## productApi.js 에서 이전된 엔드포인트

| 구 엔드포인트        | 구 경로              | 이전 후                                                     |
| -------------------- | -------------------- | ----------------------------------------------------------- |
| `getBannerSlides`    | `/main/banners`      | `getMainBanners` → `/v1/search/products/main-banners`       |
| `getMainBestSellers` | `/main/best-sellers` | `getHomeBestseller` → `/v1/search/products/home-bestseller` |
| `getBestProducts`    | `/products/best`     | `getBestsellerProducts` → `/v1/search/products/bestseller`  |
| `searchProducts`     | `/products/search`   | `searchProducts` → `/v1/search/products`                    |
