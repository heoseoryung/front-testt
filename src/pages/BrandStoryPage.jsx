import { Link } from 'react-router-dom'
import { BRAND_NAME } from '@/shared/utils/constants'
import { useGetBrandStoryDetailQuery } from '@/api/searchApi'
import Spinner from '@/shared/components/Spinner'

export default function BrandStoryPage() {
  const { data: detailCards = [], isLoading } = useGetBrandStoryDetailQuery()

  if (isLoading) return <Spinner fullscreen />

  const sortedCards = [...detailCards].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  const [firstImg, secondImg] = sortedCards

  return (
    <div className="bg-[#FCFBF9] min-h-screen">
      <main className="w-full">

        {/* 첫 번째 상세 이미지 */}
        {firstImg && (
          <section className="w-full">
            <img
              src={firstImg.imageUrl}
              alt="브랜드 스토리 1"
              className="w-full h-auto block"
            />
          </section>
        )}

        {/* 텍스트 섹션 1 */}
        <section className="border-b border-[#f4f4f4]">
          <div className="px-6 py-12 md:px-10 md:py-16 max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <span className="text-6xl absolute -top-10 -left-1 font-serif text-[#3ea76e] opacity-30">"</span>
              <h2 className="text-2xl font-bold leading-tight relative text-[#3ea76e]">
                행복은 어디서 올까요?
              </h2>
            </div>

            <div className="space-y-6 text-[#555] leading-relaxed text-[15px]">
              <p>
                제가 아는 행복은 대부분 관계에서 오는 것 같습니다.<br />
                내가 사랑하고 나를 사랑해주는 가족, 마음이 통하는 친구,<br />
                함께 일하면 즐거운 직장 동료들...<br />
                이런 다양한 관계의 소소한 교감들이 쌓여서 행복이 만들어지는 것이지요.<br />
                그래서 반려동물은 어쩌면 우리에게 사람만큼,<br />
                때로는 그 보다 더 많은 행복을 주는 존재인 것 같습니다.<br />
                우리의 존재를 판단하지 않고 한결 같이 바라봐주는 존재가 세상에 또 있을까요?
              </p>

              <div className="w-20 h-0.5 bg-[#3ea76e]"></div>

              <p className="text-[14px] opacity-80">
                For me, happiness comes from relationships<br />
                family, friends, and colleagues who share life's little moments.<br />
                Pets, too, give us as much comfort and joy as people do. sometimes even more.<br />
                After all, who else loves us unconditionally, without judgment?
              </p>
            </div>
          </div>
        </section>

        {/* 두 번째 상세 이미지 */}
        {secondImg && (
          <section className="w-full">
            <img
              src={secondImg.imageUrl}
              alt="브랜드 스토리 2"
              className="w-full h-auto block"
            />
          </section>
        )}

        {/* 텍스트 섹션 2 */}
        <section>
          <div className="px-6 py-12 md:px-10 md:py-16 max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <span className="text-6xl absolute -top-10 -left-1 font-serif text-[#3ea76e] opacity-30">"</span>
              <h2 className="text-2xl font-bold leading-tight relative text-[#3ea76e]">
                {BRAND_NAME}는
              </h2>
            </div>

            <div className="space-y-6 text-[#555] leading-relaxed text-[15px]">
              <p>
                {BRAND_NAME}는 이런 반려동물 친구들과 매일매일<br />
                행복한 교감을 만들어 나가기 위해 만들어졌습니다.<br />
                한결 같이 나를 바라봐주는 존재에게 내가 할 수 있는<br />
                최고의 것을 주고 싶다는 마음이 바로 {BRAND_NAME}의 시작입니다.<br />
                반려동물의 라이프스타일 전반을 지향하는 {BRAND_NAME}가<br />
                첫 번째 제품 카테고리로 먹거리를 선택한 것도 먹는 즐거움이<br />
                서로간의 교감을 나눌 수 있는 가장 좋은 방법이기 때문입니다.<br />
                그래서 {BRAND_NAME}의 메뉴는 우리 반려동물 친구를 위해<br />
                내가 직접 집에서 만들어줄 수 있는 요리로 만들었습니다.<br />
                건강하고 맛있는 {BRAND_NAME} 제품들 덕분에<br />
                우리 반려동물 친구들에게 근사한 다이닝을 대접해주세요.<br />
                맛있게 먹는 반려동물 친구들을 보면 바쁘고 정신없는 일상 중이라도<br />
                소소한 여유와 행복을 느끼실 수 있을 거예요.
              </p>
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/product/list"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#3ea76e] text-white font-medium hover:bg-[#318a57] hover:scale-105 transition-all"
              >
                더 많은 제품 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
