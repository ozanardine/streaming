import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useMedia } from '../hooks/useMedia';
import Layout from '../components/layout/Layout';
import CategoryRow from '../components/media/CategoryRow';
import MediaGrid from '../components/media/MediaGrid';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import Button from '../components/ui/Button';
import { useToast } from '../lib/context/ToastContext';

export default function Browse() {
  const { user, profile, loading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const router = useRouter();
  const { category } = router.query;
  
  // Track overall loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use customized category for specific routes
  const displayCategory = category || null;
  
  // Use the custom hooks with better error handling
  const { media: recentlyAdded, loading: mediaLoading, error: mediaError } = useMedia();
  const { media: filmsMedia, loading: filmsLoading, error: filmsError } = useMedia('filmes');
  const { media: seriesMedia, loading: seriesLoading, error: seriesError } = useMedia('series');
  const { media: animeMedia, loading: animeLoading, error: animeError } = useMedia('anime');

  // Auth redirection
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/');
    }
  }, [user, profile, authLoading, router]);
  
  // Handle loading states
  useEffect(() => {
    setIsLoading(authLoading || mediaLoading || filmsLoading || seriesLoading || animeLoading);
  }, [authLoading, mediaLoading, filmsLoading, seriesLoading, animeLoading]);
  
  // Handle errors
  useEffect(() => {
    const currentError = mediaError || filmsError || seriesError || animeError;
    if (currentError) {
      setError(currentError);
      showError('Erro ao carregar conteúdo. Verifique sua conexão com a internet.');
    } else {
      setError(null);
    }
  }, [mediaError, filmsError, seriesError, animeError, showError]);

  // Build page title based on category
  const getPageTitle = () => {
    if (!displayCategory) return 'Início';
    
    // Capitalize first letter
    return displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
  };

  const getCategoryDescription = () => {
    switch (displayCategory) {
      case 'filmes':
        return 'Os melhores filmes para você assistir';
      case 'series':
        return 'As melhores séries para você maratonar';
      case 'anime':
        return 'Os melhores animes para você assistir';
      case 'documentarios':
        return 'Os melhores documentários para você aprender';
      case 'recentes':
        return 'Conteúdos recém adicionados à plataforma';
      default:
        return 'Navegue por todos os conteúdos disponíveis';
    }
  };

  if (isLoading) {
    return (
      <Layout title="Carregando..." showFooter={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
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
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Filter media with progress for "Continue watching"
  const mediaToResume = recentlyAdded.filter(item => 
    item.watch_progress > 0 && 
    item.watch_progress < (item.duration * 0.95)
  );

  // Only show grid view for specific category pages
  const showGridView = !!displayCategory;

  return (
    <Layout 
      title={getPageTitle()}
      description={getCategoryDescription()}
      fullWidth={!showGridView}
    >
      <div className="py-6">
        {/* Welcome message and feature highlight for homepage */}
        {!displayCategory && (
          <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary to-secondary-dark overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10"></div>
            <div className="relative p-6 md:p-8 lg:p-10">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Olá, {profile.name}!
              </h1>
              <p className="text-white/90 mb-4 max-w-xl">
                Descubra novos conteúdos, acompanhe suas séries favoritas e tenha uma experiência personalizada.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/favorites')}
                className="bg-white/10 hover:bg-white/20 border-white/30"
              >
                Meus Favoritos
              </Button>
            </div>
          </div>
        )}

        {/* Page title for category pages */}
        {displayCategory && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-text-secondary mt-2">{getCategoryDescription()}</p>
          </div>
        )}

        {showGridView ? (
          // Grid view for category pages
          <MediaGrid 
            items={
              displayCategory === 'filmes' ? filmsMedia :
              displayCategory === 'series' ? seriesMedia :
              displayCategory === 'anime' ? animeMedia :
              displayCategory === 'recentes' ? recentlyAdded :
              recentlyAdded
            }
            loading={isLoading}
            emptyMessage={`Nenhum conteúdo disponível para a categoria ${displayCategory}`}
          />
        ) : (
          // Row view for homepage
          <div className="space-y-12">
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
            
            {animeMedia.length > 0 && (
              <CategoryRow 
                title="Animes" 
                media={animeMedia} 
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}