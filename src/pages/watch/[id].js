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
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Erro">
        <div className="max-w-md mx-auto bg-background-light p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Erro</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Voltar
          </button>
        </div>
      </Layout>
    )
  }

  if (!media) {
    return null
  }

  return (
    <Layout title={media.title}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{media.title}</h1>
        
        <div className="mb-8">
          <VideoPlayer 
            mediaUrl={media.media_url} 
            mediaId={media.id} 
            initialProgress={progress}
          />
        </div>
        
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <FavoriteButton mediaId={media.id} />
            
            {media.category && (
              <Link 
                href={`/browse?category=${encodeURIComponent(media.category)}`}
                className="px-3 py-1 bg-background-light hover:bg-background text-sm rounded-md transition-colors"
              >
                {media.category}
              </Link>
            )}
          </div>
          
          {media.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Descrição</h3>
              <p className="text-text-secondary">{media.description}</p>
            </div>
          )}
          
          {relatedMedia.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Conteúdo relacionado</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedMedia.map(item => (
                  <Link 
                    href={`/watch/${item.id}`} 
                    key={item.id}
                    className="block group"
                  >
                    <div className="aspect-video relative rounded overflow-hidden bg-background-dark mb-2">
                      {item.thumbnail_url ? (
                        <Image 
                          src={item.thumbnail_url} 
                          alt={item.title} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-2 text-xs text-center text-text-secondary">
                          <span>{item.title}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm group-hover:text-primary transition-colors duration-200 truncate">{item.title}</h4>
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