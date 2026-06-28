import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [message, setMessage] = useState('연결 중...')

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('profiles').select('*').limit(1)
      if (error) {
        setMessage(`연결 실패: ${error.message}`)
      } else {
        setMessage(`연결 성공: ${data.length}개 레코드 확인`)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Supabase 연결 테스트</h1>
      <p>{message}</p>
    </div>
  )
}

export default App
