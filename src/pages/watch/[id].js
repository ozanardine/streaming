import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import VideoPlayer from '../../components/VideoPlayer'
import { getMediaDetails } from '../../lib/mediaStorage'
import { supabase } from '../../lib/supabase'

export default function WatchPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, profile, loading: authLoading } = useAuth()
  const [media, setMedia] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMedia = async () => {
      if (!id || !profile) return
      
      try {
        // Buscar detalhes da mídia
        const mediaData = await getMediaDetails(id)
        
        // Buscar progresso de visualização
        const { data: progressData } = await supabase
          .from('watch_progress')
          .select('*')
          .eq('media_id', id)
          .eq('profile_id', profile.id)
          .single()
        
        setMedia(mediaData)
        setProgress(progressData?.progress || 0)
      } catch (err) {
        console.error('Erro ao buscar detalhes:', err)
        setError('Não foi possível carregar este vídeo')
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [id, profile])

  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  if (authLoading || loading) {
    return <div className="loading">Carregando...</div>
  }

  if (error) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={() => router.back()}>Voltar</button>
        </div>
      </Layout>
    )
  }

  if (!media) {
    return null
  }

  return (
    <Layout>
      <div className="watch-container">
        <h1>{media.title}</h1>
        
        <div className="video-container">
          <VideoPlayer 
            mediaUrl={media.media_url} 
            mediaId={media.id} 
            initialProgress={progress}
          />
        </div>
        
        {media.description && (
          <div className="media-description">
            <h3>Descrição</h3>
            <p>{media.description}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}