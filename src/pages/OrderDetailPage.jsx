import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGetOrderByIdQuery } from '../api/orderApi'
import { useGetProductSummaryQuery } from '../api/productApi'
import Spinner from '../shared/components/Spinner'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: order, isLoading, isError } = useGetOrderByIdQuery(id)


  if (isLoading) return <Spinner fullscreen />
  if (isError || !order) {
    return (
      <div className="text-center py-24 text-[#bbb] font-bold text-[16px]">
        주문 정보를 불러올 수 없습니다.
      </div>
    )
  }

  const hasDiscount = order.discountPrice > 0 || order.couponDiscount > 0

  return (
    <div className="pb-28 text-[#111]">

      <div className="text-center py-24">
        <h1 className="text-[36px] font-black tracking-[-0.05em] text-[#111]">주문상세조회</h1>
      </div>

      <div className="space-y-12">

        {/* 주문 정보 */}
        <section className="bg-white rounded-[32px] p-10 md:p-12 border border-[#eee] shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <h2 className="text-[20px] font-black mb-10 flex items-center gap-2.5 tracking-tight">
            <span className="w-1.5 h-6 bg-[#3ea76e] rounded-full" />
            주문 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-7">
            <InfoRow label="주문번호" value={order.id} />
            <InfoRow label="주문일자" value={order.date} />
            {order.ordererName && <InfoRow label="주문자" value={order.ordererName} />}
            <InfoRow label="주문처리상태" value={order.status} isHighlight />
          </div>
        </section>

        {/* 주문 상품 */}
        <section className="bg-white rounded-[32px] p-10 md:p-12 border border-[#eee] shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <h2 className="text-[20px] font-black mb-10 tracking-tight flex items-center justify-between">
            주문 상품 (총 {order.items.length}개)
          </h2>

          <div className="divide-y divide-[#f5f5f5]">
            {order.items.map((item, idx) => (
              <ProductItem
                key={item.productId ?? idx}
                item={item}
                orderId={order.id}
              />
            ))}
          </div>

        </section>

        {/* 결제 정보 */}
        <section className="bg-white rounded-[32px] p-10 md:p-12 border border-[#eee] shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
          <h2 className="text-[20px] font-black mb-10 tracking-tight">최초 결제 정보</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="bg-[#FCFBF9] rounded-[24px] p-8 border border-[#eee] flex flex-col justify-center">
              {order.paymentMethod && (
                <div className="mb-6">
                  <p className="text-[#555] font-bold text-[14px] mb-2">결제수단</p>
                  <p className="text-[18px] font-black text-[#111]">{order.paymentMethod}</p>
                </div>
              )}
              <div className="h-[1px] bg-[#eee] w-full mb-6" />
              <div className="flex justify-between items-center">
                <span className="text-[#111] font-black text-[16px]">총 결제금액</span>
                <span className="text-[28px] font-black text-[#3ea76e] tracking-[-0.05em]">
                  {order.total.toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="space-y-6 py-2">
              <div className="flex justify-between items-center">
                <span className="text-[#555] font-bold">총 주문금액</span>
                <span className="font-black text-[18px] tracking-tight">{order.productPrice.toLocaleString()}원</span>
              </div>

              {hasDiscount && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#555] font-bold">총 할인금액</span>
                    <span className="font-black text-[18px] text-[#3ea76e] tracking-tight">
                      -{(order.discountPrice + (order.couponDiscount ?? 0)).toLocaleString()}원
                    </span>
                  </div>
                  {order.couponDiscount > 0 && (
                    <div className="bg-[#fffcfc] p-5 rounded-xl border border-[#ffebeb] flex justify-between items-center">
                      <span className="text-[14px] font-bold text-[#3ea76e]">ㄴ 쿠폰할인</span>
                      <span className="text-[14px] font-black text-[#3ea76e]">{order.couponDiscount.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>

        {/* 배송지 정보 */}
        {order.address?.recipient && (
          <section className="bg-white rounded-[32px] p-10 md:p-12 border border-[#eee] shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-[20px] font-black tracking-tight">배송지 정보</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-y-9 text-[16px]">
              <span className="text-[#555] font-bold">받으시는 분</span>
              <span className="font-black">{order.address.recipient}</span>

              {order.address.zipCode && (
                <>
                  <span className="text-[#555] font-bold">우편번호</span>
                  <span className="font-black text-[#3ea76e]">{order.address.zipCode}</span>
                </>
              )}

              {order.address.address && (
                <>
                  <span className="text-[#555] font-bold">주소</span>
                  <span className="font-black leading-relaxed tracking-tight">{order.address.address}</span>
                </>
              )}

              {order.address.phone && (
                <>
                  <span className="text-[#555] font-bold">휴대폰</span>
                  <span className="font-black">{order.address.phone}</span>
                </>
              )}

              {order.address.memo && (
                <>
                  <span className="text-[#555] font-bold">배송메시지</span>
                  <div className="bg-[#FCFBF9] p-6 rounded-2xl border border-[#eee] font-bold text-[#555] leading-relaxed tracking-tight">
                    {order.address.memo}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 하단 버튼 */}
        <div className="pt-16">
          <button
            onClick={() => navigate('/order/list')}
            className="w-full h-20 rounded-full bg-[#3ea76e] text-white font-black text-[20px] tracking-[-0.05em] hover:bg-[#318a57] transition-all active:scale-[0.98] border-none cursor-pointer shadow-lg shadow-[#3ea76e/20]"
          >
            주문목록보기
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, isHighlight }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-[#555] font-bold text-[15px]">{label}</span>
      <span className={`font-black text-[16px] tracking-tight ${isHighlight ? 'text-[#3ea76e]' : 'text-[#111]'}`}>
        {value}
      </span>
    </div>
  )
}

function ProductItem({ item, orderId }) {
  const navigate = useNavigate()
  const { data: summary } = useGetProductSummaryQuery(item.productId)
  const img = item.img ?? summary?.img ?? null

  const handleWriteReview = () => {
    navigate('/review/write', {
      state: {
        orderId,
        productId:    item.productId,
        productName:  item.name,
        productImage: img,
      },
    })
  }

  return (
    <div className="flex gap-10 py-10 first:pt-0">
      <div className="flex flex-col items-center gap-3 shrink-0">
        <Link
          to={`/product/detail/${item.productId}`}
          className="w-32 h-32 rounded-[28px] overflow-hidden border border-[#eee] bg-[#f9f9f9] block"
        >
          {img
            ? <img src={img} alt={item.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
            : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-3xl">🐾</div>
          }
        </Link>
        <button
          onClick={handleWriteReview}
          className="w-32 h-9 rounded-full bg-[#f5f5f5] text-[#555] font-bold text-[12px] hover:bg-[#3ea76e] hover:text-white transition-all border-none cursor-pointer"
        >
          구매후기
        </button>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            {item.company && (
              <p className="text-[#555] text-[13px] font-black mb-1">{item.company}</p>
            )}
            <h3 className="text-[19px] font-black tracking-[-0.05em] text-[#111]">{item.name}</h3>
          </div>
          {item.itemStatus && (
            <span className="px-5 py-1.5 rounded-full bg-white border-2 border-[#3ea76e] text-[#3ea76e] text-[13px] font-black shrink-0">
              {item.itemStatus}
            </span>
          )}
        </div>
        {item.option && (
          <p className="text-[14px] font-bold text-[#bbb] mb-5 tracking-tight">{item.option}</p>
        )}
        <div className="space-y-2">
          {item.trackingNo && (
            <p className="text-[13px] text-[#ccc] font-bold">송장번호 : [{item.trackingNo}]</p>
          )}
          <p className="text-[16px] font-black text-[#111]">
            수량 : {item.qty}개 / <span className="text-[20px]">{(item.price * item.qty).toLocaleString()}원</span>
          </p>
        </div>
      </div>
    </div>
  )
}
