import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('방문자 통계를 불러오는 중...')

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
    loadStats()
    recordVisit()
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', lineHeight: 1.7, maxWidth: '960px', margin: '0 auto', color: '#234' }}>
      <section style={{ background: 'linear-gradient(135deg, #f8fff2 0%, #e8f8d8 100%)', borderRadius: '24px', padding: '2rem', border: '1px solid #d8f0b5', boxShadow: '0 14px 36px rgba(67, 120, 31, 0.12)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#4f7a1a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fresh from the farm</p>
        <h1 style={{ margin: '0.4rem 0 0.7rem', fontSize: '2.3rem', color: '#214d12' }}>신선한 양상추를 집앞까지</h1>
        <p style={{ margin: 0, fontSize: '1.05rem', color: '#4b5b3d' }}>매일 수확한 청량한 양상추를, 가장 신선한 상태로 배송해 드립니다.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          <span style={{ background: '#5fa83f', color: 'white', padding: '0.5rem 0.85rem', borderRadius: '999px' }}>친환경 재배</span>
          <span style={{ background: '#7ecb5c', color: 'white', padding: '0.5rem 0.85rem', borderRadius: '999px' }}>당일 배송</span>
          <span style={{ background: '#2f7d3f', color: 'white', padding: '0.5rem 0.85rem', borderRadius: '999px' }}>무농약 인증</span>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.2rem', marginTop: '1.2rem' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '1.2rem', boxShadow: '0 10px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, color: '#214d12' }}>오늘의 추천 상품</h2>
          <ul style={{ paddingLeft: '1.1rem', color: '#4b5b3d' }}>
            <li>무농약 양상추 1봉</li>
            <li>산뜻한 샐러드 세트</li>
            <li>주간 신선 식품 박스</li>
          </ul>
        </div>

        <div style={{ background: '#264d1b', color: 'white', borderRadius: '20px', padding: '1.2rem' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>현재 방문 통계</p>
          <h3 style={{ margin: '0.3rem 0', fontSize: '1.7rem' }}>{stats?.count ?? 0}명</h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{status}</p>
        </div>
      </section>
    </main>
  )
}

export default App
