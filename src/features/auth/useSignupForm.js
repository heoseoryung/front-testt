import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignupMutation, useGetTermsQuery } from '@/api/authApi'
import useAuth from './useAuth'

export default function useSignupForm() {
  const navigate = useNavigate()

  const [formData, setFormData]             = useState({ username: '', email: '', password: '', name: '', phoneNumber: '' })
  const [showPassword, setShowPassword]     = useState(false)
  const [emailVerified, setEmailVerified]   = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [termsAgreed, setTermsAgreed]       = useState({})
  const [viewingTerm, setViewingTerm]       = useState(null)
  const [error, setError]                   = useState('')

  const { isLoggedIn }                                     = useAuth()
  const { data: termsData, isLoading: termsLoading }       = useGetTermsQuery()
  const [signup, { isLoading: isSigningUp }]               = useSignupMutation()

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true })
  }, [isLoggedIn])

  const terms       = termsData?.terms ?? []
  const allChecked  = terms.length > 0 && terms.every(t => termsAgreed[t.id])
  const someChecked = terms.some(t => termsAgreed[t.id])

  const handleEmailVerified = (email) => {
    setFormData(prev => ({ ...prev, email }))
    setEmailVerified(true)
  }

  const handleAllAgree = (checked) => {
    const next = {}
    terms.forEach(t => { next[t.id] = checked })
    setTermsAgreed(next)
  }

  const handleTermToggle = (id) => {
    setTermsAgreed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSubmit = async () => {
    setError('')

    if (!emailVerified) {
      setError('이메일 인증을 완료해 주세요.')
      return
    }
    if (!formData.username || !formData.name || !formData.password || !formData.phoneNumber) {
      setError('모든 필수 항목을 입력해 주세요.')
      return
    }

    const requiredTerms     = terms.filter(t => t.required)
    const allRequiredAgreed = requiredTerms.every(t => termsAgreed[t.id])
    if (!allRequiredAgreed) {
      setError('필수 약관에 모두 동의해야 합니다.')
      return
    }

    const termsPayload = {}
    terms.forEach(t => { termsPayload[t.id] = !!termsAgreed[t.id] })

    try {
      await signup({ ...formData, termsAgreed: termsPayload }).unwrap()
      navigate('/login', { state: { fromSignup: true } })
    } catch (err) {
      const errors = err?.data?.errors
      if (errors) {
        setError(Object.values(errors).join(' '))
      } else {
        setError(err?.data?.message || '회원가입 중 오류가 발생했습니다.')
      }
    }
  }

  return {
    formData, setFormData,
    showPassword, setShowPassword,
    emailVerified,
    showEmailModal, setShowEmailModal,
    termsAgreed,
    viewingTerm, setViewingTerm,
    error,
    terms,
    termsLoading,
    allChecked,
    someChecked,
    isSigningUp,
    handleEmailVerified,
    handleAllAgree,
    handleTermToggle,
    handleSubmit,
  }
}
