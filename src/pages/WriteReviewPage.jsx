import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Star, Camera, Video, X } from 'lucide-react'
import { useCreateReviewMutation } from '@/api/reviewApi'

/* ─── 키워드 태그 카테고리 ──────────────────────────────────── */
const TAG_CATEGORIES = [
  {
    key: 'preference',
    label: '기호도는 어떤가요?',
    emoji: '😋',
    options: [
      { value: 3, label: '잘 먹어요!' },
      { value: 2, label: '보통이에요' },
      { value: 1, label: '아쉬워요' },
    ],
  },
  {
    key: 'repurchase',
    label: '재구매의사는 어떤가요?',
    emoji: '🛍️',
    options: [
      { value: 3, label: '있어요' },
      { value: 2, label: '고민 중이에요' },
      { value: 1, label: '없어요' },
    ],
  },
  {
    key: 'freshness',
    label: '신선도는 어떤가요?',
    emoji: '✨',
    options: [
      { value: 3, label: '아주 만족해요' },
      { value: 2, label: '보통이에요' },
      { value: 1, label: '아쉬워요' },
    ],
  },
]

/* ─── 파일 유효성 상수 ─────────────────────────────────────── */
const TOTAL_MEDIA_MAX_COUNT = 5
const FILE_MAX_SIZE_MB = 50
const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const VIDEO_ACCEPT = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm']

