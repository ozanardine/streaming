import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import VideoPlayer from '../../components/VideoPlayer'
import FavoriteButton from '../../components/FavoriteButton'
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
  const [relatedMedia, setRelatedMedia] = useState([])

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
        
        // Buscar mídia relacionada (mesma categoria)
        if (mediaData.category) {
          const { data: relatedData } = await supabase
            .from('media')
            .select('*')
            .eq('category', mediaData.category)
            .neq('id', id)
            .limit(4)
            
          setRelatedMedia(relatedData || [])
        }
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
    <Layout title={media.title}>
      <div className="watch-container">
        <h1>{media.title}</h1>
        
        <div className="video-container">
          <VideoPlayer 
            mediaUrl={media.media_url} 
            mediaId={media.id} 
            initialProgress={progress}
          />
        </div>
        
        <div className="media-details">
          <div className="media-actions">
            <FavoriteButton mediaId={media.id} />
            
            <Link href={`/browse?category=${encodeURIComponent(media.category)}`}>
              <span className="category-tag">{media.category}</span>
            </Link>
          </div>
          
          {media.description && (
            <div className="media-description">
              <h3>Descrição</h3>
              <p>{media.description}</p>
            </div>
          )}
          
          {relatedMedia.length > 0 && (
            <div className="related-media">
              <h3>Conteúdo relacionado</h3>
              <div className="related-grid">
                {relatedMedia.map(item => (
                  <Link href={`/watch/${item.id}`} key={item.id}>
                    <div className="related-item">
                      <div className="related-thumbnail">
                        {item.thumbnail_url ? (
                          <Image 
                            src={item.thumbnail_url} 
                            alt={item.title} 
                            width={120} 
                            height={68}
                          />
                        ) : (
                          <div className="no-thumbnail small">
                            <span>{item.title}</span>
                          </div>
                        )}
                      </div>
                      <span className="related-title">{item.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}