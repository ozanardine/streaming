import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import MediaCard from '../components/MediaCard'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function FavoritesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!profile) return
      
      try {
        // Buscar favoritos do perfil
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('media_id')
          .eq('profile_id', profile.id)
          
        if (favoritesError) throw favoritesError
        
        if (favoritesData.length === 0) {
          setFavorites([])
          setLoading(false)
          return
        }
        
        // Buscar detalhes da mídia para cada favorito
        const mediaIds = favoritesData.map(fav => fav.media_id)
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .in('id', mediaIds)
          
        if (mediaError) throw mediaError
        
        // Buscar progresso de visualização
        const { data: progressData } = await supabase
          .from('watch_progress')
          .select('*')
          .eq('profile_id', profile.id)
          .in('media_id', mediaIds)
        
        // Combinar dados
        const mediaWithProgress = mediaData.map(item => {
          const progress = progressData?.find(p => p.media_id === item.id)
          return {
            ...item,
            watch_progress: progress?.progress || 0,
            duration: progress?.duration || 0
          }
        })
        
        setFavorites(mediaWithProgress)
      } catch (err) {
        console.error('Erro ao buscar favoritos:', err)
        setError('Não foi possível carregar seus favoritos.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchFavorites()
  }, [profile])

  const removeFavorite = async (mediaId) => {
    if (!profile) return
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('profile_id', profile.id)
        .eq('media_id', mediaId)
        
      if (error) throw error
      
      // Atualizar lista local
      setFavorites(favorites.filter(item => item.id !== mediaId))
    } catch (err) {
      console.error('Erro ao remover favorito:', err)
      alert('Erro ao remover dos favoritos. Tente novamente.')
    }
  }

  if (authLoading || loading) {
    return (
      <Layout title="Favoritos">
        <div className="loading">Carregando...</div>
      </Layout>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <Layout title="Meus Favoritos">
      <div className="favorites-page">
        <h1>Meus Favoritos</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {favorites.length === 0 && (
          <div className="empty-favorites">
            <p>Você ainda não adicionou nenhum favorito.</p>
            <button 
              className="browse-button"
              onClick={() => router.push('/browse')}
            >
              Explorar conteúdo
            </button>
          </div>
        )}
        
        {favorites.length > 0 && (
          <div className="favorites-grid">
            {favorites.map(item => (
              <div key={item.id} className="favorite-item">
                <div className="favorite-card">
                  <MediaCard media={item} />
                  <button 
                    className="remove-favorite"
                    onClick={() => removeFavorite(item.id)}
                    title="Remover dos favoritos"
                  >
                    ♥
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}