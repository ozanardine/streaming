import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { updateWatchProgress } from '../../lib/mediaStorage';
import { useAuth } from '../../hooks/useAuth';
import { extractYouTubeId, formatGoogleDriveUrl } from '../../lib/helpers/videoHelpers';
import { useToast } from '../../lib/context/ToastContext';

// Separate YouTubePlayer into a memoized component to prevent unnecessary re-renders
const YouTubePlayer = memo(({ videoId, initialProgress, onTimeUpdate, onPlayerReady, onError }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    // Function to initialize the YouTube player
    const loadYouTubePlayer = () => {
      if (!window.YT) {
        // Load the YouTube API if not already available
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
        
        // Set up global callback for when API is ready
        window.onYouTubeIframeAPIReady = initPlayer;
      } else {
        initPlayer();
      }
    };
    
    // Initialize the player when API is ready
    const initPlayer = () => {
      // Check if player was already initialized or container doesn't exist
      if (playerRef.current || !containerRef.current) return;
      
      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            start: Math.floor(initialProgress || 0)
          },
          events: {
            onReady: (event) => {
              if (typeof onPlayerReady === 'function') {
                onPlayerReady(event.target);
              }
            },
            onStateChange: (event) => {
              // When video is playing, start monitoring time
              if (event.data === window.YT.PlayerState.PLAYING) {
                startTimeTracking();
              } else if (event.data === window.YT.PlayerState.PAUSED || 
                        event.data === window.YT.PlayerState.ENDED) {
                stopTimeTracking();
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              if (typeof onError === 'function') {
                onError(event.data);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        if (typeof onError === 'function') {
          onError(error);
        }
      }
    };
    
    // Time tracking for YouTube
    const startTimeTracking = () => {
      stopTimeTracking(); // Clear any existing interval first
      
      intervalRef.current = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            if (typeof onTimeUpdate === 'function') {
              onTimeUpdate(currentTime);
            }
          }
        } catch (e) {
          console.error('Error getting time from YouTube:', e);
          stopTimeTracking();
        }
      }, 1000);
    };
    
    const stopTimeTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    loadYouTubePlayer();
    
    // Cleanup function
    return () => {
      stopTimeTracking();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, initialProgress, onTimeUpdate, onPlayerReady, onError]);

  return <div ref={containerRef} className="w-full h-full" />;
});

YouTubePlayer.displayName = 'YouTubePlayer';

