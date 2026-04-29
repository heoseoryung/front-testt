import { useState, useRef, useEffect } from 'react'
import { BRAND_NAME } from '@/shared/utils/constants'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Headphones, MessageSquare, Info,
  Bot, Send, FileText, RotateCcw,
} from 'lucide-react'
import { useRagChatMutation, useGetSessionHistoryQuery } from '@/api/ragApi'

const ERROR_MESSAGES = {
  'AI-429': 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'LLM-502': 'AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  'EMB-502': '질문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
}
const DEFAULT_ERROR = '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'

const CSPage = () => {
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [showRestore, setShowRestore] = useState(false)
  const [restoreInput, setRestoreInput] = useState('')
  const [restoreQueryId, setRestoreQueryId] = useState(null)
  const bottomRef = useRef(null)

  const [ragChat, { isLoading }] = useRagChatMutation()
  const { data: historyData } = useGetSessionHistoryQuery(restoreQueryId, { skip: !restoreQueryId })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!historyData) return
    setSessionId(historyData.sessionId)
    setMessages(
      (historyData.messages ?? []).map((m) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        text: m.content,
      }))
    )
    setRestoreQueryId(null)
    setRestoreInput('')
    setShowRestore(false)
  }, [historyData])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    try {
      const { sessionId: newSessionId, answer, sources } = await ragChat({ sessionId, question }).unwrap()
      setSessionId(newSessionId)
      setMessages((prev) => [...prev, { role: 'assistant', text: answer, sources: sources ?? [] }])
    } catch (err) {
      const code = err?.data?.code
      setMessages((prev) => [...prev, { role: 'assistant', text: ERROR_MESSAGES[code] ?? DEFAULT_ERROR }])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleRestore = () => {
    const id = restoreInput.trim()
    if (!id) return
    setRestoreQueryId(id)
  }

  const handleResetChat = () => {
    setMessages([])
    setSessionId(null)
    setInput('')
  }

  return (
    <div className="w-full bg-[#FCFBF9] text-[#111] pb-28 px-4 min-h-screen">
      <div className="max-w-[1200px] mx-auto text-center py-24">
        <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">고객센터</h1>
      </div>

      <div className="max-w-[860px] mx-auto">

        {/* 전화 상담 */}
        <div className="bg-white rounded-[40px] border border-[#eee] p-10 md:p-14 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-all mb-8">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
              <Headphones size={18} className="text-[#3ea76e]" strokeWidth={2.5} />
              <h2 className="text-[#3ea76e] text-[13px] font-black uppercase tracking-widest">고객센터</h2>
            </div>
            <div className="text-[40px] md:text-[52px] font-black mb-8 tracking-[-0.06em] leading-none text-center md:text-left text-[#111]">
              032-212-2202
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center md:justify-start text-[#888] text-[15px] font-bold tracking-tight">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#3ea76e] rounded-full"></span>
                평일 10:00 — 18:00
              </span>
              <span className="hidden md:block text-[#eee]">|</span>
              <span className="text-[#bbb]">점심 13:00 — 14:00</span>
            </div>
          </div>
        </div>

        {/* AI 채팅 상담 */}
        <div className="bg-white rounded-[40px] border border-[#eee] shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-8 overflow-hidden">
          {/* 헤더 */}
          <div className="p-8 md:p-10 border-b border-[#eee] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-[#3ea76e]" strokeWidth={2.5} />
                <h2 className="text-[#3ea76e] text-[13px] font-black uppercase tracking-widest">AI 상담</h2>
              </div>
              <p className="text-[15px] font-bold text-[#888] tracking-tight">{BRAND_NAME} AI가 궁금하신 점을 도와드립니다.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRestore((v) => !v)}
                className={`text-[12px] font-black px-3 py-1.5 rounded-xl transition-colors ${
                  showRestore ? 'bg-[#f0faf4] text-[#3ea76e]' : 'text-[#888] hover:bg-[#f9f9f9]'
                }`}
              >
                대화 복원
              </button>
              <button
                onClick={handleResetChat}
                className="p-2 rounded-xl hover:bg-[#f9f9f9] transition-colors"
                title="대화 초기화"
              >
                <RotateCcw size={15} className="text-[#bbb]" />
              </button>
            </div>
          </div>

          {/* 세션 복원 패널 */}
          {showRestore && (
            <div className="px-8 py-4 border-b border-[#eee] bg-[#fafafa]">
              {sessionId && (
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#bbb]">현재 세션</span>
                  <span className="text-[11px] font-black text-[#888] bg-[#f0faf4] px-2 py-0.5 rounded-lg break-all">{sessionId}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRestore()}
                  placeholder="복원할 세션 ID를 입력하세요..."
                  className="flex-1 px-4 py-2.5 bg-white border border-[#eee] rounded-[16px] text-[13px] font-bold text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#3ea76e]"
                />
                <button
                  onClick={handleRestore}
                  disabled={!restoreInput.trim()}
                  className="px-4 py-2.5 bg-[#3ea76e] text-white text-[13px] font-black rounded-[16px] disabled:opacity-40 hover:bg-[#35966a] transition-colors whitespace-nowrap"
                >
                  복원
                </button>
              </div>
            </div>
          )}

          {/* 메시지 영역 */}
          <div className="h-[420px] overflow-y-auto p-6 flex flex-col gap-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-[13px] font-bold text-[#ccc] tracking-tight">질문을 입력해 주세요.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] px-5 py-3 rounded-[20px] text-[14px] font-bold leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#3ea76e] text-white rounded-br-sm'
                    : 'bg-[#f9f9f9] text-[#333] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.sources?.length > 0 && (
                  <div className="max-w-[80%] flex flex-col gap-1.5">
                    {msg.sources.map((src, si) => (
                      <div key={si} className="flex items-start gap-2 px-3 py-2 bg-[#f0faf4] rounded-2xl border border-[#d4eddf]">
                        <FileText size={12} className="text-[#3ea76e] mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-black text-[#3ea76e] block mb-0.5">{src.filename}</span>
                          <span className="text-[11px] font-bold text-[#888] leading-relaxed">{src.snippet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="px-5 py-3 bg-[#f9f9f9] rounded-[20px] rounded-bl-sm">
                  <span className="text-[14px] font-bold text-[#bbb]">답변 생성 중...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 md:p-6 border-t border-[#eee] flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-5 py-3.5 bg-[#f9f9f9] rounded-[20px] text-[14px] font-bold text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#3ea76e] disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-full bg-[#3ea76e] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#35966a] active:bg-[#2d8560] transition-colors shrink-0"
            >
              <Send size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* 커뮤니티 */}
        <div className="mt-16">
          <div className="flex items-center gap-6 mb-10">
            <h2 className="text-[20px] font-black text-[#111] tracking-tight shrink-0">커뮤니티</h2>
            <div className="h-[1px] w-full bg-[#eee]"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { title: 'NOTICE', link: '/notice', icon: <Info size={20} className="text-[#ccc] group-hover:text-[#3ea76e] transition-colors" />, desc: `${BRAND_NAME}의 새로운 소식을 확인하세요.` },
              { title: 'FAQ', link: '/faq', icon: <MessageSquare size={20} className="text-[#ccc] group-hover:text-[#3ea76e] transition-colors" />, desc: '자주 묻는 질문들을 모아두었습니다.' },
            ].map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="flex items-center justify-between p-8 bg-white border border-[#eee] rounded-[32px] hover:border-[#3ea76e] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] transition-all group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="p-2.5 bg-[#f9f9f9] rounded-2xl group-hover:bg-[#f0faf4] transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-[18px] font-black tracking-tight group-hover:text-[#3ea76e] transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-[#bbb] group-hover:text-[#888] transition-colors tracking-tight pl-[52px]">
                    {item.desc}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#f9f9f9] flex items-center justify-center group-hover:bg-[#3ea76e] group-hover:text-white transition-all border border-[#eee] shrink-0">
                  <ChevronRight size={20} strokeWidth={2.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CSPage
