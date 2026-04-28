import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReviewItem from './ReviewItem'
import ReviewReviewMore from './ReviewReviewMore'
import Pagination from '../../../shared/components/Pagination'
import Spinner from '../../../shared/components/Spinner'
import { useGetProductReviewsQuery } from '@/api/reviewApi'

const PAGE_SIZE = 3

export default function ReviewList({ writeReviewState = null }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState(null)

  const productId = writeReviewState?.productId

  const { data, isLoading } = useGetProductReviewsQuery(
    { productId, params: { page: page - 1, size: PAGE_SIZE } },
    { skip: !productId },
  )

  const reviews = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="bg-white rounded-[40px] border border-[#eee] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#f5f5f5]">
        <h3 className="text-[18px] font-black tracking-tight text-[#111]">
          전체 리뷰 <span className="text-[#3ea76e]">{totalElements}</span>
        </h3>
        <button
          onClick={() => navigate('/review/write', { state: writeReviewState ?? undefined })}
          className="h-10 px-5 rounded-full bg-[#3ea76e] text-white font-black text-[13px] border-none cursor-pointer hover:bg-[#318a57] transition-all"
        >
          리뷰 작성
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-[#bbb] font-bold text-[14px]">
          아직 작성된 리뷰가 없습니다.
        </div>
      ) : (
        <div>
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} onOpenMore={setSelectedReview} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {selectedReview && (
        <ReviewReviewMore review={selectedReview} onClose={() => setSelectedReview(null)} />
      )}
    </div>
  )
}
