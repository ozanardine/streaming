import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const FavoriteButton = ({ mediaId }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    const checkFavorite = async () => {
      if (!profile || !mediaId) {
        setLoading(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('profile_id', profile.id)
          .eq('media_id', mediaId)
          .single()
          
        if (error && error.code !== 'PGRST116') {
          // PGRST116 é o código para "não encontrado", que é esperado se não for favorito
          console.error('Erro ao verificar favorito:', error)
        }
        
        setIsFavorite(!!data)
      } catch (err) {
        console.error('Erro ao verificar favorito:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkFavorite()
  }, [mediaId, profile])

  const toggleFavorite = async () => {
    if (!profile || loading) return
    
    try {
      if (isFavorite) {
        // Remover dos favoritos
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('profile_id', profile.id)
          .eq('media_id', mediaId)
          
        if (error) throw error
        
        setIsFavorite(false)
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from('favorites')
          .insert([{
            profile_id: profile.id,
            media_id: mediaId
          }])
          
        if (error) throw error
        
        setIsFavorite(true)
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err)
      alert('Não foi possível atualizar favorito. Tente novamente.')
    }
  }

  return (
    <button 
      className={`p-2 focus:outline-none transition-transform duration-200 transform hover:scale-110 ${loading ? 'opacity-50' : ''}`}
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {isFavorite ? (
        <svg className="w-6 h-6 fill-current text-primary" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 fill-current text-white hover:text-primary" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
    </button>
  )
}

export default FavoriteButton