// Main VideoPlayer component with better error handling and performance optimizations
const VideoPlayer = ({ mediaUrl, mediaId, initialProgress = 0, videoType = 'standard' }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const saveProgressTimerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const { profile } = useAuth();
  const { error: showError } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [playerType, setPlayerType] = useState('standard'); // 'standard', 'youtube', 'drive'
  const [youtubeId, setYoutubeId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  // Detect video type and extract info
  useEffect(() => {
    const detectVideoType = () => {
      // Prioritize the provided videoType
      if (videoType === 'youtube' || videoType === 'drive') {
        setPlayerType(videoType);
      } else if (mediaUrl) {
        // Auto-detect based on URL
        if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
          setPlayerType('youtube');
          
          // Extract YouTube video ID
          const id = extractYouTubeId(mediaUrl);
          if (id) {
            setYoutubeId(id);
          } else {
            setError('URL do YouTube inválida');
          }
        } else if (mediaUrl.includes('drive.google.com')) {
          setPlayerType('drive');
        } else {
          setPlayerType('standard');
        }
      }
      
      setLoading(false);
    };

    detectVideoType();
  }, [mediaUrl, videoType]);

  // Handle mouse movement for control visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // Set new timeout to hide controls
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Initialize standard player for non-YouTube videos
  const initializeStandardPlayer = useCallback(async () => {
    if (typeof window === 'undefined' || !videoRef.current || playerRef.current) return;
    
    try {
      setLoading(true);
      // Dynamic import of Plyr
      const Plyr = (await import('plyr')).default;
      await import('plyr/dist/plyr.css');
      
      // Configure player
      playerRef.current = new Plyr(videoRef.current, {
        captions: { active: true },
        quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'duration',
          'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        keyboard: { focused: true, global: true },
        seekTime: 10,
        tooltips: { controls: true, seek: true },
        i18n: {
          restart: 'Reiniciar',
          rewind: 'Voltar {seektime}s',
          play: 'Reproduzir',
          pause: 'Pausar',
          fastForward: 'Avançar {seektime}s',
          seek: 'Buscar',
          seekLabel: '{currentTime} de {duration}',
          played: 'Reproduzido',
          buffered: 'Carregado',
          currentTime: 'Tempo atual',
          duration: 'Duração',
          volume: 'Volume',
          mute: 'Mudo',
          unmute: 'Ativar som',
          enableCaptions: 'Ativar legendas',
          disableCaptions: 'Desativar legendas',
          download: 'Download',
          enterFullscreen: 'Entrar em tela cheia',
          exitFullscreen: 'Sair da tela cheia',
          frameTitle: 'Player para {title}',
          captions: 'Legendas',
          settings: 'Configurações',
          pip: 'PIP',
          menuBack: 'Voltar ao menu anterior',
          speed: 'Velocidade',
          normal: 'Normal',
          quality: 'Qualidade',
          loop: 'Loop',
          start: 'Início',
          end: 'Fim',
          all: 'Tudo',
          reset: 'Reiniciar',
          disabled: 'Desativado',
          enabled: 'Ativado',
          advertisement: 'Anúncio',
          qualityBadge: {
            2160: '4K',
            1440: 'HD',
            1080: 'HD',
            720: 'HD',
            576: 'SD',
            480: 'SD'
          }
        }
      });
      
      // Event handlers
      playerRef.current.on('loadedmetadata', () => {
        setDuration(playerRef.current.duration || 0);
        // Set initial progress if provided
        if (initialProgress > 0 && playerRef.current) {
          playerRef.current.currentTime = initialProgress;
        }
        setLoaded(true);
        setLoading(false);
      });
      
      playerRef.current.on('timeupdate', () => {
        setCurrentTime(playerRef.current.currentTime || 0);
      });
      
      playerRef.current.on('enterfullscreen', () => {
        setIsFullscreen(true);
      });
      
      playerRef.current.on('exitfullscreen', () => {
        setIsFullscreen(false);
      });
      
      playerRef.current.on('error', (event) => {
        console.error('Player error:', event);
        setError('Erro ao reproduzir vídeo. Tente novamente.');
        showError('Falha ao carregar o vídeo. Verifique sua conexão com a internet.');
        setLoading(false);
      });
      
    } catch (error) {
      console.error('Error initializing player:', error);
      setError('Não foi possível inicializar o player de vídeo.');
      showError('Erro ao inicializar o player de vídeo.');
      setLoading(false);
    }
  }, [initialProgress, showError]);

  useEffect(() => {
    if ((playerType === 'standard' || playerType === 'drive') && videoRef.current && !playerRef.current) {
      initializeStandardPlayer();
    }
  }, [playerType, videoRef, initializeStandardPlayer]);

  // Handlers for YouTube player
  const handleYouTubePlayerReady = (player) => {
    setDuration(player.getDuration() || 0);
    setLoading(false);
    setLoaded(true);
  };
  
  const handleYouTubeTimeUpdate = (time) => {
    setCurrentTime(time || 0);
  };
  
  const handleYouTubeError = (errorCode) => {
    // Handle different YouTube error codes
    let errorMessage = 'Erro ao reproduzir vídeo do YouTube.';
    switch(errorCode) {
      case 2:
        errorMessage = 'Parâmetro inválido na URL do YouTube.';
        break;
      case 5:
        errorMessage = 'Erro de HTML5 player do YouTube.';
        break;
      case 100:
        errorMessage = 'Vídeo não encontrado ou foi removido.';
        break;
      case 101:
      case 150:
        errorMessage = 'O proprietário do vídeo não permite que ele seja reproduzido em players incorporados.';
        break;
    }
    setError(errorMessage);
    showError(errorMessage);
    setLoading(false);
  };

  // Save progress periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Clear any existing timer
    if (saveProgressTimerRef.current) {
      clearInterval(saveProgressTimerRef.current);
    }
    
    // Set new timer to save progress every 10 seconds
    saveProgressTimerRef.current = setInterval(() => {
      if (profile?.id && currentTime > 0 && duration > 0) {
        updateWatchProgress(mediaId, profile.id, currentTime, duration)
          .catch(err => console.error('Erro ao salvar progresso:', err));
      }
    }, 10000);

    return () => {
      if (saveProgressTimerRef.current) {
        clearInterval(saveProgressTimerRef.current);
      }
    };
  }, [mediaId, profile?.id, currentTime, duration]);

  // Save progress when leaving/pausing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleSaveOnExit = () => {
      if (profile?.id && currentTime > 0 && duration > 0) {
        updateWatchProgress(mediaId, profile.id, currentTime, duration)
          .catch(err => console.error('Erro ao salvar progresso final:', err));
      }
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    
    return () => {
      handleSaveOnExit();
      window.removeEventListener('beforeunload', handleSaveOnExit);
    };
  }, [mediaId, profile?.id, currentTime, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      
      if (saveProgressTimerRef.current) {
        clearInterval(saveProgressTimerRef.current);
      }
    };
  }, []);

  // Get the correct video source URL
  const getVideoSource = useCallback(() => {
    if (playerType === 'drive' && mediaUrl) {
      return formatGoogleDriveUrl(mediaUrl);
    }
    return mediaUrl;
  }, [playerType, mediaUrl]);

  // Format time for display
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/10 border-t-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black shadow-lg">
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
          <div className="mb-2 text-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-white">{error}</p>
          <button 
            className="rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef}
      className="relative aspect-video overflow-hidden rounded-lg bg-black shadow-lg"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {playerType === 'youtube' && youtubeId ? (
        // Render YouTube player
        <YouTubePlayer 
          videoId={youtubeId} 
          initialProgress={initialProgress}
          onTimeUpdate={handleYouTubeTimeUpdate}
          onPlayerReady={handleYouTubePlayerReady}
          onError={handleYouTubeError}
        />
      ) : (
        // Render standard player for normal videos and Drive
        <>
          <video
            ref={videoRef}
            className="h-full w-full"
            controls
            crossOrigin="anonymous"
            playsInline
            preload="metadata"
          >
            <source src={getVideoSource()} type="video/mp4" />
            <track kind="captions" />
          </video>
          
          {/* Custom overlay controls if desired */}
          {/* Removed for now as Plyr provides excellent controls */}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;