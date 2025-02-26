import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import ProfileSelector from '../components/ProfileSelector'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (profile) {
        router.push('/browse')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (user && !profile) {
    return <ProfileSelector />
  }

  return null
}