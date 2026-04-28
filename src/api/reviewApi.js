import { apiSlice } from './apiSlice'

export const reviewApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /** 상품별 리뷰 목록 */
    getProductReviews: builder.query({
      query: ({ productId, params }) => ({
        url: `/products/${productId}/reviews`,
        params,
      }),
      transformResponse: (res) => {
        const raw = res.content ?? res.data?.content ?? res.data ?? res ?? []
        const items = Array.isArray(raw) ? raw : []
        return {
          content: items.map((r) => ({
            id: r.reviewId ?? r.id,
            name: r.memberName ?? r.name ?? '익명',
            date: typeof r.createdAt === 'string'
              ? r.createdAt.slice(0, 10).replace(/-/g, '. ')
              : (r.date ?? ''),
            views: r.viewCount ?? r.views ?? 0,
            rating: r.rating ?? r.starRating ?? 0,
            text: r.content ?? r.text ?? '',
            imgs: r.imageUrls ?? r.images ?? r.imgs ?? [],
            helpfulCount: r.helpfulCount ?? 0,
            optionText: r.optionName
              ? `구매옵션: ${r.optionName}`
              : (r.optionText ?? ''),
          })),
          totalPages: res.totalPages ?? res.data?.totalPages ?? 1,
          totalElements: res.totalElements ?? res.data?.totalElements ?? items.length,
        }
      },
      providesTags: (result, error, { productId }) => [
        { type: 'Review', id: `PRODUCT_${productId}` },
      ],
    }),

    /** 내 리뷰 목록 */
    getMyReviews: builder.query({
      query: (params) => ({ url: '/reviews/mine', params }),
      providesTags: [{ type: 'Review', id: 'MINE' }],
    }),

    /** 리뷰 상세 — GET /reviews/{publicId} */
    getReviewById: builder.query({
      query: (publicId) => ({ url: `/reviews/${publicId}` }),
      transformResponse: (res) => {
        const d = res.data ?? res
        return {
          publicId:        d.publicId,
          medias:          (d.reviewMedias ?? []).map((m) => ({ url: m.url, type: m.mediaType })),
          likeCount:       d.likeCount       ?? 0,
          writerName:      d.writerName      ?? '',
          star:            d.star            ?? 0,
          preferenceScore: d.preferenceScore ?? 0,
          repurchaseScore: d.repurchaseScore ?? 0,
          freshnessScore:  d.freshnessScore  ?? 0,
          content:         d.content         ?? '',
          createdAt:       d.createAt        ?? '',
          reportUrl:       d.reportUrl       ?? null,
        }
      },
      providesTags: (result, error, publicId) => [{ type: 'Review', id: publicId }],
    }),

    /** 리뷰 작성 — POST /reviews (multipart/form-data) */
    createReview: builder.mutation({
      query: ({ productId, star, preferenceScore, repurchaseScore, freshnessScore, content, files = [] }) => {
        const formData = new FormData()
        formData.append('data', JSON.stringify({ productId, star, preferenceScore, repurchaseScore, freshnessScore, content }))
        files.forEach((file) => formData.append('files', file))
        return { url: '/reviews', method: 'POST', body: formData }
      },
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Review', id: `PRODUCT_${productId}` },
        { type: 'Review', id: 'MINE' },
        { type: 'Search', id: `REVIEWS_${productId}` },
      ],
    }),

    /** 리뷰 수정 — PUT /reviews/{publicId} (multipart/form-data) */
    updateReview: builder.mutation({
      query: ({ publicId, productId, star, preferenceScore, repurchaseScore, freshnessScore, content, files = [] }) => {
        const formData = new FormData()
        formData.append('data', JSON.stringify({ star, preferenceScore, repurchaseScore, freshnessScore, content }))
        files.forEach((file) => formData.append('files', file))
        return { url: `/reviews/${publicId}`, method: 'PUT', body: formData }
      },
      invalidatesTags: (result, error, { publicId, productId }) => [
        { type: 'Review', id: publicId },
        { type: 'Review', id: 'MINE' },
        ...(productId ? [{ type: 'Search', id: `REVIEWS_${productId}` }] : []),
      ],
    }),

    /** 리뷰 삭제 — DELETE /reviews/{publicId} */
    deleteReview: builder.mutation({
      query: (publicId) => ({ url: `/reviews/${publicId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, publicId) => [
        { type: 'Review', id: publicId },
        { type: 'Review', id: 'MINE' },
      ],
    }),

    /** 도움돼요 — POST /reviews/{publicId}/helpful */
    markReviewHelpful: builder.mutation({
      query: (publicId) => ({ url: `/reviews/${publicId}/helpful`, method: 'POST' }),
      invalidatesTags: (result, error, publicId) => [{ type: 'Review', id: publicId }],
    }),

    /** 홈 포토리뷰 하이라이트 (메인페이지 전용) */
    getReviewHighlights: builder.query({
      query: () => ({ url: '/main/review-highlights' }),
      transformResponse: (res) => {
        const raw = res.data ?? res.items ?? (Array.isArray(res) ? res : [])
        return {
          title: res.title ?? res.sectionTitle ?? '',
          items: raw.map((item) => ({
            id: item.id,
            img: item.reviewImageUrl ?? item.img,
            title: item.title ?? item.productName ?? '',
            rating: `★ ${item.starAverage ?? item.star ?? 0}(${item.totalReviewAmount ?? 0})`,
            href: item.reviewUrl ?? '/review',
          })),
        }
      },
      providesTags: [{ type: 'Review', id: 'HIGHLIGHTS' }],
    }),

  }),
})

export const {
  useGetProductReviewsQuery,
  useGetMyReviewsQuery,
  useGetReviewByIdQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useMarkReviewHelpfulMutation,
  useGetReviewHighlightsQuery,
} = reviewApi
