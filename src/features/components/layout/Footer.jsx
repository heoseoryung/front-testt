import { Link } from 'react-router-dom'
import { BRAND_COMPANY } from '@/shared/utils/constants'

export default function Footer() {
  return (
    <footer className="w-full bg-white px-6 py-12 border-t border-[#eee]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <p className="text-[12px] font-bold text-[#aaa] mb-1 tracking-wider">CUSTOMER CENTER</p>
            <div className="flex flex-col md:flex-row md:items-baseline gap-x-4">
              <p className="text-[28px] font-black text-[#222] tracking-tighter">032-212-2202</p>
              <p className="text-[14px] text-[#666] font-medium">
                평일 10:00 - 18:00 <span className="text-[#ccc] mx-1">/</span> 점심 13:00 - 14:00
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            {[
              { label: 'INSTAGRAM', href: 'https://www.instagram.com/eum.co.kr/' },
              { label: 'YOUTUBE', href: 'https://www.youtube.com/@eum' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-[#333] hover:text-[#3ea76e] transition-colors border-b border-transparent hover:border-[#3ea76e] pb-0.5"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <hr className="border-[#f5f5f5] mb-10" />

        <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#888] max-w-[1000px] leading-relaxed">
            {[
              ['COMPANY', BRAND_COMPANY],
              ['CEO', '김정환, 임진범'],
              ['BUSINESS NO.', '707-86-02078'],
              ['REPORT NO.', '2023-인천서구-1429호'],
              ['PRIVACY MANAGER', '임진범'],
              ['ADDRESS', '22664 인천광역시 서구 보듬로 158 (오류동) 공존동 4층 430호'],
              ['E-MAIL', 'eum@eum.co.kr'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-bold text-[#666] shrink-0">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-5 shrink-0">
            <Link
              to="/terms"
              className="text-[12px] font-bold text-[#555] hover:text-[#3ea76e] transition-colors no-underline"
            >
              이용약관
            </Link>
            <Link
              to="/privacy"
              className="text-[12px] font-bold text-[#555] hover:text-[#3ea76e] transition-colors no-underline"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#f9f9f9] flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[11px] text-[#ccc] tracking-wide">Copyright © {BRAND_COMPANY} All rights Reserved.</p>
          <p className="text-[11px] text-[#eee]">Designed by hosting by cafe24</p>
        </div>
      </div>
    </footer>
  )
}
