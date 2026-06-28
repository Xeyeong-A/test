import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { canFulfillOrder, getUpdatedStock } from './lib/stock'

function App() {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('상품과 방문 통계를 불러오는 중...')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    product_id: '',
    quantity: 1,
  })

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      setStatus(`상품 조회 실패: ${error.message}`)
      return
    }

    setProducts(data ?? [])
    if (data?.length) {
      setForm((prev) => ({ ...prev, product_id: String(data[0].id) }))
    }
  }

  const loadStats = async () => {
    const { data, error } = await supabase.from('visit_stats').select('*').limit(1).single()

    if (error) {
      if (error.code !== 'PGRST116') {
        setStatus(`통계 조회 실패: ${error.message}`)
      }
      return
    }

    setStats(data)
  }

  const recordVisit = async () => {
    const { data, error } = await supabase.from('visit_stats').select('*').limit(1).single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase.from('visit_stats').insert([{ count: 1 }])
        if (insertError) {
          setStatus(`카운트 생성 실패: ${insertError.message}`)
        } else {
          await loadStats()
        }
        return
      }

      setStatus(`카운트 조회 실패: ${error.message}`)
      return
    }

    const { error: updateError } = await supabase
      .from('visit_stats')
      .update({ count: (data.count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', data.id)

    if (updateError) {
      setStatus(`카운트 증가 실패: ${updateError.message}`)
      return
    }

    await loadStats()
  }

  useEffect(() => {
    loadProducts()
    loadStats()
    recordVisit()
  }, [])

  const selectedProduct = products.find((product) => String(product.id) === form.product_id) ?? products[0]

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_address.trim() || !form.product_id) {
      setStatus('이름, 연락처, 주소, 상품을 모두 입력해 주세요.')
      return
    }

    if (!selectedProduct) {
      setStatus('선택 가능한 상품이 없습니다.')
      return
    }

    const quantity = Math.max(1, Number(form.quantity) || 1)

    if (!canFulfillOrder(selectedProduct.stock, quantity)) {
      setStatus(`재고가 부족합니다. 현재 재고: ${selectedProduct.stock ?? 0}개`)
      return
    }

    setSubmitting(true)

    const totalPrice = Number(selectedProduct.price ?? 0) * quantity
    const newStock = getUpdatedStock(selectedProduct.stock, quantity)

    const { error: orderError } = await supabase.from('orders').insert([
      {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
        product_id: Number(form.product_id),
        product_name: selectedProduct.name,
        quantity,
        total_price: totalPrice,
        status: 'pending',
      },
    ])

    if (orderError) {
      setSubmitting(false)
      setStatus(`주문 저장 실패: ${orderError.message}`)
      return
    }

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id)

    setSubmitting(false)

    if (stockError) {
      setStatus(`재고 차감 실패: ${stockError.message}`)
      return
    }

    await loadProducts()
    setStatus(`${selectedProduct.name} 주문이 접수되었고 재고가 ${newStock}개로 줄었습니다.`)
    setForm((prev) => ({ ...prev, customer_name: '', customer_phone: '', customer_address: '', quantity: 1 }))
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', lineHeight: 1.7, maxWidth: '1100px', margin: '0 auto', color: '#234' }}>
      <section style={{ background: 'linear-gradient(135deg, #f8fff2 0%, #e8f8d8 100%)', borderRadius: '24px', padding: '2rem', border: '1px solid #d8f0b5', boxShadow: '0 14px 36px rgba(67, 120, 31, 0.12)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#4f7a1a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fresh from the farm</p>
        <h1 style={{ margin: '0.4rem 0 0.7rem', fontSize: '2.3rem', color: '#214d12' }}>신선한 양상추를 집앞까지</h1>
        <p style={{ margin: 0, fontSize: '1.05rem', color: '#4b5b3d' }}>매일 수확한 청량한 양상추와 샐러드 세트를 바로 주문해 보세요.</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.2rem', marginTop: '1.2rem' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '1.2rem', boxShadow: '0 10px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, color: '#214d12' }}>판매 상품</h2>
          {products.length === 0 ? (
            <p style={{ color: '#4b5b3d' }}>아직 등록된 상품이 없습니다.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {products.map((product) => (
                <div key={product.id} style={{ border: '1px solid #e1ecc6', borderRadius: '14px', padding: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.2rem', color: '#214d12' }}>{product.name}</h3>
                      <p style={{ margin: 0, color: '#4b5b3d' }}>{product.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 0.2rem', fontWeight: 700, color: '#2f7d3f' }}>{product.price.toLocaleString()}원</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5b3d' }}>재고 {product.stock}개</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, product_id: String(product.id) }))}
                    style={{ marginTop: '0.6rem', border: 'none', borderRadius: '999px', background: '#5fa83f', color: 'white', padding: '0.45rem 0.8rem', cursor: 'pointer' }}
                  >
                    이 상품 선택
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1.2rem' }}>
          <div style={{ background: '#264d1b', color: 'white', borderRadius: '20px', padding: '1.2rem' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>현재 방문 통계</p>
            <h3 style={{ margin: '0.3rem 0', fontSize: '1.7rem' }}>{stats?.count ?? 0}명</h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{status}</p>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '1.2rem', boxShadow: '0 10px 24px rgba(0,0,0,0.06)' }}>
            <h2 style={{ marginTop: 0, color: '#214d12' }}>주문서</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.7rem' }}>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="이름" style={inputStyle} />
              <input name="customer_phone" value={form.customer_phone} onChange={handleChange} placeholder="연락처" style={inputStyle} />
              <textarea name="customer_address" value={form.customer_address} onChange={handleChange} placeholder="배송 주소" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              <select name="product_id" value={form.product_id} onChange={handleChange} style={inputStyle}>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>{product.name}</option>
                ))}
              </select>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="수량" style={inputStyle} />
              <button type="submit" disabled={submitting} style={{ border: 'none', borderRadius: '10px', background: '#2f7d3f', color: 'white', padding: '0.8rem', cursor: 'pointer' }}>
                {submitting ? '주문 중...' : '주문하기'}
              </button>
            </form>
            {selectedProduct ? (
              <p style={{ marginTop: '0.7rem', color: '#4b5b3d' }}>
                선택한 상품: {selectedProduct.name} / {Number(selectedProduct.price ?? 0).toLocaleString()}원
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem',
  borderRadius: '10px',
  border: '1px solid #d0e3b3',
  boxSizing: 'border-box',
}

export default App
