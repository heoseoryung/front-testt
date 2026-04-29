# Auth 도메인

기준일: 2026-04-29

## 개요

인증·인가 전체 흐름을 담당한다. 토큰은 HttpOnly 쿠키로만 관리하며, 로그인 사용자 상태는 `getMe` RTK Query 캐시가 단일 출처다.

> 구체적 구현 패턴은 `.claude/skills/auth-security/SKILL.md` 참조.

---

## 인증 구조 (현재 구현)

```
브라우저                      서버
GET /api/v1/csrf ──────►   XSRF-TOKEN 쿠키 발급 (JS readable)
POST /auth/login ──────►   access_token  (HttpOnly 쿠키)
                            refresh_token (HttpOnly 쿠키)

GET /users/me ─────────►   { data: { userId(string), name, email, profileImgUrl, phoneNumber, smsAllowed, emailAllowed, updatedAt } }

401 수신 → Gateway 자동 갱신 시도 → 실패 → dispatch(logout())
```

---

## 상태 구조 (현재 구현)

```js
// authSlice — logout 액션만 존재, 상태 없음
auth: {}

// getMe RTK Query 캐시 — user 정보의 유일한 출처
api.queries.getMe → {
  userId, name, email, phoneNumber,
  smsAllowed, emailAllowed, updatedAt
} | null
```

**useAuth() 훅** — 컴포넌트에서 사용자 정보 접근 시 이 훅만 사용:

```js
const { user, isInitialized, isLoggedIn, isAdmin } = useAuth()
// user:          getMe 응답 data (null이면 비로그인)
// isInitialized: getMe 첫 요청 완료 여부 (!isLoading)
// isLoggedIn:    !!user
// isAdmin:       user?.role === 'ADMIN'
```

---

## API 엔드포인트 (`src/api/authApi.js`)

`apiSlice.injectEndpoints()`로 정의.

### Queries

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetCsrfQuery()` | GET | `/api/v1/csrf` | XSRF-TOKEN 쿠키 발급 — 앱 최초 로드 시 1회 |
| `useGetMeQuery()` | GET | `/users/me` | 로그인 사용자 정보 — `user` 상태의 단일 출처 |
| `useGetTermsQuery()` | GET | `/auth/terms` | 약관 목록 (인증 불필요) |

### Mutations

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useLoginMutation` | POST | `/auth/login` | 로그인 → getMe forceRefetch |
| `useSignupMutation` | POST | `/auth/signup` | 회원가입 (약관 동의 포함) |
| `useRefreshMutation` | POST | `/auth/refresh` | 토큰 갱신 (Gateway 자동 갱신 보조) |
| `useLogoutMutation` | POST | `/auth/logout` | 로그아웃 → dispatch(logout()) |
| `useSendEmailVerifyMutation` | POST | `/auth/email/send?email=` | 이메일 인증 코드 발송 |
| `useVerifyEmailMutation` | POST | `/auth/email/verify?email=&code=` | 이메일 인증 코드 확인 |

---

## AuthInitializer 패턴 (현재 구현)

```jsx
// src/features/auth/AuthInitializer.jsx
export default function AuthInitializer({ children }) {
  useGetCsrfQuery()          // CSRF 쿠키 발급
  useGetCategoriesQuery()    // 카테고리 프리패치
  useAuth()                  // getMe 캐시 워밍 (결과는 ProtectedRoute에서 소비)
  return children            // 렌더링 블로킹 없음 — ProtectedRoute가 스피너 담당
}
```

---

## ProtectedRoute 패턴 (현재 구현)

```jsx
// src/features/auth/ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isInitialized } = useAuth()
  const location = useLocation()

  if (!isInitialized) return <Spinner fullscreen />        // getMe 응답 대기
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}
```

공개 페이지(`/`, `/product/list` 등)는 `ProtectedRoute`를 거치지 않으므로 getMe 완료를 기다리지 않는다.

---

## withReauth 패턴 (현재 구현)

`src/api/apiSlice.js` 내부 (별도 `baseQuery.js` 파일 없음):

```js
// 401 수신 시 = Gateway 갱신까지 실패 → 로그아웃만 처리 (재시도 없음)
if (result.error?.status === 401) {
  api.dispatch(logout())
}
```

`store.js`의 `logoutMiddleware`:
```js
// logout 액션 → getMe 캐시를 null로 초기화 → useAuth().isLoggedIn = false
if (action.type === logout.type) {
  storeAPI.dispatch(apiSlice.util.upsertQueryData('getMe', undefined, null))
}
```

---

## 약관(Terms) API

### GET /auth/terms

인증 불필요. 회원가입 화면 진입 시 호출.

**서버 원본 응답**

