# Notice 도메인 명세

기준일: 2026-04-29 (FaqPage·FaqDetailPage 구현 완료)

---

## 개요

공지사항(Notice) 도메인. 고객센터(`/cs`) 하위 커뮤니티 메뉴로 진입하며,
NoticePage과 NoticeDetailPage로 구성된다.

- **목록** — Search Server(`searchApi.js`) `useSearchNoticesQuery` 사용
- **상세** — 별도 서버(`noticeApi.js`) `useGetNoticeDetailQuery` 사용

---

## 라우트

| 경로          | 컴포넌트           | 보호        |
| ------------- | ------------------ | ----------- |
| `/notice`     | `NoticePage`       | 없음 (공개) |
| `/notice/:id` | `NoticeDetailPage` | 없음 (공개) |
| `/faq`        | `FaqPage`          | 없음 (공개) |
| `/faq/:id`    | `FaqDetailPage`    | 없음 (공개) |

---

## API 엔드포인트

> 2026-04-24 백엔드 전체 확정

| 메서드 | 경로              | 훅                        | 파일           | 설명                          |
| ------ | ----------------- | ------------------------- | -------------- | ----------------------------- |
| GET    | `/search/notices` | `useSearchNoticesQuery`   | `searchApi.js` | 공지 목록 (Search Server)     |
| GET    | `/faq`            | `useSearchFaqsQuery`      | `searchApi.js` | FAQ 목록 (Search Server)      |
| GET    | `/notices/:id`    | `useGetNoticeDetailQuery` | `noticeApi.js` | 공지 상세 (Board Server)      |
| GET    | `/faqs/:id`       | `useGetFaqDetailQuery`    | `noticeApi.js` | FAQ 상세 (Board Server)       |

---

## 공지 목록 API (`/search/notices`)

> ✅ **백엔드 확정** (2026-04-24) — 기술 상세는 `docs/domain/search.md` 참조

### 요청 파라미터

| 파라미터      | 타입   | 기본값   | 설명                                                  |
| ------------- | ------ | -------- | ----------------------------------------------------- |
| `page`        | number | 0        | 페이지 번호 (0-based)                                 |
| `size`        | number | (무시됨) | 서버가 항상 `10`으로 고정 처리 — 미전송               |
| `searchRange` | string | `일주일` | 기간 필터 (`일주일` \| `한달` \| `세달` \| `전체`)    |
| `keyword`     | string | —        | 검색어 (없으면 미전송)                                |
| `searchType`  | string | `제목`   | 검색 기준 (`제목` \| `내용`) — keyword 있을 때만 전송 |

### 응답 구조 (확정)

```json
{
  "status": "success",
  "totalElements": 15,
  "totalPages": 3,
  "currentPage": 0,
  "extra": { "menuTitle": "NOTICE" },
  "data": [
    {
      "id": 3,
      "displayNo": null,
      "displayLabel": "공지",
      "category": "공지",
      "title": "[공지] 배송 지연 공지",
      "isPinned": true,
      "noticeDetailUrl": "/api/v1/notices/3",
      "createdAt": "2026-04-23 08:31:51"
    },
    {
      "id": 9,
      "displayNo": 12,
      "displayLabel": "12",
      "category": "일반",
      "title": "배송 안내 업데이트",
      "isPinned": false,
      "noticeDetailUrl": "/api/v1/notices/9",
      "createdAt": "2026-04-23 08:49:41"
    }
  ]
}
```

> 고정공지(`isPinned=true`)는 매 페이지 상단에 포함. `data[]` 길이 = `10 + 고정공지 수`.

### 정규화 후 컴포넌트 수신값

| 내부 필드        | 백엔드 원본 필드   | 비고                                       |
| ---------------- | ------------------ | ------------------------------------------ |
| `id`             | `id`               | 라우팅용 ID                                |
| `displayNo`      | `displayNo`        | 고정공지 `null`, 일반글 번호               |
| `displayLabel`   | `displayLabel`     | 고정공지: `"공지"`, 일반글: 번호 문자열    |
| `category`       | `category`         |                                            |
| `title`          | `title`            |                                            |
| `isPinned`       | `isPinned`         | 고정공지 여부 → UI 강조 (primary 색상)     |
| `noticeDetailUrl`| `noticeDetailUrl`  | API 경로 — 클라이언트 라우팅 사용 금지     |
| `createdAt`      | `createdAt`        |                                            |

---

## FAQ 목록 API (`/faq`)

> ✅ **백엔드 확정** (2026-04-24) — 경로 주의: `/search/faq`가 아닌 `/faq`

### 요청 파라미터