export default function WriteReviewPage({ previewOnly = false, embedded = false, previewState = null }) {
  const navigate = useNavigate()
  const location = useLocation()

  /* ─── 라우트 상태 (주문 상세 등에서 navigate로 전달) ───────── */
  const {
    productId,
    orderId,
    productName = '상품명',
    productImage = null,
  } = previewState ?? location.state ?? {}

  /* ─── 폼 상태 ──────────────────────────────────────────────── */
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState({}) // { taste: '맛있게 먹어요', ... }
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])   // [{ file, previewUrl }]
  const [video, setVideo] = useState(null)   // { file, previewUrl } | null
  const [errors, setErrors] = useState({})

  /* ─── ref ──────────────────────────────────────────────────── */
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const totalMediaCount = images.length + (video ? 1 : 0)

  const [createReview, { isLoading }] = useCreateReviewMutation()

  /* ─── 태그 토글 (카테고리당 1개 선택) ─────────────────────── */
  const toggleTag = (categoryKey, option) => {
    setSelectedTags((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey] === option ? undefined : option,
    }))
  }

  /* ─── 이미지 추가 ──────────────────────────────────────────── */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = TOTAL_MEDIA_MAX_COUNT - totalMediaCount
    if (remaining <= 0) return

    const added = []
    for (const file of files.slice(0, remaining)) {
      if (!IMAGE_ACCEPT.includes(file.type)) continue
      if (file.size > FILE_MAX_SIZE_MB * 1024 * 1024) continue
      added.push({ file, previewUrl: URL.createObjectURL(file) })
    }
    setImages((prev) => [...prev, ...added])
    setErrors((prev) => ({ ...prev, media: undefined }))
    e.target.value = ''
  }

  /* ─── 이미지 제거 ──────────────────────────────────────────── */
  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  /* ─── 동영상 추가 ──────────────────────────────────────────── */
  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!video && totalMediaCount >= TOTAL_MEDIA_MAX_COUNT) {
      setErrors((prev) => ({ ...prev, media: `사진과 동영상은 합쳐서 최대 ${TOTAL_MEDIA_MAX_COUNT}개까지 첨부할 수 있습니다.` }))
      e.target.value = ''
      return
    }
    if (!VIDEO_ACCEPT.includes(file.type)) {
      setErrors((prev) => ({ ...prev, video: '지원하지 않는 파일 형식입니다. (mp4, mov, avi, webm)' }))
      e.target.value = ''
      return
    }
    if (file.size > FILE_MAX_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, video: `동영상 크기는 최대 ${FILE_MAX_SIZE_MB}MB까지 가능합니다.` }))
      e.target.value = ''
      return
    }
    if (video) URL.revokeObjectURL(video.previewUrl)
    setVideo({ file, previewUrl: URL.createObjectURL(file) })
    setErrors((prev) => ({ ...prev, video: undefined, media: undefined }))
    e.target.value = ''
  }

  /* ─── 동영상 제거 ──────────────────────────────────────────── */
  const removeVideo = () => {
    if (video) URL.revokeObjectURL(video.previewUrl)
    setVideo(null)
  }

  /* ─── 유효성 검사 ──────────────────────────────────────────── */
  const validate = () => {
    const errs = {}
    if (!rating) errs.rating = '별점을 선택해 주세요.'
    if (content.length < 10) errs.content = '최소 10자 이상 입력해 주세요.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ─── 제출 ─────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validate()) return

    if (previewOnly) {
      setErrors((prev) => ({ ...prev, submit: 'UI 확인용 화면입니다. 현재는 API 없이 동작합니다.' }))
      return
    }

    const files = [
      ...images.map(({ file }) => file),
      ...(video ? [video.file] : []),
    ]

    try {
      await createReview({
        productId,
        star:            rating,
        preferenceScore: selectedTags.preference?.value ?? 0,
        repurchaseScore: selectedTags.repurchase?.value ?? 0,
        freshnessScore:  selectedTags.freshness?.value  ?? 0,
        content,
        files,
      }).unwrap()
      navigate(-1)
    } catch (err) {
      if (err?.status === 409) {
        setErrors((prev) => ({ ...prev, submit: '이미 해당 상품에 리뷰를 작성하셨습니다.' }))
      } else {
        setErrors((prev) => ({ ...prev, submit: err?.data?.message ?? '리뷰 등록에 실패했습니다. 다시 시도해 주세요.' }))
      }
    }
  }

  /* ─── 렌더 ─────────────────────────────────────────────────── */
  return (
    <div className="w-full bg-[#FCFBF9] min-h-screen text-[#111]">

      {/* 헤더 */}
      <header className={`${embedded ? 'rounded-t-[28px]' : 'sticky top-0'} bg-white border-b border-[#eee] z-50 px-6 py-5`}>
        <div className="max-w-[640px] mx-auto grid grid-cols-3 items-center">
          <ChevronLeft
            onClick={() => !previewOnly && navigate(-1)}
            className="w-6 h-6 cursor-pointer text-[#111]"
            strokeWidth={2.5}
          />
          <h1 className="text-[18px] font-black text-center text-[#111] tracking-tight">
            리뷰 작성
          </h1>
          <div />
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 mt-6 space-y-4">

        {/* ── 상품 정보 ──────────────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#FCFBF9] flex-shrink-0 border border-[#eee]">
              {productImage
                ? <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-2xl">🐾</div>
              }
            </div>
            <div>
              <p className="text-[12px] text-[#999] mb-1">구매한 상품</p>
              <p className="text-[15px] font-bold text-[#111] leading-snug line-clamp-2">{productName}</p>
            </div>
          </div>
        </section>

        {/* ── 별점 ──────────────────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee] text-center">
          <p className="text-[14px] font-bold text-[#333] mb-4">
            상품이 마음에 드셨나요?
          </p>
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setRating(n); setErrors((p) => ({ ...p, rating: undefined })) }}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95 bg-transparent border-none cursor-pointer"
              >
                <Star
                  className="w-10 h-10 transition-colors"
                  fill={(hoverRating || rating) >= n ? '#FFD43B' : 'none'}
                  stroke={(hoverRating || rating) >= n ? '#FFD43B' : '#ddd'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <p className="text-[13px] text-[#999]">
            {rating === 0 && '별점을 선택해 주세요'}
            {rating === 1 && '😞 별로예요'}
            {rating === 2 && '😕 아쉬워요'}
            {rating === 3 && '😐 보통이에요'}
            {rating === 4 && '😊 좋아요'}
            {rating === 5 && '🐾 최고예요!'}
          </p>
          {errors.rating && (
            <p className="text-[12px] text-red-500 mt-2">{errors.rating}</p>
          )}
        </section>

        {/* ── 키워드 태그 ────────────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee] space-y-5">
          <p className="text-[14px] font-bold text-[#333]">어떠셨나요? (선택)</p>
          {TAG_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <p className="text-[13px] text-[#666] mb-2">
                {cat.emoji} {cat.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.options.map((opt) => {
                  const active = selectedTags[cat.key] === opt
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleTag(cat.key, opt)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium border cursor-pointer transition-all
                        ${active
                          ? 'bg-[#3ea76e] text-white border-[#3ea76e] font-bold'
                          : 'bg-white text-[#555] border-[#ddd] hover:border-[#3ea76e] hover:text-[#3ea76e]'
                        }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* ── 상세 리뷰 텍스트 ───────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee]">
          <p className="text-[14px] font-bold text-[#333] mb-3">상세 후기</p>
          <textarea
            value={content}
            onChange={(e) => {
              if (e.target.value.length > 1000) return
              setContent(e.target.value)
              if (e.target.value.length >= 10) {
                setErrors((p) => ({ ...p, content: undefined }))
              }
            }}
            placeholder="상품의 맛, 포장 상태 등 솔직한 후기를 남겨주세요. &#10;(최소 10자 이상)"
            rows={5}
            className="w-full resize-none rounded-[14px] border border-[#eee] bg-[#FCFBF9] px-4 py-3 text-[14px] text-[#111] placeholder-[#bbb] outline-none focus:border-[#3ea76e] transition-colors"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.content
              ? <p className="text-[12px] text-red-500">{errors.content}</p>
              : <span />
            }
            <p className="text-[12px] text-[#bbb] ml-auto">{content.length} / 1,000</p>
          </div>
        </section>

        {/* ── 사진 첨부 ──────────────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-bold text-[#333]">사진 첨부</p>
            <p className="text-[12px] text-[#bbb]">전체 {totalMediaCount} / {TOTAL_MEDIA_MAX_COUNT}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* 추가 버튼 */}
            {totalMediaCount < TOTAL_MEDIA_MAX_COUNT && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-20 h-20 rounded-[14px] border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#FCFBF9] hover:border-[#3ea76e] hover:bg-[#f0faf5] transition-colors"
              >
                <Camera className="w-5 h-5 text-[#bbb]" strokeWidth={1.5} />
                <span className="text-[11px] text-[#bbb]">사진 추가</span>
              </button>
            )}

            {/* 썸네일 목록 */}
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-[14px] overflow-hidden border border-[#eee]">
                <img src={img.previewUrl} alt={`리뷰 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center cursor-pointer border-none p-0"
                >
                  <X className="w-3 h-3 text-white" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[12px] text-[#bbb] mt-3">
            JPG · PNG · WEBP 형식, 장당 최대 50MB, 사진/동영상 합산 최대 5개
          </p>
          {errors.media && (
            <p className="text-[12px] text-red-500 mt-2">{errors.media}</p>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </section>

        {/* ── 동영상 첨부 ────────────────────────────────────── */}
        <section className="bg-white rounded-[24px] p-6 border border-[#eee]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-bold text-[#333]">동영상 첨부</p>
            <p className="text-[12px] text-[#bbb]">{video ? `1 / 1 · 전체 ${totalMediaCount} / ${TOTAL_MEDIA_MAX_COUNT}` : `0 / 1 · 전체 ${totalMediaCount} / ${TOTAL_MEDIA_MAX_COUNT}`}</p>
          </div>

          {!video ? (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={totalMediaCount >= TOTAL_MEDIA_MAX_COUNT}
              className="w-full h-28 rounded-[16px] border-2 border-dashed border-[#ddd] flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#FCFBF9] hover:border-[#3ea76e] hover:bg-[#f0faf5] transition-colors"
            >
              <Video className="w-7 h-7 text-[#bbb]" strokeWidth={1.5} />
              <span className="text-[13px] text-[#bbb] font-medium">동영상 추가하기</span>
              <span className="text-[11px] text-[#ccc]">MP4 · MOV · AVI · WEBM, 최대 50MB</span>
            </button>
          ) : (
            <div className="relative rounded-[16px] overflow-hidden border border-[#eee] bg-black">
              <video
                src={video.previewUrl}
                className="w-full max-h-52 object-contain"
                controls
                preload="metadata"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center cursor-pointer border-none p-0"
              >
                <X className="w-4 h-4 text-white" strokeWidth={3} />
              </button>
              <div className="p-3">
                <p className="text-[12px] text-white/70 truncate">{video.file.name}</p>
                <p className="text-[11px] text-white/50 mt-0.5">
                  {(video.file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
          )}

          {errors.video && (
            <p className="text-[12px] text-red-500 mt-2">{errors.video}</p>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/avi,video/webm"
            className="hidden"
            onChange={handleVideoChange}
          />
        </section>

        {/* ── 제출 오류 ──────────────────────────────────────── */}
        {errors.submit && (
          <p className="text-[13px] text-red-500 text-center">{errors.submit}</p>
        )}

        {/* ── 버튼 ───────────────────────────────────────────── */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => !previewOnly && navigate(-1)}
            className="btn-ghost flex-1 py-4 text-[15px]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary flex-[2] py-4 text-[15px] disabled:opacity-50"
          >
            {isLoading ? '등록 중...' : '리뷰 등록하기'}
          </button>
        </div>

      </main>

    </div>
  )
}
