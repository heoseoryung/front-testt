import { Link } from 'react-router-dom'
import { useGetBrandStoryQuery } from '@/api/searchApi'

export default function BrandStory() {
  const { data: brandStory } = useGetBrandStoryQuery()
  const mainCard = brandStory?.mainCard ?? null

  const to = mainCard?.buttonUrl?.startsWith('http') ? null : (mainCard?.buttonUrl ?? '/brand-story')

  return (
    <Link to="/brand-story" className="block bg-white mb-4 group w-full">
      <div className="relative w-full aspect-[4/3] lg:aspect-[5/2] rounded-[28px] overflow-hidden mb-8 bg-gradient-to-br from-[#1a3d2b] via-[#256641] to-[#3ea76e]">
        {mainCard?.imageUrl ? (
          <img
            src={mainCard.imageUrl}
            alt="브랜드 스토리"
            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_80%,_#ffffff_1px,_transparent_1px),radial-gradient(circle_at_80%_20%,_#ffffff_1px,_transparent_1px)] [background-size:40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-end">
              <p className="text-[#a8e6c4] text-[13px] font-semibold tracking-[0.2em] uppercase mb-3 opacity-90">
                Our Story
              </p>
              <h2 className="text-white text-[40px] md:text-[60px] font-black italic leading-[1.05] tracking-tighter opacity-95">
                BRAND<br />STORY
              </h2>
              <p className="text-white/70 text-[14px] font-medium mt-4 tracking-tight leading-relaxed max-w-[360px]">
                한결같이 나를 바라봐주는 존재에게<br />
                내가 줄 수 있는 최고의 것을
              </p>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
      </div>

      <div className="px-1">
        <h3 className="text-[20px] font-black text-[#111111] tracking-tighter mb-2">
          반려동물과의 행복한 교감, eum
        </h3>
        <p className="text-[14px] text-[#888888] leading-relaxed tracking-tight mb-6">
          한결같이 나를 바라봐주는 존재에게<br />
          내가 줄 수 있는 최고의 것을 주고 싶다는 마음으로
        </p>
        <div className="w-full py-3.5 border border-[#e0e0e0] rounded-[14px] text-center text-[14px] font-semibold text-[#555555] tracking-tight group-hover:border-[#3ea76e] group-hover:text-[#3ea76e] transition-colors duration-300">
          {mainCard?.buttonText ?? '브랜드 스토리 보기'}
        </div>
      </div>
    </Link>
  )
}
