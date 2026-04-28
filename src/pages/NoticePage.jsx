import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSearchNoticesQuery } from '@/api/searchApi'
import Pagination from '@/shared/components/Pagination'
import Spinner from '@/shared/components/Spinner'
import { NOTICE_SEARCH_RANGES, NOTICE_SEARCH_TYPES } from '@/shared/utils/constants'

export default function NoticePage() {
  const [page, setPage]         = useState(1) // 1-based (Pagination 컴포넌트 기준)
  const [keyword, setKeyword]   = useState('')
  const [inputValue, setInput]  = useState('')
  const [searchRange, setRange] = useState(NOTICE_SEARCH_RANGES[0].value) // '일주일'
  const [searchType, setType]   = useState(NOTICE_SEARCH_TYPES[0].value)  // '제목'

  const { data, isLoading, isError } = useSearchNoticesQuery({
    page: page - 1,
    searchRange,
    ...(keyword && { keyword, searchType }),
  })

  // normalizePage 후 정규화된 필드 사용
  const notices    = data?.content    ?? []
  const totalPages = data?.totalPages ?? 1

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(inputValue)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="w-full bg-[#FCFBF9] min-h-screen pb-28">
      <div className="max-w-[860px] mx-auto px-4 pt-16 pb-10">
        <h1 className="text-[32px] font-black text-[#111] text-center mb-12 tracking-tighter">
          NOTICE
        </h1>

        {/* 목록 */}
        <div className="border-t border-[#eee]">
          {isLoading && <Spinner />}

          {isError && (
            <div className="text-center py-20 text-[#999]">
              <p className="text-[15px]">오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            </div>
          )}

          {!isLoading && !isError && notices.length === 0 && (
            <div className="text-center py-20 text-[#999]">
              <p className="text-[40px] mb-4">📋</p>
              <p className="text-[15px]">공지사항이 없습니다.</p>
            </div>
          )}

          {!isLoading && notices.map((notice, index) => (
            <Link
              key={notice.id ?? `notice-${index}`}
              to={notice.id ? `/notice/${notice.id}` : '#'}
              className="flex items-center justify-between py-4 px-2 border-b border-[#f0f0f0] hover:bg-[#f9f9f9] transition-colors group"
            >
              <div className="flex items-center gap-5 text-[14px] flex-1 min-w-0">
                <span className={`shrink-0 min-w-[40px] text-center text-[13px] font-bold ${notice.isPinned ? 'text-primary' : 'text-[#bbb]'}`}>
                  {notice.displayLabel}
                </span>
                <span className="truncate text-[#444] font-medium group-hover:text-primary transition-colors">
                  {notice.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {notice.createdAt && (
                  <span className="text-[12px] text-[#bbb] hidden sm:block">
                    {notice.createdAt}
                  </span>
                )}
                <ChevronRight size={16} className="text-[#ccc] group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* 페이지네이션 */}
        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />

        {/* 검색 */}
        <form onSubmit={handleSearch} className="mt-10 space-y-2">
          {/* 드롭다운 2개: 기간 + 검색 기준 */}
          <div className="flex gap-2">
            <select
              value={searchRange}
              onChange={(e) => { setRange(e.target.value); setPage(1) }}
              className="flex-1 px-3 py-2.5 border border-[#ddd] rounded-lg text-[14px] bg-white text-[#555] focus:outline-none focus:border-primary"
            >
              {NOTICE_SEARCH_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select
              value={searchType}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-[#ddd] rounded-lg text-[14px] bg-white text-[#555] focus:outline-none focus:border-primary"
            >
              {NOTICE_SEARCH_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {/* 검색어 입력 + 버튼 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInput(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 px-4 py-2.5 border border-[#ddd] rounded-lg text-[14px] focus:outline-none focus:border-primary"
            />
            <button type="submit" className="btn-primary px-6 py-2.5 text-[14px] rounded-lg shrink-0">
              검색
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
