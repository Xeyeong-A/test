import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('연결 확인 중...')

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('profiles').select('*').limit(1)
      if (error) {
        setStatus(`연결 실패: ${error.message}`)
      } else {
        setStatus(`연결 성공: ${data.length}개 레코드 확인`)
      }
    }

    testConnection()
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', lineHeight: 1.6 }}>
      <h1>React + Supabase 연결 테스트</h1>
      <p>{status}</p>
      <p>이 페이지는 Vite React 앱으로 실행됩니다.</p>
    </main>
  )
}

export default App
