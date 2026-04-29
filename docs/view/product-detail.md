# ProductDetailPage 뷰

기준일: 2026-04-29

## 개요

상품 상세 페이지. 이미지 슬라이더, 옵션 선택, 장바구니/구매 버튼, 함께 구매 섹션, 탭 콘텐츠(상세정보·사용후기·제품문의·배송교환반품)로 구성된다.

---

## 탭 구조

| 탭 key | 라벨 | 콘텐츠 |
|---|---|---|
| `detail` | 상세정보 | `product.detailImgs` 이미지 목록 |
| `review` | 사용후기 (N) | `ReviewPage` (`SwiffyReviewSummary`) |
| `qna` | 제품문의 | 미구현 (빈 상태 메시지) |
| `info` | 배송/교환/반품 | 정책 텍스트 |

---

## 리뷰 탭 개수 표시

`TabContent` 컴포넌트 내에서 `useGetProductReviewsQuery`를 `size: 1`로 호출해 `totalElements`를 탭 라벨에 표시한다.

```js
const { data: reviewData } = useGetProductReviewsQuery(
  { productId: product.id, params: { page: 0, size: 1 } },
  { skip: !product.id },
)
const reviewCount = reviewData?.totalElements ?? 0
// → 탭 라벨: "사용후기 (3)"
```

- `ReviewList`가 탭 활성화 시 동일 `productId`로 호출하므로 RTK Query 캐시 공유 → 중복 네트워크 요청 없음
- 리뷰 0개일 때는 숫자 없이 `사용후기`만 표시

---

## 관련 API

- `useGetProductByIdQuery(id)` — 상품 정보
- `useAddCartItemMutation` — 장바구니 담기
- `useAddWishlistItemMutation` — 찜하기
- `useGetProductReviewsQuery` — 리뷰 개수 (탭 라벨용)
