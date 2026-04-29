# Review 도메인

기준일: 2026-04-29

## 개요

상품 리뷰 CRUD·"도움돼요"·메인 포토리뷰 하이라이트를 담당한다. 정렬·페이지 UI 상태는 `reviewSlice`, 실제 데이터는 `reviewApi` RTK Query 캐시에서 관리한다.

---

## 비즈니스 정책

| 정책 | 값 | 코드 위치 |
|---|---|---|
| 기본 페이지 크기 | 3개 (`ReviewList`) | `ReviewList.jsx` → `PAGE_SIZE = 3` |
| 작성 조건 | 주문 상태 `DELIVERED`인 경우만 | 서버 정책 |
| 1주문 1리뷰 | 동일 orderId + productId 조합 1회 | 서버 정책 |
| 내용 길이 | 최소 10자 ~ 최대 1,000자 | 클라이언트 유효성 검사 |
| 미디어 첨부 | 사진+동영상 합산 최대 5개, 파일당 최대 50MB | `WriteReviewPage.jsx` → `FILE_MAX_SIZE_MB = 50` |

---

## 상태 구조

```js
// reviewSlice — UI 상태만
review
├── sortBy: 'createdAt'|'rating'|'helpful'
└── pagination: { page: 1, size: REVIEW_PAGE_SIZE }
```

> **페이지네이션 인덱싱 규칙**: `ReviewList.jsx`의 `page` 상태는 **1-indexed** (Pagination 컴포넌트 기준).
> API 호출 시 `page - 1`로 변환하여 전달. 백엔드(Spring Data)는 **0-indexed** 를 요구한다.
>
> ```js
> // page state: 1 → API: page=0 (첫 번째 페이지)
> // page state: 2 → API: page=1 (두 번째 페이지)
> useGetProductReviewsQuery({ productId, params: { page: page - 1, size: PAGE_SIZE } })
> ```

---

## 백엔드 응답 구조 (`GET /reviews`)

```json
{
  "status": "success",
  "totalElements": 1,
  "totalPages": 1,
  "currentPage": 0,
  "size": 3,
  "data": [
    {
      "reviewId": 1,
      "productId": 12,
      "writerName": "user-1",
      "star": 3,
      "likeCount": 0,
      "reviewMediaUrls": ["https://..."],
      "mediaType": "IMAGE",
      "content": "리뷰 내용",
      "createdAt": "1777340228592",
      "reviewDetailUrl": "/reviews/1"
    }
  ]
}
```

> `createdAt`은 Unix 타임스탬프(ms) 문자열. `new Date(Number(createdAt))`으로 변환.

---

## 프론트엔드 정규화 구조 (`transformResponse`)

`reviewApi.js`의 `transformResponse`가 백엔드 응답을 아래 구조로 변환한다.

```js
{
  id: number,          // reviewId
  name: string,        // writerName
  date: string,        // createdAt(ms) → 'YYYY. MM. DD'
  views: number,       // viewCount (미제공 시 0)
  rating: number,      // star (1~5)
  text: string,        // content
  imgs: string[],      // reviewMediaUrls
  helpfulCount: number,// likeCount
  optionText: string,  // optionName 있으면 '구매옵션: ...'
}
```

---

## API 엔드포인트 (`src/api/reviewApi.js`)

`apiSlice.injectEndpoints()`로 정의.

