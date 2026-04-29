import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useGetProfileQuery } from '@/api/userApi'
import { useLogoutMutation } from '@/api/authApi'
import Spinner from '@/shared/components/Spinner'

export default function UserProfilePage() {
  const { data: profile, isLoading, isError } = useGetProfileQuery()
  const [logoutMutation] = useLogoutMutation()

  const menuItems = [
    { title: '회원정보', to: '/profile/modify' },
    { title: '관심상품', count: profile?.activityCounts?.wishlistCount, to: '/wishlist' },
    { title: '게시물관리', count: profile?.activityCounts?.postCount, to: '/profile/posts' },
    { title: '배송 주소록 관리', to: '/address' },
  ]

  if (isLoading) return <Spinner fullscreen />

  if (isError) {
    return (
      <div className="bg-[#FCFBF9] min-h-screen flex items-center justify-center">
        <p className="text-[#bbb] font-bold">프로필 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FCFBF9] min-h-screen text-[#111]">
      <main className="max-w-[1000px] mx-auto px-6 pb-28">

        <div className="max-w-[1200px] mx-auto text-center py-24">
          <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">마이페이지</h1>
        </div>

        <section className="bg-white rounded-[40px] border border-[#eee] p-10 mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mx-20">
          <div className="flex flex-row items-center gap-6">
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#f0faf4] flex items-center justify-center shrink-0">
              {profile?.userSummary?.profileImgUrl ? (
                <img
                  src={profile.userSummary.profileImgUrl}
                  alt={profile.userSummary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[36px] font-black text-[#3ea76e] leading-none">
                  {profile?.userSummary?.name?.[0] ?? '?'}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between flex-1">
              <div className="text-left">
                {profile?.userSummary?.membershipLevel && (
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-[#f0faf4] text-[#3ea76e] mb-2 tracking-widest">
                    {profile.userSummary.membershipLevel}
                  </span>
                )}
                <h2 className="text-[26px] font-black tracking-tight text-[#111]">
                  {profile?.userSummary?.greetingMessage ?? `${profile?.userSummary?.name ?? '회원'}님, 안녕하세요!`}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#bbb] mb-2 tracking-widest">주문내역</p>
                <p className="text-[26px] font-black text-[#111]">
                  {profile?.benefits?.orderTotalCount != null ? `${profile.benefits.orderTotalCount}건` : '-'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[40px] border border-[#eee] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] mx-8">
          <div className="px-10 py-7 border-b border-[#f5f5f5]">
            <h3 className="text-[15px] font-bold text-[#bbb]">계정 및 서비스 관리</h3>
          </div>
          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="flex justify-between items-center py-6 px-10 border-b border-[#f9f9f9] last:border-none hover:bg-[#fafafa] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black text-[#111] group-hover:text-[#3ea76e] transition-colors">
                  {item.title}
                </span>
                {item.count != null && (
                  <span className="text-[12px] font-black text-[#3ea76e] bg-[#f0faf4] px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </div>
              <ChevronRight size={15} className="text-[#ddd] group-hover:text-[#3ea76e] transition-all group-hover:translate-x-1" />
            </Link>
          ))}
        </section>

        <div className="mt-8 text-center">
          <button
            onClick={() => logoutMutation()}
            className="text-[13px] font-bold text-[#bbb] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            로그아웃
          </button>
        </div>

      </main>
    </div>
  )
}
