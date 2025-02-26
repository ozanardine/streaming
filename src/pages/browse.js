import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useMedia } from '../hooks/useMedia'
import Layout from '../components/Layout'
import CategoryRow from '../components/CategoryRow'
import ErrorDisplay from '../components/ErrorDisplay'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Browse() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { category } = router.query
  
  // Track overall loading state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Use customized category for specific routes
  const displayCategory = category || null
  
  // Use the custom hooks with better error handling
  const { media: recentlyAdded, loading: mediaLoading, error: mediaError } = useMedia()
  const { media: filmsMedia, loading: filmsLoading, error: filmsError } = useMedia('filmes')
  const { media: seriesMedia, loading: seriesLoading, error: seriesError } = useMedia('series')

  // Auth redirection
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])
  
  // Handle loading states
  useEffect(() => {
    setIsLoading(authLoading || mediaLoading || filmsLoading || seriesLoading)
  }, [authLoading, mediaLoading, filmsLoading, seriesLoading])
  
  // Handle errors
  useEffect(() => {
    const currentError = mediaError || filmsError || seriesError
    if (currentError) {
      setError(currentError)
    } else {
      setError(null)
    }
  }, [mediaError, filmsError, seriesError])

  if (isLoading) {
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="large" message="Carregando conteúdo..." />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Erro">
        <ErrorDisplay 
          message={`Ocorreu um erro ao carregar o conteúdo: ${error}`}
          buttonText="Tentar novamente"
          onButtonClick={() => window.location.reload()}
        />
      </Layout>
    )
  }

  if (!user || !profile) {
    return null
  }

  // Filter media with progress for "Continue watching"
  const mediaToResume = recentlyAdded.filter(item => 
    item.watch_progress > 0 && 
    item.watch_progress < (item.duration * 0.95)
  )

  return (
    <Layout title={displayCategory ? `${displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1)}` : "Início"}>
      <div className="pt-4 pb-8">
        <h1 className="text-3xl font-bold mb-8">
          {displayCategory 
            ? `${displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1)}`
            : `Olá, ${profile.name}`}
        </h1>

        {mediaToResume.length > 0 && !displayCategory && (
          <CategoryRow 
            title="Continue Assistindo" 
            media={mediaToResume} 
          />
        )}
        
        {(!displayCategory || displayCategory === 'recentes') && (
          <CategoryRow 
            title="Adicionados Recentemente" 
            media={recentlyAdded} 
          />
        )}
        
        {(!displayCategory || displayCategory === 'filmes') && filmsMedia.length > 0 && (
          <CategoryRow 
            title="Filmes" 
            media={filmsMedia} 
          />
        )}
        
        {(!displayCategory || displayCategory === 'series') && seriesMedia.length > 0 && (
          <CategoryRow 
            title="Séries" 
            media={seriesMedia} 
          />
        )}
        
        {/* Show empty state if no content is available for the selected category */}
        {displayCategory && (
          (displayCategory === 'filmes' && filmsMedia.length === 0) || 
          (displayCategory === 'series' && seriesMedia.length === 0)
        ) && (
          <div className="flex flex-col items-center justify-center p-12 bg-background-light rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-lg text-text-secondary">Nenhum conteúdo disponível para esta categoria.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}