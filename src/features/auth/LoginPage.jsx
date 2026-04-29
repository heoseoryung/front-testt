import { Link, useNavigate } from 'react-router-dom'
import { BRAND_NAME } from '@/shared/utils/constants'
import { Mail, Lock, Eye, EyeOff, X, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react'
import useLoginForm from './useLoginForm'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const {
    formData, setFormData,
    showPassword, setShowPassword,
    error,
    isLoading,
    fromSignup,
    handleLogin,
    handleKeyDown,
    startSocialLogin,
  } = useLoginForm()

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">

      {/* 왼쪽 배너 */}
      <div className="hidden lg:flex flex-[1.1] relative items-center justify-center p-20 bg-[#3ea76e] overflow-hidden">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20 z-20"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          <div className="text-left">
            <div className="text-white text-4xl font-black tracking-[-0.08em] select-none mb-24">
              eum<span className="text-xs align-top ml-0.5 opacity-70 italic font-black">®</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-[64px] font-black text-white leading-[1.05] tracking-[-0.05em]">
                말하지 않아도 <br />
                <span className="text-[#1B4332]">전해지는 진심.</span>
              </h1>
              <p className="text-[18px] text-white/70 font-bold tracking-tight max-w-xs leading-relaxed">
                {BRAND_NAME}와 함께 만드는 <br /> 우리 아이와의 깊은 기록.
              </p>
            </div>
          </div>
          <div className="relative self-end mb-10 mr-[-5%]">
            <img src="/dog.png" alt="eum Dog" className="w-[440px] h-auto rounded-[48px] rotate-[-4deg] drop-shadow-[0_45px_45px_rgba(0,0,0,0.3)]" />
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 bg-[#FCFBF9] flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[420px]">

          <div className="mb-10">
            <h2 className="text-[48px] font-black text-[#1B4332] tracking-[-0.07em] leading-none mb-3">Login</h2>
            <div className="h-1.5 w-12 bg-[#3ea76e] rounded-full" />
          </div>

          {fromSignup && (
            <div className="flex items-center gap-3 px-5 py-4 bg-[#f0faf4] border border-[#b6e8cc] rounded-2xl mb-6">
              <CheckCircle size={18} className="text-[#3ea76e] shrink-0" />
              <div>
                <p className="text-[14px] font-black text-[#1B4332]">회원가입이 완료됐어요!</p>
                <p className="text-[12px] font-medium text-[#3ea76e] mt-0.5">가입하신 계정으로 로그인해 주세요.</p>
              </div>
            </div>
          )}

          <div className="w-full space-y-4">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bbb] group-focus-within:text-[#3ea76e] transition-colors" size={17} />
              <input
                type="text"
                placeholder="아이디를 입력해주세요"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full h-14 pl-12 pr-6 bg-white border border-[#eee] rounded-2xl text-[14px] font-bold tracking-tight outline-none transition-all placeholder:text-[#ccc] text-[#111] focus:border-[#3ea76e] focus:shadow-sm"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bbb] group-focus-within:text-[#3ea76e] transition-colors" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력해주세요"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full h-14 pl-12 pr-12 bg-white border border-[#eee] rounded-2xl text-[14px] font-bold tracking-tight outline-none transition-all placeholder:text-[#ccc] text-[#111] focus:border-[#3ea76e] focus:shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#3ea76e] cursor-pointer bg-transparent border-none transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-2xl">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <p className="text-[13px] font-bold text-red-500">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-[#3ea76e] text-white font-black text-[15px] tracking-tight hover:bg-[#318a57] transition-all active:scale-[0.98] cursor-pointer border-none disabled:bg-[#eee] disabled:text-[#ccc] disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : `${BRAND_NAME} 시작하기`}
            </button>
          </div>

          <div className="mt-8 mb-10 flex justify-center gap-8 text-[#888] font-bold text-[13px] tracking-tight">
            <Link to="/signup" className="hover:text-[#3ea76e] transition-colors">회원가입</Link>
            <span className="text-[#eee] font-light text-base">|</span>
            <button className="hover:text-[#3ea76e] transition-colors cursor-pointer text-[#888] font-bold text-[13px] tracking-tight bg-transparent border-none">
              비밀번호 찾기
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-[#eee]"></div>
              <span className="flex-shrink mx-4 text-[11px] font-bold text-[#bbb] tracking-[0.15em]">간편 로그인</span>
              <div className="flex-grow border-t border-[#eee]"></div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => startSocialLogin('google')}
                className="w-full h-14 bg-white border border-[#eee] text-[#111] rounded-2xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-3 hover:bg-[#f9f9f9] transition-all cursor-pointer"
              >
                <GoogleIcon /> 구글 계정으로 로그인
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startSocialLogin('kakao')}
                  className="h-14 rounded-2xl bg-[#FEE500] text-[#191919] flex items-center justify-center gap-2 font-bold text-[14px] tracking-tight hover:brightness-95 transition-all cursor-pointer border-none"
                >
                  <MessageCircle size={17} fill="currentColor" /> 카카오
                </button>
                <button
                  type="button"
                  onClick={() => startSocialLogin('naver')}
                  className="h-14 rounded-2xl bg-[#03C75A] text-white flex items-center justify-center gap-2 font-bold text-[14px] tracking-tight hover:brightness-95 transition-all cursor-pointer border-none"
                >
                  <span className="italic text-base font-black pr-1">N</span> 네이버
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
