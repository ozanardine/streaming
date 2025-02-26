import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import MediaCard from '../components/MediaCard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function SearchPage() {
  const router = useRouter()
  const { q: query } = router.query
  const { user, profile, loading: authLoading } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Redirecionar se não estiver autenticado
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    const searchMedia = async () => {
      if (!query || !profile) return
      
      setLoading(true)
      
      try {
        // Buscar no supabase por título ou descrição contendo o termo
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          
        if (error) throw error
        
        // Buscar progresso de visualização para cada mídia
        if (data.length > 0) {
          const { data: progressData } = await supabase
            .from('watch_progress')
            .select('*')
            .eq('profile_id', profile.id)
            .in('media_id', data.map(m => m.id))
          
          // Combinar dados de mídia com progresso
          const mediaWithProgress = data.map(item => {
            const progress = progressData?.find(p => p.media_id === item.id)
            return {
              ...item,
              watch_progress: progress?.progress || 0,
              duration: progress?.duration || 0
            }
          })
          
          setResults(mediaWithProgress)
        } else {
          setResults([])
        }
      } catch (err) {
        console.error('Erro na busca:', err)
        setError('Não foi possível realizar a busca. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    
    if (query) {
      searchMedia()
    } else {
      setResults([])
      setLoading(false)
    }
  }, [query, profile])

  if (authLoading || (loading && query)) {
    return (
      <Layout title="Busca">
        <div className="loading">Buscando...</div>
      </Layout>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <Layout title={`Busca: ${query || ''}`}>
      <div className="search-page">
        <h1>Resultados para: "{query}"</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {!query && (
          <div className="search-instructions">
            <p>Digite algo na barra de pesquisa para encontrar filmes, séries e mais.</p>
          </div>
        )}
        
        {query && results.length === 0 && !loading && (
          <div className="no-results">
            <p>Nenhum resultado encontrado para "{query}".</p>
            <p>Tente outros termos ou navegue por categorias.</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="search-results">
            <div className="results-grid">
              {results.map(item => (
                <div key={item.id} className="result-item">
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}