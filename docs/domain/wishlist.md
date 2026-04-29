# Wishlist 도메인

기준일: 2026-04-29

## 개요

관심상품(찜) 목록 조회·추가·삭제를 담당한다. 서버 데이터는 RTK Query `api` 캐시에만 존재하며, 별도 Redux slice는 없다.

---

## WishlistItem 데이터 구조

```js
{
  id: number,             // productId
  name: string,
  price: number,
  img: string,
  currentOption: string,  // 현재 선택된 옵션 (빈 문자열이면 미선택)
  options: string[],      // 선택 가능한 옵션 목록
}
```

---

## API 엔드포인트 (`src/api/wishlistApi.js`)

`apiSlice.injectEndpoints()`로 정의.

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetWishlistQuery()` | GET | `/wishlist` | 관심상품 목록 조회 |
| `useAddWishlistItemMutation` | POST | `/wishlist` | 추가 — `body: { productId }` |
| `useRemoveWishlistItemMutation` | DELETE | `/wishlist/:productId` | 단일 삭제 |

모든 Mutation은 `invalidatesTags: [{ type: 'Wishlist', id: 'LIST' }]`로 목록을 자동 재조회한다.

---

## WishListPage UI 동작

| 위치 | 동작 |
|---|---|
| 상단 버튼 | "장바구니 보기" → `/cart` 이동 |
| 개별 "담기" 버튼 | `addCartItem({ productId, quantity: 1 })` 호출 (cartApi) |
| 담기 버튼 피드백 | 클릭 후 1.5초간 "담겼어요!" (초록) 표시 → 원래 텍스트 복원 |

- `useAddCartItemMutation` import: `src/api/cartApi.js`
- `WishItem` 컴포넌트: `onAddToCart` prop으로 핸들러 수신

---

## 알려진 제한 사항

- 옵션 선택 드롭다운은 현재 로컬 상태만 변경 (서버에 저장하는 API 미연결)
- 전체삭제는 `items.forEach(removeWishlistItem)` 방식 — 요청이 아이템 수만큼 발생
