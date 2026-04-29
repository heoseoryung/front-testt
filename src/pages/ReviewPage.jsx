import { useState } from 'react';
import { Star, Search, ChevronDown, Check } from 'lucide-react';
import ReviewList from '../features/components/review/ReviewList';
import { useGetReviewHeaderQuery } from '@/api/searchApi';

// 별점 숫자 → 한글 라벨
const STAR_LABELS = { 5: '최고', 4: '좋음', 3: '보통', 2: '별로', 1: '나쁨' }

export default function EumReviewSummary({ writeReviewState = null }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const productId = writeReviewState?.productId

  const { data: stats, isLoading: statsLoading } = useGetReviewHeaderQuery(
    { productId },
    { skip: !productId },
  )

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  // 분포 배열: [{ label, pct }] — 5→최고 순서로 정렬
  const distribution = stats?.distribution
    ?.slice()
    .sort((a, b) => b.stars - a.stars)
    .map((d) => ({ label: STAR_LABELS[d.stars] ?? `${d.stars}점`, pct: d.pct }))
    ?? []

  return (
    <div className="w-full bg-[#FCFBF9] min-h-screen pb-28 px-4 text-[#111]">
      <div className="max-w-[1200px] mx-auto text-center py-24">
        <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">리뷰</h1>
      </div>

      <main className="max-w-[1100px] mx-auto px-4">
        <section className="bg-white rounded-[40px] border border-[#eee] p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-6">

          {/* ── 통계 섹션 ─────────────────────────────────────── */}
          {productId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12 border-b border-[#eee]">

              {/* 왼쪽: 평균 별점 + 분포 */}
              <div className="space-y-8 md:pr-12 md:border-r border-[#eee]">
                <div className="flex flex-col items-center">
                  {statsLoading ? (
                    <div className="h-16 w-32 bg-[#f5f5f5] rounded-2xl animate-pulse" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Star className="w-10 h-10 fill-[#3ea76e] text-[#3ea76e]" />
                        <span className="text-[52px] font-black leading-none text-[#111]">
                          {stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                        </span>
                      </div>
                      {stats?.totalCount > 0 && (
                        <button className="mt-4 bg-[#f5f5f5] px-5 py-2 rounded-full text-[13px] font-bold text-[#888] hover:bg-[#3ea76e] hover:text-white transition-all border-none cursor-pointer">
                          {stats.totalCount}개의리뷰
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* 분포 바 */}
                <div className="space-y-2.5 max-w-[320px] mx-auto w-full">
                  {statsLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-3 bg-[#f5f5f5] rounded animate-pulse" />
                          <div className="flex-1 h-1.5 bg-[#f5f5f5] rounded-full" />
                          <div className="w-8 h-3 bg-[#f5f5f5] rounded animate-pulse" />
                        </div>
                      ))
                    : distribution.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-[12px] font-bold">
                          <span className="w-8 text-[#555]">{item.label}</span>
                          <div className="flex-1 h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3ea76e]"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[#aaa]">{item.pct}%</span>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* 오른쪽: 키워드 카테고리 통계 */}
              <div className="flex flex-col justify-center space-y-6">
                {statsLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-6">
                        <div className="w-20 h-4 bg-[#f5f5f5] rounded animate-pulse shrink-0" />
                        <div className="w-28 h-4 bg-[#f5f5f5] rounded animate-pulse shrink-0" />
                        <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full" />
                      </div>
                    ))
                  : stats?.categoryStats?.map((item) => (
                      <div key={item.label} className="flex items-center gap-6 group">
                        <span className="text-[#3ea76e] text-[14px] font-black w-20 shrink-0">{item.label}</span>
                        <span className="text-[13px] font-bold text-[#aaa] w-28 text-right shrink-0">{item.topAnswer}</span>
                        <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3ea76e] rounded-full transition-all group-hover:opacity-80"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[13px] font-black text-[#111]">{item.pct}%</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── 필터 / 정렬 바 ─────────────────────────────────── */}
          <div className={`flex items-center justify-between ${productId ? 'pt-8' : ''} relative`}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('type')}
                  className={`px-5 py-2.5 border rounded-full text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer ${activeDropdown === 'type' ? 'border-[#3ea76e] bg-white text-[#3ea76e]' : 'bg-[#f5f5f5] border-[#eee] text-[#555]'}`}
                >
                  리뷰 종류 <ChevronDown size={13} />
                </button>
                {activeDropdown === 'type' && (
                  <div className="absolute top-12 left-0 w-[240px] bg-white border border-[#eee] rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 flex gap-2">
                      {['동영상', '사진', '텍스트'].map(t => (
                        <button key={t} className="px-3 py-2 bg-[#f5f5f5] rounded-lg text-[12px] font-bold text-[#555] hover:bg-[#eee] flex-1">{t}</button>
                      ))}
                    </div>
                    <button onClick={() => setActiveDropdown(null)} className="w-full py-3 bg-[#3ea76e] text-white text-[13px] font-black">완료</button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => toggleDropdown('rating')}
                  className={`px-5 py-2.5 border rounded-full text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer ${activeDropdown === 'rating' ? 'border-[#3ea76e] bg-white text-[#3ea76e]' : 'bg-[#f5f5f5] border-[#eee] text-[#555]'}`}
                >
                  별점 <ChevronDown size={13} />
                </button>
                {activeDropdown === 'rating' && (
                  <div className="absolute top-12 left-0 w-[260px] bg-white border border-[#eee] rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 flex gap-1.5">
                      {['5점', '4점', '3점', '2점', '1점'].map(r => (
                        <button key={r} className="px-3 py-2 bg-[#f5f5f5] rounded-lg text-[12px] font-bold text-[#555] hover:bg-[#eee] flex-1">{r}</button>
                      ))}
                    </div>
                    <button onClick={() => setActiveDropdown(null)} className="w-full py-3 bg-[#3ea76e] text-white text-[13px] font-black">완료</button>
                  </div>
                )}
              </div>

              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="리뷰 검색"
                    className="w-[260px] h-10 px-5 rounded-full border border-[#3ea76e] bg-white text-[13px] font-bold text-[#111] outline-none placeholder:text-[#ccc]"
                  />
                  <button
                    onClick={() => { setSearchOpen(false); setSearchText(''); }}
                    className="text-[#ccc] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-[18px] font-bold"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-3 bg-[#f5f5f5] border border-[#eee] rounded-full hover:border-[#3ea76e] hover:bg-white transition-all cursor-pointer group"
                >
                  <Search size={16} className="text-[#888] group-hover:text-[#3ea76e]" />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('sort')}
                className={`px-5 py-2.5 border rounded-full text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer ${activeDropdown === 'sort' ? 'border-[#3ea76e] bg-white text-[#3ea76e]' : 'bg-[#f5f5f5] border-[#eee] text-[#555]'}`}
              >
                유형순 <ChevronDown size={13} />
              </button>
              {activeDropdown === 'sort' && (
                <div className="absolute top-12 right-0 w-[160px] bg-white border border-[#eee] rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2">
                  {['유형순', '최신순', '추천순', '별점순'].map((s) => (
                    <button key={s} className="w-full px-5 py-2.5 text-left text-[13px] font-bold hover:bg-[#f9f9f9] flex justify-between items-center group">
                      <span className="group-hover:text-[#3ea76e]">{s}</span>
                      {s === '유형순' && <Check size={14} className="text-[#3ea76e]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <ReviewList writeReviewState={writeReviewState} />
      </main>
    </div>
  );
}
