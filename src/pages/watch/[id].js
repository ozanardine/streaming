import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/context/ToastContext';
import Layout from '../../components/layout/Layout';
import FavoriteButton from '../../components/media/FavoriteButton';
import MediaGrid from '../../components/media/MediaGrid';
import VideoPlayer from '../../components/media/VideoPlayer';
import Button from '../../components/ui/Button';
import { getMediaDetails } from '../../lib/mediaStorage';
import { supabase } from '../../lib/supabase';
import { getVideoUrlType } from '../../lib/helpers/videoHelpers';
import { formatDuration } from '../../lib/helpers/dateFormat';

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile, loading: authLoading } = useAuth();
  const { error: showError } = useToast();
  
  const [media, setMedia] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedMedia, setRelatedMedia] = useState([]);
  const [videoType, setVideoType] = useState('standard');
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!id || !profile) return;
      
      try {
        // Fetch media details
        const mediaData = await getMediaDetails(id);
        
        // Determine video type
        const detectedType = mediaData.type || getVideoUrlType(mediaData.media_url);
        setVideoType(detectedType);
        
        setMedia(mediaData);
        
        // Fetch viewing progress
        try {
          const { data: progressData } = await supabase
            .from('watch_progress')
            .select('*')
            .eq('media_id', id)
            .eq('profile_id', profile.id)
            .maybeSingle();
          
          if (progressData) {
            setProgress(progressData.progress || 0);
          }
        } catch (progressError) {
          console.error('Warning: Error fetching progress:', progressError);
          // Continue even with progress error
        }
        
        // Fetch related media (same category)
        try {
          if (mediaData.category) {
            const { data: relatedData } = await supabase
              .from('media')
              .select('*')
              .eq('category', mediaData.category)
              .neq('id', id)
              .limit(6);
              
            setRelatedMedia(relatedData || []);
          }
        } catch (relatedError) {
          console.error('Warning: Error fetching related media:', relatedError);
          // Continue even with related media error
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Não foi possível carregar este vídeo');
        showError('Erro ao carregar o vídeo. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [id, profile, showError]);

  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/');
    }
  }, [user, profile, authLoading, router]);

  if (authLoading || (loading && id)) {
    return (
      <Layout title="Carregando...">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/10 border-t-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Erro">
        <div className="max-w-md mx-auto rounded-lg bg-background-card p-6 shadow-xl border border-background-light/20">
          <h2 className="text-xl font-bold text-error mb-4">Erro</h2>
          <p className="mb-6 text-text-secondary">{error}</p>
          <Button 
            onClick={() => router.back()}
            variant="primary"
          >
            Voltar
          </Button>
        </div>
      </Layout>
    );
  }

  if (!media) {
    return null;
  }

  return (
    <Layout title={media.title}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{media.title}</h1>
        
        <div className="mb-8">
          <VideoPlayer 
            mediaUrl={media.media_url} 
            mediaId={media.id} 
            initialProgress={progress}
            videoType={videoType}
          />
        </div>
        
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FavoriteButton mediaId={media.id} />
            
            {media.category && (
              <Link 
                href={`/browse?category=${encodeURIComponent(media.category)}`}
                className="rounded-full bg-background-light/50 px-4 py-1 text-sm transition-colors hover:bg-background-light"
              >
                {media.category}
              </Link>
            )}
            
            {media.duration > 0 && (
              <span className="rounded-full bg-background-light/30 px-3 py-1 text-sm text-text-secondary">
                {formatDuration(media.duration)}
              </span>
            )}
          </div>
          
          {media.description && (
            <div>
              <div className={`relative ${!showDescription && 'max-h-20 overflow-hidden'}`}>
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-text-secondary">
                  {media.description}
                </p>
                
                {!showDescription && media.description.length > 150 && (
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
                )}
              </div>
              
              {media.description.length > 150 && (
                <button 
                  className="mt-2 text-primary text-sm hover:text-primary-light"
                  onClick={() => setShowDescription(!showDescription)}
                >
                  {showDescription ? 'Mostrar menos' : 'Mostrar mais'}
                </button>
              )}
            </div>
          )}
          
          {relatedMedia.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xl font-semibold mb-4">Conteúdo relacionado</h3>
              <MediaGrid items={relatedMedia} columns={2} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}