| 파라미터      | 기본값   | 설명                                                  |
| ------------- | -------- | ----------------------------------------------------- |
| `page`        | 0        | 페이지 번호                                           |
| `size`        | (무시됨) | 서버가 항상 `10`으로 고정 처리                        |
| `searchRange` | `일주일` | 기간 필터                                             |
| `keyword`     | —        | 검색어                                                |
| `searchType`  | `제목`   | 검색 기준                                             |

### 정규화 후 컴포넌트 수신값

| 내부 필드      | 백엔드 원본 필드 | 비고                              |
| -------------- | ---------------- | --------------------------------- |
| `id`           | `faqId`          |                                   |
| `title`        | `title`          |                                   |
| `author`       | `author`         |                                   |
| `createdAt`    | `createdAt`      | `"YY/MM/DD"` 형식                 |
| `viewCount`    | `viewCount`      |                                   |
| `faqDetailUrl` | `faqDetailUrl`   | API 경로 — 클라이언트 라우팅 사용 금지 |

---

## 상세 API (`/notices/:id`)

> ✅ **백엔드 확정** (2026-04-24) — Board Server `GET /notices/{noticeId}` 응답 기준

| 내부 필드    | 백엔드 확정 필드      | 비고                     |
| ------------ | --------------------- | ------------------------ |
| `id`         | `id`                  |                          |
| `category`   | `category`            | 예: `"일반"`             |
| `title`      | `title`               |                          |
| `isPinned`   | `isPinned`            | 고정공지 여부            |
| `images`     | `contentImageUrls`    | S3 URL 배열              |
| `actions`    | `actions`             | CTA 배열 (label·targetUrl·actionType·sortOrder) |
| `content`    | `content`             |                          |
| `createdAt`  | `createdAt`           | `"YYYY-MM-DD HH:mm:ss"` |
| `updatedAt`  | `updatedAt`           | `"YYYY-MM-DD HH:mm:ss"` |

> ⚠️ notice 상세에는 `author` · `viewCount` 없음 (FAQ 상세에만 존재)

---

## FAQ 상세 API (`/faqs/:id`)

> ✅ **백엔드 확정** (2026-04-24) — Board Server `GET /faqs/{faqId}` 응답 기준

| 내부 필드    | 백엔드 확정 필드      | 비고                     |
| ------------ | --------------------- | ------------------------ |
| `id`         | `id`                  |                          |
| `category`   | `category`            | 항상 `"FAQ"`             |
| `title`      | `title`               |                          |
| `isPinned`   | `isPinned`            |                          |
| `images`     | `contentImageUrls`    | S3 URL 배열              |
| `actions`    | `actions`             | CTA 배열                 |
| `content`    | `content`             |                          |
| `author`     | `author`              | FAQ 전용                 |
| `viewCount`  | `viewCount`           | FAQ 전용                 |
| `createdAt`  | `createdAt`           | `"YYYY-MM-DD HH:mm:ss"` |
| `updatedAt`  | `updatedAt`           | `"YYYY-MM-DD HH:mm:ss"` |

---

## 검색 UI (목록 하단)

2행 구성. 검색 버튼 누를 때 서버 요청.

```
[ 기간 드롭다운 ▼ ]  [ 검색 기준 드롭다운 ▼ ]   ← 1행
[ 검색어 입력창                       ] [검색]   ← 2행
```

### 드롭다운 1 — 기간 (`searchRange`) ✅ 확정

| UI 표시 | API 전송값 | 기본값 |
| ------- | ---------- | :----: |
| 일주일  | `일주일`   |   ✅   |
| 한달    | `한달`     |        |
| 3개월   | `세달`     |        |
| 전체    | `전체`     |        |

- 선택 즉시 서버 재요청 + 페이지 1로 리셋

### 드롭다운 2 — 검색 기준 (`searchType`) ✅ 확정

| UI 표시 | API 전송값 | 기본값 |
| ------- | ---------- | :----: |
| 제목    | `제목`     |   ✅   |
| 내용    | `내용`     |        |

- 검색 버튼 누를 때 `keyword`와 함께 전송
- `keyword`가 없으면 `searchType` 미전송

### 검색어 입력 + 버튼

- 입력창에 검색어 작성 후 검색 버튼 클릭 시 서버 요청
- 검색 시 페이지 1로 리셋

---

## 비즈니스 규칙

- 공지는 `id` 번호 순서대로 표시 (고정공지는 매 페이지 상단 우선 노출)
- 고정공지: `isPinned: true` 항목 — 상세 헤더에 "공지" 배지 표시
- 상세 페이지: 이미지 먼저 노출, 이미지 없으면 텍스트 바로 표시
- 페이지네이션: 서버 사이드, 공유 `Pagination` 컴포넌트 사용
