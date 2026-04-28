import { useState, useEffect } from 'react'
import StoreProductGrid from '../features/product/StoreProductGrid'
import Pagination from '../shared/components/Pagination'
import Spinner from '../shared/components/Spinner'
import { useGetBestsellerProductsQuery } from '../api/searchApi'

export default function BestSellerPage() {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { window.scrollTo(0, 0) }, [currentPage])

  // 베스트셀러는 검색 랭킹 기반 — sort 파라미터 없음
  const { data, isLoading } = useGetBestsellerProductsQuery({
    page: currentPage - 1,
  })

  const products   = data?.content       ?? []
  const totalPages = data?.totalPages    ?? 1
  const totalCount = data?.totalElements ?? 0

  return (
    <main className="max-w-[1200px] mx-auto w-full px-6 md:px-8 pb-20">
      <div className="py-16 text-center border-b border-gray-100 mb-10">
        <h1 className="text-[32px] font-black tracking-tight text-[#111]"> 베스트셀러</h1>
      </div>

      <div className="flex items-center pb-4 border-b border-gray-100 mb-12 px-2">
        <span className="text-[14px] font-medium text-[#bbb] tracking-tighter">
          총 <span className="text-[#3ea76e] font-bold">{totalCount}</span>개의 제품
        </span>
      </div>

      {isLoading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-[#bbb] font-bold text-[16px]">상품이 없습니다.</div>
      ) : (
        <StoreProductGrid products={products} />
      )}

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      )}
    </main>
  )
}