### Queries

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetProductReviewsQuery({ productId, params })` | GET | `/reviews?productId=:id&page=:p&size=:s` | 상품별 리뷰 목록. `ProductDetailPage` 탭에서 `size:1`로 먼저 호출해 `totalElements`(리뷰 개수)를 탭 라벨에 표시 |
| `useGetMyReviewsQuery(params)` | GET | `/reviews/mine` | 내 리뷰 목록 |
| `useGetReviewHighlightsQuery()` | GET | `/main/review-highlights` | 홈 포토리뷰 하이라이트 (메인 전용) — `{ title, items }` 반환 |

#### `useGetReviewHighlightsQuery` 응답 구조

```js
{
  title: string,   // 섹션 타이틀 (서버 응답 title ?? sectionTitle)
  items: [
    {
      id: number,
      img: string,    // reviewImageUrl ?? img
      title: string,  // title ?? productName
      rating: string, // "★ {starAverage}({totalReviewAmount})" 포맷
      href: string,   // reviewUrl ?? '/review'
    }
  ]
}
```

> **섹션 타이틀 정책**: 포토리뷰 섹션 타이틀도 백엔드 응답에서 수신. 하드코딩 금지.

### Mutations

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useCreateReviewMutation` | POST | `/reviews` | 리뷰 작성 (multipart/form-data) |
| `useUpdateReviewMutation` | PUT | `/reviews/:publicId` | 리뷰 수정 (multipart/form-data) |
| `useDeleteReviewMutation` | DELETE | `/reviews/:publicId` | 리뷰 삭제 |
| `useMarkReviewHelpfulMutation` | POST | `/reviews/:publicId/helpful` | 도움돼요 |

---

## 캐시 무효화 전략

| 액션 | invalidatesTags |
|---|---|
| `createReview` | `PRODUCT_<productId>`, `MINE`, `Search.REVIEWS_<productId>` |
| `updateReview` | `<publicId>`, `MINE`, `Search.REVIEWS_<productId>` |
| `deleteReview` | `<publicId>`, `MINE` |
| `markReviewHelpful` | `<publicId>` |

---

## 정렬 연동 패턴

```js
const sortBy = useAppSelector(selectReviewSortBy)
const { page, size } = useAppSelector(selectReviewPagination)

const { data } = useGetProductReviewsQuery({
  productId,
  params: { sortBy, page: page - 1, size },  // page는 1-indexed, API는 0-indexed
})
```

`setReviewSort` 호출 시 `pagination.page`가 자동으로 1로 리셋된다.

---

## 리뷰 통계

서버 응답에 포함되는 집계 데이터:
- `averageRating` — 평균 평점 (소수점 첫째 자리)
- `totalCount` — 전체 리뷰 수
- `ratingDistribution` — 1~5점별 개수 객체

---

## 키워드 태그 카테고리

각 카테고리는 숫자 값(score, 1~5)으로 서버에 전송한다. UI에는 라벨 텍스트를 표시하고, `formData`에는 숫자 값을 담는다. 백엔드가 점수 기반 분석 로직에 활용한다.

### preference (기호도)

| 표시 텍스트 | 전송 값 |
|---|---|
| 아주 잘 먹어요 | `5` |
| 잘 먹어요 | `4` |
| 보통이예요 | `3` |
| 조금 아쉬워요 | `2` |
| 아쉬워요 | `1` |

### repurchase (재구매의사)

| 표시 텍스트 | 전송 값 |
|---|---|
| 꼭 재구매할게요 | `5` |
| 재구매할 것 같아요 | `4` |
| 고민 중이에요 | `3` |
| 잘 모르겠어요 | `2` |
| 없어요 | `1` |

### freshness (신선도)

| 표시 텍스트 | 전송 값 |
|---|---|
| 아주 신선해요 | `5` |
| 신선해요 | `4` |
| 보통이에요 | `3` |
| 조금 아쉬워요 | `2` |
| 아쉬워요 | `1` |

**서버 전송 형식:** `preferenceScore`, `repurchaseScore`, `freshnessScore` 각 필드에 숫자 값 직접 전달

**selectedTags 상태 타입:** `{ [categoryKey]: { value: number, label: string } }` (예: `{ preference: { value: 5, label: '아주 잘 먹어요' } }`)

---

## 도움돼요 규칙

- 본인 리뷰(`isMyReview: true`)에는 도움돼요 클릭 불가
- 클릭 시 `helpfulCount` 1 증가

---

## UI 유효성 검사

| 필드 | 규칙 | 에러 메시지 |
|---|---|---|
| 별점(`rating`) | 필수 선택 | "평점을 선택해 주세요." |
| 내용(`content`) | 10자 이상 | "최소 10자 이상 입력해 주세요." |

---

## 삭제 정책

`window.confirm("리뷰를 정말 삭제하시겠습니까? 삭제 후 복구가 불가능합니다.")` 실행 필수.
