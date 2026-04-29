# 마이페이지 뷰 (`/mypage`)

기준일: 2026-04-29

## 경로

`/mypage` → `UserProfilePage.jsx` (ProtectedRoute 보호)

## 레이아웃 구성

```
[페이지 타이틀: 마이페이지]

         ┌───────────────────────────────┐
         │ [이미지]  [등급배지]          │  ← 프로필 카드 (mx-20)
         │           [인사말]  [주문내역]│
         └───────────────────────────────┘

    ┌─────────────────────────────────────┐
    │ 계정 및 서비스 관리                  │  ← 메뉴 카드 (mx-8)
    │  회원정보              >             │
    │  관심상품  (N)         >             │
    │  게시물관리 (N)        >             │
    │  배송 주소록 관리       >             │
    └─────────────────────────────────────┘

[로그아웃]
```

---

## 프로필 카드

- **섹션 여백**: `mx-20` (메뉴 카드보다 좁게 들여쓰기)
- **카드 내부**: `flex flex-row items-center gap-6` — 이미지 좌측, 텍스트 우측
- **이미지**: `profileImgUrl` 있으면 원형 이미지, 없으면 이름 첫 글자 이니셜 (36px, green)
- **텍스트 영역**: `flex items-start justify-between flex-1` — 좌측(등급 배지·인사말), 우측(주문내역)
  - **좌측**: `text-left` — 멤버십 등급 배지(`userSummary.membershipLevel`, 있을 때만) + 인사말(`greetingMessage` 우선, 없으면 `{name}님, 안녕하세요!`)
  - **우측**: `text-right` — 라벨("주문내역") + `benefits.orderTotalCount`건, null이면 `-`

---

## 계정 및 서비스 관리 메뉴

- **섹션 여백**: `mx-8`

| 항목 | 경로 | 카운트 뱃지 |
|---|---|---|
| 회원정보 | `/profile/modify` | 없음 |
| 관심상품 | `/wishlist` | `activityCounts.wishlistCount` |
| 게시물관리 | `/profile/posts` | `activityCounts.postCount` |
| 배송 주소록 관리 | `/address` | 없음 |

> **제거된 항목**: 주문조회 (`/order/list`) — 헤더 아이콘(ReceiptText)으로만 접근.

---

## 제거된 섹션

- **최근 주문 내역 카드**: 배송 상태 4단계 그리드(입금전·배송준비중·배송중·배송완료), 취소·교환·반품 카운트, 전체보기 링크 전체 삭제.

---

## 데이터 의존성

| 훅 | 엔드포인트 | 사용 데이터 |
|---|---|---|
| `useGetProfileQuery()` | GET `/users/profile` | `userSummary`, `benefits.orderTotalCount`, `activityCounts` |
| `useLogoutMutation()` | POST `/auth/logout` | 로그아웃 버튼 |
