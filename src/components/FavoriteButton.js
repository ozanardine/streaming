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
      className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <span className="favorite-icon">
        {isFavorite ? '♥' : '♡'}
      </span>
    </button>
  )
}

export default FavoriteButton