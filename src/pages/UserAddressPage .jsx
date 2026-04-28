import { useState } from 'react'
import { Plus, X, MapPin } from 'lucide-react'
import Pagination from '../shared/components/Pagination'
import AddressSearch from '@/features/user/AddressSearch'
import Spinner from '@/shared/components/Spinner'
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '@/api/userApi'

const EMPTY_FORM = {
  addressName: '',
  postcode: '',
  baseAddress: '',
  extraAddress: '',
  addressType: '',
  detailAddress: '',
  isDefault: false,
}

const PAGE_SIZE = 5

export default function UserAddressPage() {
  const { data, isLoading, isError } = useGetAddressesQuery()
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation()
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()

  const addresses   = data?.addresses ?? []
  const totalCount  = data?.totalCount ?? 0

  const [page, setPage]           = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [modalError, setModalError] = useState('')

  const totalPages = Math.ceil(addresses.length / PAGE_SIZE)

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModalMode('add')
    setEditId(null)
    setModalError('')
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      addressName:   item.addressName ?? '',
      postcode:      item.postcode,
      baseAddress:   item.baseAddress,
      extraAddress:  item.extraAddress ?? '',
      addressType:   item.addressType,
      detailAddress: item.detailAddress ?? '',
      isDefault:     item.isDefault,
    })
    setModalMode('edit')
    setEditId(item.addressId)
    setModalError('')
    setIsModalOpen(true)
  }

  const handleDelete = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap()
      if (page > Math.max(Math.ceil((addresses.length - 1) / PAGE_SIZE), 1)) {
        setPage(prev => prev - 1)
      }
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.postcode || !form.baseAddress) {
      setModalError('주소를 검색해 주세요.')
      return
    }
    setModalError('')

    const body = {
      addressName:   form.addressName || undefined,
      postcode:      form.postcode,
      baseAddress:   form.baseAddress,
      detailAddress: form.detailAddress,
      extraAddress:  form.extraAddress,
      addressType:   form.addressType,
      isDefault:     form.isDefault,
    }

    try {
      if (modalMode === 'add') {
        await createAddress(body).unwrap()
      } else {
        await updateAddress({ addressId: editId, ...body }).unwrap()
      }
      setIsModalOpen(false)
    } catch (err) {
      setModalError(err?.data?.message || '저장 중 오류가 발생했습니다.')
    }
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const isSaving = isCreating || isUpdating

  if (isLoading) return <Spinner fullscreen />

  if (isError) {
    return (
      <div className="bg-[#FCFBF9] min-h-screen flex items-center justify-center">
        <p className="text-[#bbb] font-bold">배송지 정보를 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FCFBF9] min-h-screen pb-28 px-4 text-[#111]">
      <div className="max-w-[1200px] mx-auto text-center py-24">
        <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">배송지 관리</h1>
      </div>

      <div className="max-w-[680px] mx-auto">
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-[14px] font-bold text-[#aaa]">
            총 <span className="text-[#111] font-black">{totalCount}</span>개
          </span>
          <button
            onClick={openAdd}
            className="h-10 px-5 bg-[#3ea76e] text-white rounded-full text-[13px] font-black hover:bg-[#318a57] transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Plus size={14} /> 신규 등록
          </button>
        </div>

        <div className="space-y-3">
          {addresses.length === 0 && (
            <div className="text-center py-24">
              <MapPin size={32} className="text-[#eee] mx-auto mb-4" />
              <p className="text-[#bbb] font-bold text-[14px]">등록된 배송지가 없어요</p>
            </div>
          )}
          {addresses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
            <div key={item.addressId} className="bg-white border border-[#eee] rounded-[24px] px-6 py-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#ddd] transition-all">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-[#111]">{item.addressName || '미지정'}</span>
                    {item.isDefault && (
                      <span className="bg-[#f0faf4] text-[#3ea76e] text-[11px] font-black px-2 py-0.5 rounded-full">기본</span>
                    )}
                  </div>
                  <div className="text-[13px] font-bold text-[#555]">
                    {item.recipientName}
                    {item.phoneNumber && (
                      <>
                        <span className="text-[#ddd] mx-1">|</span>
                        <span className="text-[#888] font-medium">{item.phoneNumber}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[13px] text-[#aaa] font-medium">
                    <span className="text-[#3ea76e] font-bold">[{item.postcode}]</span>{' '}
                    {item.baseAddress} {item.extraAddress} {item.detailAddress}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => openEdit(item)}
                    className="h-9 px-4 bg-[#f5f5f5] text-[#555] rounded-full text-[12px] font-bold border-none cursor-pointer hover:bg-[#3ea76e] hover:text-white transition-all"
                  >
                    수정
                  </button>
                  {!item.isDefault && (
                    <button
                      onClick={() => handleDelete(item.addressId)}
                      className="h-9 px-4 bg-[#f5f5f5] text-[#555] rounded-full text-[12px] font-bold border-none cursor-pointer hover:bg-red-50 hover:text-red-400 transition-all"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-[32px] w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl p-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-[#bbb] hover:text-[#111] bg-transparent border-none cursor-pointer">
              <X size={20} />
            </button>

            <h3 className="text-[20px] font-black text-[#111] tracking-tight mb-7">
              {modalMode === 'add' ? '새 배송지 등록' : '배송지 수정'}
            </h3>

            <div className="space-y-4">
              {/* 배송지 별명 */}
              <div>
                <p className="text-[12px] font-bold text-[#aaa] mb-1.5 ml-1">배송지 별명</p>
                <input
                  type="text"
                  value={form.addressName}
                  onChange={e => set('addressName', e.target.value)}
                  placeholder="예: 집, 회사 (미입력 시 '미지정')"
                  className="w-full bg-[#f8f8f8] rounded-2xl px-4 py-3 text-[13px] font-bold outline-none border-none focus:bg-[#f0faf4]"
                />
              </div>

              {/* 주소 검색 */}
              <div>
                <p className="text-[12px] font-bold text-[#aaa] mb-1.5 ml-1">주소 *</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.postcode}
                      readOnly
                      placeholder="우편번호"
                      className="w-28 bg-[#f8f8f8] rounded-2xl px-4 py-3 text-[13px] font-bold outline-none border-none"
                    />
                    <AddressSearch onSelect={({ postcode, baseAddress, extraAddress, addressType }) => {
                      set('postcode', postcode)
                      set('baseAddress', baseAddress)
                      set('extraAddress', extraAddress)
                      set('addressType', addressType)
                    }} />
                  </div>
                  <input
                    type="text"
                    value={`${form.baseAddress} ${form.extraAddress}`.trim()}
                    readOnly
                    placeholder="기본주소"
                    className="w-full bg-[#f8f8f8] rounded-2xl px-4 py-3 text-[13px] font-bold outline-none border-none"
                  />
                  <input
                    type="text"
                    value={form.detailAddress}
                    onChange={e => set('detailAddress', e.target.value)}
                    placeholder="나머지 주소 (선택)"
                    className="w-full bg-[#f8f8f8] rounded-2xl px-4 py-3 text-[13px] font-bold outline-none border-none focus:bg-[#f0faf4]"
                  />
                </div>
              </div>

              {/* 기본 배송지 */}
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={e => set('isDefault', e.target.checked)}
                  className="w-4 h-4 accent-[#3ea76e] cursor-pointer"
                />
                <span className="text-[13px] font-bold text-[#555]">기본 배송지로 저장</span>
              </label>

              {modalError && (
                <p className="text-[12px] font-bold text-red-500 px-1">{modalError}</p>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#f5f5f5]">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-[2] py-3.5 bg-[#3ea76e] text-white rounded-full font-black text-[14px] border-none cursor-pointer hover:bg-[#318a57] transition-all disabled:bg-[#eee] disabled:text-[#ccc] disabled:cursor-not-allowed"
                >
                  {isSaving ? '저장 중...' : modalMode === 'add' ? '등록하기' : '수정완료'}
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-[#f5f5f5] text-[#555] rounded-full font-black text-[14px] border-none cursor-pointer hover:bg-[#ebebeb] transition-all"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
