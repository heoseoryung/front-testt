# Brand Story 뷰

## 경로
`/brand-story` → `BrandStoryPage.jsx`

## 레이아웃 구성

```
[이미지 1 - displayOrder: 1]
[텍스트: "행복은 어디서 올까요?" 섹션]
[이미지 2 - displayOrder: 2]
[텍스트: "eum은" 섹션 + CTA 버튼 → /product/list]
```

### 이미지 섹션
- API: `useGetBrandStoryDetailQuery` → GET /search/brand-story/detail
- 응답: `[{ imageUrl, displayOrder }]`
- `displayOrder` 오름차순 정렬 후 첫 번째·두 번째 이미지만 사용
- 이미지는 `w-full h-auto block` — 원본 비율 그대로 전체 너비 표시

### 텍스트 섹션
- 프론트 하드코딩 카피 (브랜드 스토리 문구)
- 섹션 1: "행복은 어디서 올까요?" + 한/영 본문
- 섹션 2: "eum은" + 브랜드 설명 + "더 많은 제품 보기" 버튼

## 상태 처리
- 로딩: `<Spinner fullscreen />`
- 이미지 없으면 해당 섹션 렌더링 생략 (`firstImg && ...`)

## 홈 BrandStory 카드 (`src/features/components/home/BrandStory.jsx`)
- API: `useGetBrandStoryQuery` → GET /search/brand-story
- `mainCard.imageUrl` 있으면 → API 이미지 표시
- `mainCard.imageUrl` 없으면 → 그라데이션 배경 폴백
- 버튼 텍스트: `mainCard.buttonText` 우선, 없으면 "브랜드 스토리 보기" 폴백
- 클릭 시 항상 `/brand-story`로 이동

## 데이터 의존성
- `BrandStoryPage` → `useGetBrandStoryDetailQuery` only
- 홈 카드 → `useGetBrandStoryQuery` only
- mainCard(`/search/brand-story`)는 홈 카드 전용, 상세 페이지에서 사용 안 함
