import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const FavoriteButton = ({ mediaId }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favoriteId, setFavoriteId] = useState(null)
  const { profile } = useAuth()

  useEffect(() => {
    const checkFavorite = async () => {
      if (!profile || !mediaId) {
        setLoading(false)
        return
      }
      
      try {
        // Usar uma abordagem mais segura para verificar favoritos
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('profile_id', profile.id)
          .eq('media_id', mediaId);
          
        if (error) {
          console.error('Erro ao verificar favorito:', error);
          setIsFavorite(false);
          setLoading(false);
          return;
        }
        
        // Se encontrou pelo menos um registro, é favorito
        if (data && data.length > 0) {
          setIsFavorite(true);
          setFavoriteId(data[0].id);
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        console.error('Erro ao verificar favorito:', err)
        setIsFavorite(false)
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
        // Se já temos o ID, usamos diretamente
        if (favoriteId) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', favoriteId);
            
          if (error) throw error;
        } else {
          // Caso não tenhamos o ID (por algum motivo), usamos as chaves compostas
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('profile_id', profile.id)
            .eq('media_id', mediaId);
            
          if (error) throw error;
        }
        
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        // Adicionar aos favoritos
        const { data, error } = await supabase
          .from('favorites')
          .insert([{
            profile_id: profile.id,
            media_id: mediaId
          }])
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFavoriteId(data[0].id);
        }
        
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      // Mantém o mesmo estado para garantir consistência
    }
  }

  return (
    <button 
      className={`p-2 focus:outline-none transition-transform duration-200 transform hover:scale-110 ${loading ? 'opacity-50' : ''}`}
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
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