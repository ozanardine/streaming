import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useMedia } from '../hooks/useMedia'
import Layout from '../components/Layout'
import CategoryRow from '../components/CategoryRow'

export default function Browse() {
  const { user, profile, loading: authLoading } = useAuth()
  const { media: recentlyAdded, loading: mediaLoading } = useMedia()
  const { media: filmsMedia, loading: filmsLoading } = useMedia('filmes')
  const { media: seriesMedia, loading: seriesLoading } = useMedia('series')
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  if (authLoading || mediaLoading || filmsLoading || seriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
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
      <div className="pt-4 pb-8">
        <h1 className="text-3xl font-bold mb-8">Olá, {profile.name}</h1>

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
        
        {filmsMedia.length > 0 && (
          <CategoryRow 
            title="Filmes" 
            media={filmsMedia} 
          />
        )}
        
        {seriesMedia.length > 0 && (
          <CategoryRow 
            title="Séries" 
            media={seriesMedia} 
          />
        )}
      </div>
    </Layout>
  )
}