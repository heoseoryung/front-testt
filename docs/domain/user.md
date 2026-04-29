# User 도메인

기준일: 2026-04-29 (UserProfilePage 프로필 이미지 레이아웃 변경)

## 개요

회원 프로필 조회·수정·탈퇴, 배송지 CRUD를 담당한다. 서버 데이터는 RTK Query `api` 캐시에만 존재한다.

> 로그인·회원가입·인증 흐름은 `docs/domain/auth.md` 참조.

---

## API 엔드포인트 (`src/api/userApi.js`)

`apiSlice.injectEndpoints()`로 정의.

### 프로필

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetProfileQuery()` | GET | `/users/profile` | 마이페이지 집계 데이터 (주문 건수·찜·게시글 수 등) |
| `useUpdateProfileMutation` | PUT | `/users/profile` | 회원정보 수정 (비밀번호·이름·전화번호·마케팅 동의) |
| `useDeleteAccountMutation` | DELETE | `/users` | 회원 탈퇴 — `body: { password }` |

`updateProfile` 성공 시 `invalidatesTags: ['Auth', 'User']` → `getMe` + `getProfile` 캐시 모두 갱신.

### GET /users/me 응답 구조

`transformResponse: (res) => res.data`

```json
{
  "userId": "user1234",
  "name": "홍길동",
  "email": "user@example.com",
  "profileImgUrl": "https://lh3.googleusercontent.com/a/...",
  "phoneNumber": "010-1234-5678",
  "smsAllowed": false,
  "emailAllowed": false,
  "updatedAt": "2026-04-27T10:20:33"
}
```

> `profileImgUrl`: 소셜 로그인 계정이면 소셜 제공자 이미지 URL, 없으면 `null`.

### GET /users/profile 응답 구조

`transformResponse: (res) => res.data`

```json
{
  "userSummary": {
    "id": 1,
    "name": "홍길동",
    "profileImgUrl": "https://lh3.googleusercontent.com/a/...",
    "greetingMessage": "홍길동님 안녕하세요!",
    "membershipLevel": "일반회원"
  },
  "benefits": {
    "orderTotalCount": 3
  },
  "orderStatusSummary": {
    "recentPeriod": "최근 3개월",
    "mainStatuses": {
      "pendingPayment": 0,
      "preparing": 0,
      "shipping": 0,
      "delivered": 0
    },
    "subStatuses": {
      "cancelled": 0,
      "exchanged": 0,
      "returned": 0
    }
  },
  "activityCounts": {
    "wishlistCount": 0,
    "postCount": 0
  }
}
```

> 컴포넌트 접근 경로 예시: `profile.userSummary.name`, `profile.benefits.orderTotalCount`, `profile.orderStatusSummary.mainStatuses.pendingPayment`  
> 주문 상태·찜·게시글 수는 현재 서버 기본값 `0`.

### PUT /users/profile 요청 바디

```json
{
  "phoneNumber": "010-2222-3333",
  "currentPassword": "Password1!",
  "newPassword": "NewPassword1!",
  "confirmPassword": "NewPassword1!",
  "marketingConsent": { "smsAllowed": true, "emailAllowed": false }
}
```

> `name`·`email`은 서버에서 수정하지 않음 (전송해도 무시).  
> 비밀번호 변경 시 `currentPassword`·`newPassword`·`confirmPassword` 세 필드 모두 필요.

### PUT /users/profile 응답

수정된 사용자 데이터 반환. `invalidatesTags: ['Auth', 'User']` → `getMe`·`getProfile` 캐시 자동 갱신.

```json
{
  "status": "success",
  "data": {
    "userId": "user1234", "name": "홍길동", "email": "user@example.com",
    "profileImgUrl": null, "phoneNumber": "010-2222-3333",
    "smsAllowed": true, "emailAllowed": false, "updatedAt": "2026-04-27T10:30:00"
  }
}
```

### DELETE /users 응답

```json
{ "status": "success", "data": { "withdrawal_date": "2026-04-27T10:20:33" } }
```

> 소셜 전용 계정은 `password` 없이 빈 body `{}`로 호출 가능.

---

### 배송지

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetAddressesQuery()` | GET | `/users/addresses` | 배송지 목록 — 응답: `{ totalCount, addresses: [...] }` |
| `useCreateAddressMutation` | POST | `/users/addresses` | 배송지 등록 |
| `useUpdateAddressMutation` | PUT | `/users/addresses/:addressId` | 배송지 수정 — `{ addressId, ...body }` |
| `useDeleteAddressMutation` | DELETE | `/users/addresses/:addressId` | 배송지 삭제 |

모든 배송지 Mutation은 `invalidatesTags: ['Address']`로 목록을 자동 재조회한다.

### GET /users/addresses 응답 주소 구조

`transformResponse: (res) => res.data` → 컴포넌트는 `data.addresses`·`data.totalCount` 접근.

```json
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
```

### createAddress / updateAddress 요청 바디

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

> `isDefault` — 기본 배송지 여부 (`default` 아님). 첫 번째 배송지는 자동으로 기본 배송지.  
> `recipientName`·`phoneNumber`는 서버가 로그인 사용자 정보로 자동 채움.

---

## 마이페이지 진입 경로

| 경로 | 페이지 | 설명 |
|---|---|---|
| `/mypage` | `UserProfilePage` | 마이페이지 대시보드 |
| `/profile/modify` | `ProfileModifyPage` | 회원정보 수정 |
| `/wishlist` | `WishListPage` | 관심상품 목록 |
| `/address` | `UserAddressPage` | 배송지 관리 |
| `/order/list` | `OrderPage` | 주문 목록 |

모든 마이페이지 경로는 `ProtectedRoute`로 보호된다.

---

## UserProfilePage 프로필 섹션 UI

| 항목 | 이전 | 현재 |
|---|---|---|
| 레이아웃 | 가로 (`flex items-center`) — 이미지 좌측, 이름 우측 | 세로 중앙 (`flex flex-col items-center`) |
| 이미지 크기 | 72×72px | 100×100px |
| 이니셜 텍스트 | 28px | 36px |
