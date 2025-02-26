import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useMedia } from '../hooks/useMedia'
import Layout from '../components/Layout'
import CategoryRow from '../components/CategoryRow'

export default function Browse() {
  const { user, profile, loading: authLoading } = useAuth()
  const { media: recentlyAdded, loading: mediaLoading } = useMedia()
  const { media: continueWatching, loading: continueLoading } = useMedia('continue')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  if (authLoading || mediaLoading || continueLoading) {
    return <div className="loading">Carregando...</div>
  }

  if (!user || !profile) {
    return null
  }

  // Filtrar mídia com progresso para "Continue assistindo"
  const mediaToResume = recentlyAdded.filter(item => 
    item.watch_progress > 0 && 
    item.watch_progress < (item.duration * 0.95)
  )

  return (
    <Layout>
      <div className="browse-page">
        <h1 className="welcome-message">Olá, {profile.name}</h1>

        {mediaToResume.length > 0 && (
          <CategoryRow 
            title="Continue Assistindo" 
            media={mediaToResume} 
          />
        )}
        
        <CategoryRow 
          title="Adicionados Recentemente" 
          media={recentlyAdded} 
        />
        
        {/* Outras categorias podem ser adicionadas aqui */}
      </div>
    </Layout>
  )
}