```json
{
  "status": "success",
  "terms": [
    { "id": "service_terms", "title": "서비스 이용약관", "content": "<p>...</p>", "isRequired": true,  "version": "1.0", "lastUpdated": "2026-04-27T10:20:33" },
    { "id": "marketing_sms", "title": "SMS 마케팅 수신 동의", "content": "<p>...</p>", "isRequired": false, "version": "1.0", "lastUpdated": "2026-04-27T10:20:33" }
  ]
}
```

> 서버는 `isRequired` 필드명을 사용한다. `authApi.js`의 `transformResponse`에서 `required: t.required ?? t.isRequired ?? false`로 normalize → 컴포넌트는 `t.required`로 접근.

### POST /auth/signup / POST /auth/login / POST /auth/refresh 응답

```json
{ "accessToken": "eyJ..." }
```

토큰은 HttpOnly 쿠키로도 동시 발급. 프론트는 응답 바디의 `accessToken`을 저장하지 않는다 (No Token Storage 원칙).

### POST /auth/signup 요청 바디

```json
{
  "username": "user1234",
  "name": "홍길동",
  "email": "user@example.com",
  "password": "Password1!",
  "phoneNumber": "010-1234-5678",
  "termsAgreed": {
    "service_terms": true,
    "privacy_policy": true,
    "marketing_sms": false
  }
}
```

**비밀번호 규칙:** 8~20자, 대/소문자 + 숫자 + 특수문자(`@$!%*?&`) 각 1개 이상.

### POST /auth/logout 응답

```json
{}
```

`Authorization` 헤더 없으면 `accessToken` 쿠키 기준으로 로그아웃. 응답 후 `accessToken`·`refreshToken` 쿠키 만료.

---

## 에러 응답 형식

### Validation 에러 (400)

`@Valid` DTO 검증 실패 — `errors`는 필드별 Map. 여러 필드가 동시에 포함될 수 있음.

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다.",
  "errors": {
    "username": "아이디는 4자 이상 20자 이하여야 합니다.",
    "password": "비밀번호는 영문 대문자/소문자/숫자/특수문자를 포함해야 합니다."
  }
}
```

### Business 에러 (400)

중복 아이디·이메일, 이메일 미인증, 로그인 실패 등 — `errors` 없이 `message`만 내려옴.

```json
{
  "status": 400,
  "code": "BAD_REQUEST",
  "message": "아이디 또는 비밀번호가 올바르지 않습니다. (남은 시도 횟수: 4회)"
}
```

> 로그인 실패 메시지에 **남은 시도 횟수**가 포함된다. 프론트는 `err?.data?.message`를 그대로 표시.

### 계정 잠금 (423)

로그인 실패 5회 초과 시.

```json
{
  "status": 423,
  "code": "ACCOUNT_LOCKED",
  "message": "로그인 시도 횟수를 초과했습니다. 900초 후 다시 시도해주세요.",
  "errors": {
    "remainSeconds": "900"
  }
}
```

> `errors.remainSeconds`는 **문자열**로 내려온다. 프론트에서 `Number(errors.remainSeconds)` 변환 불필요 — 템플릿 리터럴에서 자동 coercion.

### 주요 상태 코드 요약

| 코드 | 의미 | 프론트 처리 |
|---|---|---|
| `400 VALIDATION_ERROR` | DTO 검증 실패 | `Object.values(errors).join(' ')` |
| `400 BAD_REQUEST` | 비즈니스 로직 실패 (중복·로그인 실패 등) | `err?.data?.message` 표시 |
| `401 Unauthorized` | 토큰 누락·만료 | `apiSlice.js`에서 `dispatch(logout())` |
| `415 Unsupported Media Type` | 잘못된 Content-Type | `err?.data?.message` fallback |
| `423 Locked` | 로그인 5회 실패, 계정 잠금 | `errors.remainSeconds` 있으면 카운트다운, 없으면 일반 메시지 |
| `401 Unauthorized` | 토큰 누락·만료 | `apiSlice.js`에서 `dispatch(logout())` |
| `415 Unsupported Media Type` | 잘못된 Content-Type | `message` fallback 표시 |
| `423 Locked` | 로그인 실패 횟수 초과, 계정 일시 잠금 | `errors.remainSeconds`(초) 있으면 카운트다운 메시지, 없으면 일반 잠금 메시지 |

> `423` 응답의 `errors.remainSeconds` 필드는 백엔드 선택사항. 없으면 "잠시 후 다시 시도" 메시지로 자동 fallback.

---

## OAuth2 소셜 로그인

- 프론트는 `/oauth2/authorization/{provider}`로 리다이렉트만 수행
- `state` nonce: `generateOAuth2State()` 생성 → sessionStorage 임시 저장 (콜백 검증 후 즉시 삭제)
- Client ID · Secret 코드 포함 절대 금지 (**No OAuth Secret**)
