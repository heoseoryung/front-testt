import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetProductByIdQuery } from '../api/productApi'
import { useAddCartItemMutation } from '../api/cartApi'
import { useAddWishlistItemMutation } from '../api/wishlistApi'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { initCheckedItems } from '../features/cart/cartSlice'
import SwiffyReviewSummary from './ReviewPage'
import { useGetProductReviewsQuery } from '../api/reviewApi'
import Toast from '../features/components/ui/Toast'
import Spinner from '../shared/components/Spinner'
import { BRAND_NAME } from '@/shared/utils/constants'

// ─── 이미지 슬라이더 ─────────────────────────────────────────────────────────────
function ImageSlider({ images, isSoldOut }) {
  const [currentIdx, setCurrentIdx] = useState(0)

  const next = () => setCurrentIdx(prev => prev === images.length - 1 ? 0 : prev + 1)
  const prev = () => setCurrentIdx(prev => prev === 0 ? images.length - 1 : prev - 1)

  return (
    <div className="w-full md:w-[500px] shrink-0">
      <div className="relative aspect-square rounded-[32px] overflow-hidden bg-[#f8f8f8] border border-[#eee] group">
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center rounded-[32px]">
            <span className="text-white font-black text-[22px] tracking-widest bg-black/60 px-6 py-2 rounded-full">품절</span>
          </div>
        )}
        <div className="flex h-full transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIdx * 100}%)` }}>
          {images.map((img, i) => (
            <img key={i} src={img} className="w-full h-full object-contain shrink-0" alt="" />
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md cursor-pointer border-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-lg font-bold text-[#111]">〈</span>
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md cursor-pointer border-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-lg font-bold text-[#111]">〉</span>
            </button>
          </>
        )}
        <div className="absolute bottom-6 left-0 w-full flex justify-center gap-2 z-10">
          {images.map((_, i) => (
            <div key={i} onClick={() => setCurrentIdx(i)} className={`h-1 rounded-full cursor-pointer transition-all ${currentIdx === i ? 'bg-[#3ea76e] w-8' : 'bg-black/10 w-4'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} onClick={() => setCurrentIdx(idx)} className={`w-20 h-20 shrink-0 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${currentIdx === idx ? 'border-[#3ea76e] opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}>
            <img src={img} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 탭 하단 공통 콘텐츠 ─────────────────────────────────────────────────────────
function TabContent({ activeTab, product, setActiveTab }) {
  const { data: reviewData } = useGetProductReviewsQuery(
    { productId: product.id, params: { page: 0, size: 1 } },
    { skip: !product.id },
  )
  const reviewCount = reviewData?.totalElements ?? 0

  return (
    <>
      <div className="flex mb-10 border-b border-[#eee] sticky top-0 bg-white z-10">
        {[
          { key: 'detail', label: '상세정보' },
          { key: 'review', label: `사용후기 ${reviewCount > 0 ? `(${reviewCount})` : ''}` },
          { key: 'qna', label: '제품문의' },
          { key: 'info', label: '배송/교환/반품' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-8 py-5 text-[14px] font-black transition-colors cursor-pointer relative border-none bg-transparent ${
              activeTab === tab.key || (tab.key === 'review' && activeTab === 'review-all')
                ? 'text-[#3ea76e]' : 'text-[#aaa] hover:text-[#333]'
            }`}
          >
            {tab.label}
            {(activeTab === tab.key || (tab.key === 'review' && activeTab === 'review-all')) && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#3ea76e] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'detail' && (
        <div className="flex flex-col items-center">
          {product.detailImgs?.length > 0
            ? product.detailImgs.map((src, i) => (
                <img key={i} src={src} alt={`상세 ${i + 1}`} className="w-full max-w-[860px]" />
              ))
            : <p className="py-24 text-[#bbb] font-bold text-[15px]">상세 이미지가 없습니다.</p>
          }
        </div>
      )}
      {(activeTab === 'review' || activeTab === 'review-all') && (
        <SwiffyReviewSummary
          writeReviewState={{
            productId: product.id,
            productName: product.name,
            productImage: product.img ?? product.images?.[0] ?? null,
          }}
        />
      )}
      {activeTab === 'qna' && <div className="text-center py-24 text-[#bbb] font-bold text-[15px]">게시물이 없습니다.</div>}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-8 text-[14px] text-[#555] leading-relaxed py-4">
          <div>
            <h3 className="font-black text-[#111] mb-3 text-[16px]">배송 안내</h3>
            <p className="font-bold text-[#888]">배송 기간: 1일 ~ 2일 (도서산간 지역 배송 불가)</p>
          </div>
          <div>
            <h3 className="font-black text-[#111] mb-3 text-[16px]">교환/반품 안내</h3>
            <p className="font-bold text-[#888]">상품 수령 후 7일 이내 교환/반품 가능</p>
            <p className="font-bold text-[#888]">냉동제품 단순변심 교환/반품 불가</p>
            <p className="font-bold text-[#888]">카카오톡 {BRAND_NAME} 채널로 문의해주세요</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { data: product, isLoading, isError } = useGetProductByIdQuery(id)
  const [addCartItem] = useAddCartItemMutation()
  const [addWishlistItem] = useAddWishlistItemMutation()

  const [selectedOption, setSelectedOption] = useState('')
  const [optionError, setOptionError] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')
  const [alertMsg, setAlertMsg] = useState('')
  const [alertNav, setAlertNav] = useState('')

  const [qty, setQty] = useState(1)
  const [relatedSelections, setRelatedSelections] = useState({})
  const [relatedOpen, setRelatedOpen] = useState(true)

  useEffect(() => {
    setSelectedOption('')
    setOptionError(false)
    setQty(1)
    setActiveTab('detail')
  }, [id])

  if (isLoading) return <Spinner fullscreen />
  if (isError || !product) {
    return <div className="text-center py-24 text-[#bbb] font-bold text-[16px]">상품을 찾을 수 없습니다.</div>
  }

  const isSoldOut = product.stockStatus === 'SOLDOUT' || product.stockQuantity <= 0
  const productImages  = product.images?.length ? product.images : (product.img ? [product.img] : [])

  const optionExtra = selectedOption
    ? product.options?.find(o => o.label === selectedOption)?.extra ?? 0
    : 0

  const totalPrice = (product.price + optionExtra) * qty

  const validate = () => {
    if (!selectedOption && product.options?.length > 0) {
      setAlertMsg('상품 옵션을 선택해주세요.')
      return false
    }
    return true
  }

  const handleCart = async () => {
    if (!validate()) return
    try {
      await addCartItem({
        productId: product.id,
        optionId:  product.options?.length > 0
          ? product.options.find(o => o.label === selectedOption)?.id
          : 0,
        quantity:  qty,
      }).unwrap()
      navigate('/cart')
    } catch {
      setAlertMsg('장바구니 담기에 실패했습니다.')
      setAlertNav('')
    }
  }

  const handleWish = async () => {
    try {
      await addWishlistItem(product.id).unwrap()
      setAlertMsg('찜 목록에 추가됐습니다.')
      setAlertNav('/wishlist')
    } catch {
      setAlertMsg('관심상품 추가에 실패했습니다.')
      setAlertNav('')
    }
  }

  const handleBuy = async () => {
    if (!validate()) return
    const optionId = product.options?.length > 0
      ? (product.options.find(o => o.label === selectedOption)?.id ?? 0)
      : 0
    try {
      await addCartItem({ productId: product.id, optionId, quantity: qty }).unwrap()
      dispatch(initCheckedItems([`${product.id}-${optionId}`]))
      navigate('/checkout')
    } catch {
      setAlertMsg('구매하기에 실패했습니다.')
      setAlertNav('')
    }
  }

  return (
    <>
      {alertMsg && (
        <Toast
          message={alertMsg}
          onClose={() => { setAlertMsg(''); setAlertNav('') }}
          onNavigate={alertNav ? () => { setAlertMsg(''); navigate(alertNav); setAlertNav('') } : null}
          navText="바로가기"
        />
      )}

      <div className="max-w-[1200px] mx-auto px-6 py-10 text-[#111]">
        <div className="flex flex-col md:flex-row gap-12 mb-10">
          <ImageSlider images={productImages} isSoldOut={isSoldOut} />

          <div className="flex-1 flex flex-col gap-5 py-2">
            <div>
              <div className="flex justify-between items-start mb-2">
                {product.brand && <p className="text-[13px] text-[#3ea76e] font-bold">{product.brand}</p>}
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-[#f5f5f5] rounded-full cursor-pointer border-none bg-transparent transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                  </button>
                  <button onClick={handleWish} className="p-2 hover:bg-[#f5f5f5] rounded-full cursor-pointer border-none bg-transparent transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>
              </div>
              <h1 className="text-[24px] font-black text-[#111] leading-snug mb-2 tracking-tight">{product.name}</h1>
              {product.desc && <p className="text-[14px] text-[#aaa] font-bold">{product.desc}</p>}
            </div>

            <div className="pt-5 border-t border-[#f0f0f0]">
              <p className="text-[30px] font-black text-[#111] tracking-tight">{product.price?.toLocaleString()}원</p>
            </div>

            {product.options?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[14px] font-bold text-[#555]">옵션 선택</p>
                <select
                  value={selectedOption}
                  onChange={e => { setSelectedOption(e.target.value); setOptionError(false) }}
                  className={`w-full border rounded-2xl px-5 py-3 text-[14px] text-[#333] outline-none cursor-pointer bg-white transition-colors font-bold ${optionError ? 'border-red-400 bg-red-50' : 'border-[#eee] focus:border-[#3ea76e]'}`}
                >
                  <option value="">- 옵션을 선택해 주세요 -</option>
                  {product.options.map(opt => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label}{opt.extra > 0 ? ` (+${opt.extra.toLocaleString()}원)` : ''}
                    </option>
                  ))}
                </select>
                {optionError && <p className="text-red-400 text-[13px] font-bold mt-1 ml-1">옵션을 선택해주세요.</p>}
              </div>
            )}

            {selectedOption && (
              <div className="flex items-center gap-4">
                <p className="text-[14px] font-bold text-[#555]">수량</p>
                <div className="flex items-center rounded-full overflow-hidden border border-[#eee] bg-[#f8f8f8] px-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center font-bold text-[#aaa] hover:text-[#111] bg-transparent border-none cursor-pointer text-lg">－</button>
                  <span className="w-10 text-center text-[14px] font-black text-[#111]">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center font-bold text-[#aaa] hover:text-[#111] bg-transparent border-none cursor-pointer text-lg">＋</button>
                </div>
              </div>
            )}

            <div className="pt-5 border-t border-[#f0f0f0] flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#aaa]">총 금액</p>
              <p className="text-[24px] font-black text-[#3ea76e] tracking-tight">{totalPrice.toLocaleString()}원</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={isSoldOut ? undefined : handleCart}
                disabled={isSoldOut}
                className={`flex-1 py-4 border-2 font-black text-[15px] rounded-2xl transition-all ${isSoldOut ? 'border-[#ddd] text-[#bbb] cursor-not-allowed bg-transparent' : 'border-[#3ea76e] text-[#3ea76e] hover:bg-[#f0faf4] cursor-pointer bg-transparent'}`}
              >
                {isSoldOut ? '품절' : '장바구니'}
              </button>
              <button
                onClick={isSoldOut ? undefined : handleBuy}
                disabled={isSoldOut}
                className={`flex-1 py-4 font-black text-[15px] rounded-2xl transition-all border-none ${isSoldOut ? 'bg-[#ddd] text-[#bbb] cursor-not-allowed' : 'bg-[#3ea76e] text-white hover:bg-[#318a57] cursor-pointer'}`}
              >
                {isSoldOut ? '품절' : '구매하기'}
              </button>
            </div>
          </div>
        </div>

        {product.relatedProducts?.length > 0 && (
          <div className="mb-10 bg-[#FCFBF9] rounded-[40px] border border-[#eee] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <button onClick={() => setRelatedOpen(v => !v)} className="w-full flex items-center justify-between px-10 py-6 bg-transparent border-none cursor-pointer hover:bg-black/5 transition-colors">
              <span className="text-[16px] font-black text-[#111] tracking-tight">함께 구매하면 좋은 제품</span>
              <span className="text-[20px] font-bold text-[#aaa]">{relatedOpen ? '−' : '+'}</span>
            </button>
            {relatedOpen && (
              <div className="divide-y divide-[#eee]">
                {product.relatedProducts.map(item => (
                  <div key={item.id} className="flex items-center gap-5 px-10 py-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#eee] shrink-0 bg-white">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-black text-[#111] mb-1 tracking-tight">{item.name}</p>
                      {item.discountPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#bbb] line-through">{item.originalPrice?.toLocaleString()}원</span>
                          <span className="text-[15px] font-black text-[#3ea76e]">{item.discountPrice?.toLocaleString()}원</span>
                        </div>
                      ) : (
                        <p className="text-[15px] font-black text-[#111]">{item.originalPrice?.toLocaleString()}원</p>
                      )}
                    </div>
                    {item.options?.length > 0 && (
                      <div className="w-[200px] shrink-0">
                        <select
                          value={relatedSelections[item.id] || ''}
                          onChange={e => setRelatedSelections(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-full border border-[#eee] rounded-2xl px-4 py-2.5 text-[13px] text-[#333] outline-none cursor-pointer bg-white focus:border-[#3ea76e] transition-colors font-bold"
                        >
                          {item.options.map((opt, i) => (
                            <option key={i} value={i === 0 ? '' : opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <TabContent activeTab={activeTab} product={product} setActiveTab={setActiveTab} />
      </div>
    </>
  )
}
