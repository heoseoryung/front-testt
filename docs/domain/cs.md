# CS 도메인 (고객센터)

기준일: 2026-04-29

## 개요

고객센터 페이지. 전화 상담, AI 채팅 상담, AI 하이브리드 검색, 문서 관리, 공지사항/FAQ 링크로 구성된다.
AI 기능은 `ragserver`의 RAG(Retrieval-Augmented Generation) 기반으로 구현한다.

---

## 페이지 구성 순서 (사용자용 CSPage)

| 섹션 | 설명 |
|---|---|
| 전화 상담 | 032-212-2202, 평일 10:00~18:00 (점심 13:00~14:00) |
| AI 채팅 상담 | `useRagChatMutation` + 세션 복원 (`useGetSessionHistoryQuery`) |
| 커뮤니티 | NOTICE (`/notice`), FAQ (`/faq`) 링크 |

> `POST /rag/chat`만 사용자에게 노출한다.  
> 나머지 엔드포인트(search, documents)는 **백오피스 전용**이며 CSPage에 포함하지 않는다.  
> `ragApi.js`에는 전체 엔드포인트가 정의되어 있고, 추후 백오피스 페이지에서 사용한다.

---

## 공통 응답 포맷

모든 ragserver 응답은 `ApiResponse<T>` 래퍼. `transformResponse: (res) => res.data ?? res` 로 추출.

```json
{
  "code": "SUCCESS",
  "message": "Request processed successfully.",
  "data": {},
  "timestamp": "2026-04-28T03:41:22.1054244Z"
}
```

### 에러 코드 및 프론트 메시지

| 코드 | 의미 | CSPage 표시 메시지 |
|---|---|---|
| `AI-429` | Gemini quota 초과 | "AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." |
| `LLM-502` | LLM 응답 생성 실패 | "AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." |
| `EMB-502` | 임베딩 생성 실패 | "질문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." |
| 나머지 | 기타 오류 | "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." |

---

## API 엔드포인트 (`src/api/ragApi.js`)

게이트웨이: `/api/v1/rag/**` → `RAGSERVER` (RewritePath: `/rag/`)  
인증 필요 (whitelist 미포함).

### Queries

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useGetSessionHistoryQuery(sessionId)` | GET | `/rag/sessions/{sessionId}` | 세션 이력 복원 |
| `useGetDocumentStatusQuery(documentId)` | GET | `/rag/documents/{documentId}` | 문서 처리 상태 폴링 |
| `useGetDocumentChunksQuery(documentId)` | GET | `/rag/documents/{documentId}/chunks` | 청크 미리보기 |

#### `getSessionHistory` 응답 (transformResponse 적용 후)

```js
{
  sessionId: string,
  messageCount: number,
  messages: [{ role: 'USER'|'ASSISTANT', content: string, timestamp: number }]
}
```

> CSPage에서 `role === 'USER' ? 'user' : 'assistant'` 로 소문자 변환 후 `messages` state에 주입.

#### `getDocumentStatus` 응답

```js
{
  documentId: string,
  filename: string,
  category: string,
  status: string,       // 아래 status 값 참고
  errorMessage: string,
  chunkCount: number,
  createdAt: string,
  updatedAt: string,
}
```

**status 값 및 한국어 라벨:**

| 서버 값 | 표시 라벨 | 색상 |
|---|---|---|
| `pending` | 대기 중 | 노랑 |
| `parsing` | 파싱 중 | 노랑 |
| `parsed` | 파싱 완료 | 노랑 |
| `embedding` | 임베딩 중 | 노랑 |
| `embedded` | 임베딩 완료 | 노랑 |
| `indexing` | 색인 중 | 노랑 |
| `processed` | 처리 완료 | 초록 |
| `failed` | 실패 | 빨강 |

> 폴링 중단 조건: `status === 'processed' || status === 'failed'`  
> `status` 비교는 `.toLowerCase()` 적용 후 수행.

#### `getDocumentChunks` 응답

```js
{
  documentId: string,
  chunks: [{ chunkIndex: number, chunkId: string, header: string, tokenCount: number, content: string }]
}
```

### Mutations

| 훅 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| `useRagChatMutation` | POST | `/rag/chat` | AI 채팅 |
| `useHybridSearchMutation` | POST | `/rag/search` | 하이브리드 검색 |
| `useUploadDocumentMutation` | POST | `/rag/documents` | 문서 업로드 (multipart/form-data) |

#### `ragChat` 요청/응답

```js
// 요청
{ sessionId?: string, question: string }

// 응답 (transformResponse 적용 후)
{ sessionId: string, rewrittenQuestion: string, answer: string, sources: SourceItem[] }
```

#### `hybridSearch` 요청/응답

```js
// 요청
{ question: string, topK?: number }

// 응답 (transformResponse 적용 후)
{
  query: string,
  topK: number,
  results: [{ chunkId, documentId, filename, category, chunkIndex, text, score }]
}
```

#### `uploadDocument` 요청/응답

```js
// 요청 (formData 자동 변환)
{ file: File, documentId?: string, category?: string }
// category 허용값: 'FAQ' | 'NOTICE' | 'POLICY'
// 파일 허용 확장자: .pdf, .docx, .txt

// 응답 (transformResponse 적용 후)
{ documentId: string, filename: string, category: string, status: 'pending', chunkCount: 0, message: string }
```

> 업로드 후 즉시 `status: 'pending'` 반환. 파싱/임베딩/색인은 비동기 진행.  
> CSPage에서 반환된 `documentId`로 `useGetDocumentStatusQuery` 폴링 시작 (2초 간격).

---

## AI 채팅 로컬 상태 (`CSPage.jsx`)

```js
// 채팅
messages: [{ role: 'user'|'assistant', text: string, sources?: SourceItem[] }]
sessionId: string | null
input: string
showRestore: boolean
restoreInput: string
restoreQueryId: string | null   // useGetSessionHistoryQuery에 전달

// 검색
searchQuestion: string
searchTopK: string

// 문서
uploadFile: File | null
docId: string
docCategory: string
trackedDocId: string | null   // 폴링 대상 문서 ID
shouldPoll: boolean           // false로 전환 → 폴링 중단
showChunks: boolean
```

---

## 폴링 패턴

```js
const { data: docStatus } = useGetDocumentStatusQuery(trackedDocId, {
  skip: !trackedDocId,
  pollingInterval: shouldPoll ? 2000 : 0,
})

useEffect(() => {
  if (!docStatus) return
  const status = docStatus.status?.toLowerCase()
  if (['processed', 'failed'].includes(status)) setShouldPoll(false)
}, [docStatus])
```

---

## UI 규칙

- 사용자 메시지: 오른쪽 정렬, `#3ea76e` 배경
- AI 응답: 왼쪽 정렬, `#f9f9f9` 배경 + 출처 패널 (`filename` + `snippet`)
- 검색 결과: `filename`, `category`, `chunkIndex`, `score`, `text` 표시
- 문서 상태 배지: 진행 중=노랑, 완료=초록, 실패=빨강
- 청크 미리보기: `processed` 상태일 때만 버튼 노출, 클릭 시 lazy fetch
- 세션 복원: 복원 패널에 현재 sessionId 표시, 임의 ID 입력으로 다른 세션 로드 가능
