import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useGetMeQuery, useLogoutMutation } from '@/api/authApi'
import { useUpdateProfileMutation, useDeleteAccountMutation } from '@/api/userApi'
import Spinner from '@/shared/components/Spinner'

const EumInput = ({ label, readOnly, ...props }) => (
  <div className="flex items-center border-b border-[#ececec] py-6 last:border-none">
    <p className="w-36 text-[13px] font-black text-[#bbb] shrink-0">{label}</p>
    <input
      {...props}
      readOnly={readOnly}
      className={`flex-1 bg-transparent outline-none text-[15px] font-bold tracking-tight transition-all placeholder:text-[#ccc] ${
        readOnly
          ? 'text-[#ccc] cursor-default'
          : 'text-[#111] focus:text-[#3ea76e]'
      }`}
    />
  </div>
)

export default function ProfileModifyPage() {
  const navigate = useNavigate()
  const { data: me, isLoading } = useGetMeQuery()
  const [updateProfile,  { isLoading: isSaving }]   = useUpdateProfileMutation()
  const [deleteAccount,  { isLoading: isDeleting }]  = useDeleteAccountMutation()
  const [logoutMutation]                             = useLogoutMutation()

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    smsAllowed: false,
    emailAllowed: false,
  })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword]   = useState('')
  const [deleteError, setDeleteError]         = useState('')

  const isSocialAccount = !!me?.profileImgUrl && !me?.updatedAt

  const handleDelete = async () => {
    setDeleteError('')
    try {
      await deleteAccount(deletePassword ? { password: deletePassword } : {}).unwrap()
      await logoutMutation()
      navigate('/')
    } catch (err) {
      setDeleteError(err?.data?.message || '탈퇴 처리 중 오류가 발생했습니다.')
    }
  }

  // me 데이터가 로드되면 폼 초기화
  useEffect(() => {
    if (me) {
      setForm(prev => ({
        ...prev,
        name:        me.name        ?? '',
        phoneNumber: me.phoneNumber ?? '',
        smsAllowed:  me.smsAllowed  ?? false,
        emailAllowed: me.emailAllowed ?? false,
      }))
    }
  }, [me])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    setError('')
    setSuccess(false)

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (form.newPassword && !form.currentPassword) {
      setError('현재 비밀번호를 입력해 주세요.')
      return
    }

    const body = {
      name:        form.name,
      phoneNumber: form.phoneNumber,
      email:       me?.email ?? '',
      marketingConsent: {
        smsAllowed:   form.smsAllowed,
        emailAllowed: form.emailAllowed,
      },
    }

    if (form.currentPassword) {
      body.currentPassword = form.currentPassword
      body.newPassword     = form.newPassword
      body.confirmPassword = form.confirmPassword
    }

    try {
      await updateProfile(body).unwrap()
      setSuccess(true)
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (err) {
      const errors = err?.data?.errors
      if (errors) {
        setError(Object.values(errors).join(' '))
      } else {
        setError(err?.data?.message || '저장 중 오류가 발생했습니다.')
      }
    }
  }

  if (isLoading) return <Spinner fullscreen />

  return (
    <div className="bg-[#FCFBF9] min-h-screen text-[#111]">
      <main className="max-w-[860px] mx-auto px-6 pb-28">

        <div className="text-center py-24">
          <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">회원 정보 수정</h1>
        </div>

        {/* 로그인 보안 */}
        <section className="bg-white rounded-[40px] border border-[#eee] px-10 pb-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-8">
          <div className="py-12">
            <h3 className="text-[18px] font-black text-[#111] tracking-tight text-center">로그인 보안</h3>
          </div>

          <div className="bg-[#f7f7f7] px-8 rounded-[24px] border border-[#efefef]">
            <EumInput
              label="이메일"
              value={me?.email ?? ''}
              readOnly
              placeholder="이메일"
            />
            <EumInput
              label="현재 비밀번호"
              type="password"
              placeholder="현재 비밀번호 입력"
              value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
            />
            <EumInput
              label="새 비밀번호"
              type="password"
              placeholder="8~20자, 대소문자+숫자+특수문자"
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
            />
            <EumInput
              label="비밀번호 확인"
              type="password"
              placeholder="새 비밀번호 재입력"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
            />
          </div>
        </section>

        {/* 사용자 정보 */}
        <section className="bg-white rounded-[40px] border border-[#eee] px-10 pb-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-8">
          <div className="py-12">
            <h3 className="text-[18px] font-black text-[#111] tracking-tight text-center">사용자 정보</h3>
          </div>
          <div className="bg-[#f7f7f7] px-8 rounded-[24px] border border-[#efefef]">
            <EumInput
              label="이름"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="이름을 입력해주세요"
            />
            <EumInput
              label="휴대폰 번호"
              type="tel"
              value={form.phoneNumber}
              onChange={e => set('phoneNumber', e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </section>

        {/* 마케팅 동의 */}
        <section className="bg-white rounded-[40px] border border-[#eee] px-10 pb-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-12">
          <div className="py-12">
            <h3 className="text-[18px] font-black text-[#111] tracking-tight text-center">마케팅 정보 수신 동의</h3>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'SMS 문자 수신', key: 'smsAllowed' },
              { label: '이메일 수신', key: 'emailAllowed' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 bg-[#f7f7f7] border border-[#efefef] px-6 py-5 rounded-2xl flex-1 transition-all">
                <span className="text-[14px] font-black text-[#444]">{item.label}</span>
                <button
                  type="button"
                  onClick={() => set(item.key, !form[item.key])}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer border-none flex items-center ${form[item.key] ? 'bg-[#3ea76e]' : 'bg-[#ccc]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${form[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 에러 / 성공 메시지 */}
        {error && (
          <div className="flex items-center gap-2 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl mb-6">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-[13px] font-bold text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-5 py-4 bg-[#f0faf4] border border-[#b6e8cc] rounded-2xl mb-6">
            <CheckCircle size={16} className="text-[#3ea76e] shrink-0" />
            <p className="text-[13px] font-bold text-[#1B4332]">변경 내용이 저장되었습니다.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-[420px] mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full h-16 bg-[#3ea76e] text-white rounded-full text-[17px] font-black hover:bg-[#318a57] border-none cursor-pointer shadow-lg shadow-[#3ea76e]/10 transition-all active:scale-[0.97] disabled:bg-[#eee] disabled:text-[#ccc] disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '변경 내용 저장하기'}
          </button>
          <Link to="/mypage" className="w-full h-16 flex items-center justify-center bg-[#f7f7f7] border border-[#eee] text-[#aaa] rounded-full text-[15px] font-bold hover:bg-[#efefef] hover:text-[#888] transition-all">
            취소
          </Link>
        </div>

        <div className="mt-20 text-center">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-[12px] font-bold text-[#ccc] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer underline underline-offset-4"
          >
            회원 탈퇴하기
          </button>
        </div>

      </main>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[420px] mx-4 p-10">
            <h2 className="text-[20px] font-black text-[#111] text-center mb-3 tracking-tight">정말 탈퇴하시겠어요?</h2>
            <p className="text-[13px] font-bold text-[#aaa] text-center mb-8 leading-relaxed">
              탈퇴 시 모든 주문 내역, 적립금, 쿠폰이<br />삭제되며 복구할 수 없습니다.
            </p>

            {!isSocialAccount && (
              <div className="bg-[#f7f7f7] border border-[#efefef] rounded-2xl px-5 py-4 mb-4">
                <input
                  type="password"
                  placeholder="현재 비밀번호를 입력해 주세요"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-[14px] font-bold text-[#111] placeholder:text-[#ccc]"
                />
              </div>
            )}

            {deleteError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-4">
                <p className="text-[12px] font-bold text-red-500">{deleteError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full h-14 bg-red-500 text-white rounded-full text-[15px] font-black hover:bg-red-600 border-none cursor-pointer transition-all active:scale-[0.97] disabled:bg-[#eee] disabled:text-[#ccc] disabled:cursor-not-allowed"
              >
                {isDeleting ? '처리 중...' : '탈퇴하기'}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError('') }}
                className="w-full h-14 bg-[#f7f7f7] border border-[#eee] text-[#aaa] rounded-full text-[15px] font-bold hover:bg-[#efefef] hover:text-[#888] transition-all border-none cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
