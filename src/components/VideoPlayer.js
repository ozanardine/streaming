import React, { useEffect, useRef, useState } from 'react'
import { updateWatchProgress } from '../lib/mediaStorage'
import { useAuth } from '../hooks/useAuth'
import { extractYouTubeId, formatGoogleDriveUrl } from '../lib/videoHelpers'

// Componente separado para o Player do YouTube
const YouTubePlayer = ({ videoId, initialProgress, onTimeUpdate, onPlayerReady }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  
  useEffect(() => {
    // Função para inicializar o player do YouTube
    const loadYouTubePlayer = () => {
      if (!window.YT) {
        // Carregar a API do YouTube se ainda não estiver disponível
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
        
        // Configurar callback global para quando a API estiver pronta
        window.onYouTubeIframeAPIReady = initPlayer;
      } else {
        initPlayer();
      }
    };
    
    // Inicializar o player quando a API estiver pronta
    const initPlayer = () => {
      // Verificar se o player já foi inicializado ou se o container não existe
      if (playerRef.current || !containerRef.current) return;
      
      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0,
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
              // Quando o vídeo está em reprodução, começar a monitorar o tempo
              if (event.data === window.YT.PlayerState.PLAYING) {
                startTimeTracking();
              }
            }
          }
        });
      } catch (error) {
        console.error('Erro ao inicializar player do YouTube:', error);
      }
    };
    
    // Acompanhar o tempo de reprodução do YouTube
    const startTimeTracking = () => {
      if (!playerRef.current) return;
      
      const interval = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            if (typeof onTimeUpdate === 'function') {
              onTimeUpdate(currentTime);
            }
          }
        } catch (e) {
          console.error('Erro ao obter tempo do YouTube:', e);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    };
    
    loadYouTubePlayer();
    
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, initialProgress, onTimeUpdate, onPlayerReady]);

  return <div ref={containerRef} className="w-full h-full" />;
};

const VideoPlayer = ({ mediaUrl, mediaId, initialProgress = 0, videoType = 'standard' }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const { profile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [playerType, setPlayerType] = useState('standard'); // 'standard', 'youtube', 'drive'
  const [youtubeId, setYoutubeId] = useState(null);

  // Detectar tipo de vídeo
  useEffect(() => {
    // Priorizar o videoType fornecido como prop
    if (videoType === 'youtube' || videoType === 'drive') {
      setPlayerType(videoType);
    } else if (mediaUrl) {
      // Detectar baseado na URL
      if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
        setPlayerType('youtube');
        
        // Extrair ID do vídeo do YouTube
        const id = extractYouTubeId(mediaUrl);
        if (id) {
          setYoutubeId(id);
        }
      } else if (mediaUrl.includes('drive.google.com')) {
        setPlayerType('drive');
      } else {
        setPlayerType('standard');
      }
    }
  }, [mediaUrl, videoType]);

  // Extrair ID do YouTube quando player type for 'youtube'
  useEffect(() => {
    if (playerType === 'youtube' && mediaUrl && !youtubeId) {
      const id = extractYouTubeId(mediaUrl);
      if (id) {
        setYoutubeId(id);
      } else {
        console.error('Não foi possível extrair ID do YouTube da URL:', mediaUrl);
      }
    }
  }, [playerType, mediaUrl, youtubeId]);

  // Inicializar o player padrão para vídeos não-YouTube
  useEffect(() => {
    if ((playerType === 'standard' || playerType === 'drive') && 
        typeof window !== 'undefined' && 
        videoRef.current && 
        !playerRef.current) {
      
      const initializePlayer = async () => {
        try {
          // Importação dinâmica do Plyr
          const Plyr = (await import('plyr')).default;
          await import('plyr/dist/plyr.css');
          
          // Configurações do Plyr
          playerRef.current = new Plyr(videoRef.current, {
            captions: { active: true },
            quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
            controls: [
              'play-large', 'play', 'progress', 'current-time', 'duration',
              'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            keyboard: { focused: true, global: true },
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
          
          // Obter duração quando disponível
          playerRef.current.on('loadedmetadata', () => {
            setDuration(playerRef.current.duration || 0);
          });
          
          // Atualizar tempo atual
          playerRef.current.on('timeupdate', () => {
            setCurrentTime(playerRef.current.currentTime || 0);
          });
          
          // Carregar o progresso inicial
          if (initialProgress > 0 && playerRef.current) {
            playerRef.current.once('canplay', () => {
              playerRef.current.currentTime = initialProgress;
            });
          }
          
          setLoaded(true);
        } catch (error) {
          console.error('Erro ao inicializar player:', error);
        }
      };

      initializePlayer();
    }
    
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoRef, initialProgress, playerType]);

  // Manipuladores para o player do YouTube
  const handleYouTubePlayerReady = (player) => {
    setDuration(player.getDuration() || 0);
  };
  
  const handleYouTubeTimeUpdate = (time) => {
    setCurrentTime(time || 0);
  };

  // Salvar progresso a cada 10 segundos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saveProgressInterval = setInterval(() => {
      if (profile?.id && currentTime > 0 && duration > 0) {
        updateWatchProgress(mediaId, profile.id, currentTime, duration)
          .catch(err => console.error('Erro ao salvar progresso:', err));
      }
    }, 10000);

    return () => {
      clearInterval(saveProgressInterval);
    };
  }, [mediaId, profile?.id, currentTime, duration]);

  // Evento de salvamento ao sair/pausar
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

  // Determinar que URL usar para vídeos padrão
  const getVideoSource = () => {
    if (playerType === 'drive' && mediaUrl) {
      return formatGoogleDriveUrl(mediaUrl);
    }
    return mediaUrl;
  };

  return (
    <div className="aspect-video bg-black rounded-lg shadow-lg overflow-hidden relative">
      {playerType === 'youtube' && youtubeId ? (
        // Renderizar player do YouTube
        <YouTubePlayer 
          videoId={youtubeId} 
          initialProgress={initialProgress}
          onTimeUpdate={handleYouTubeTimeUpdate}
          onPlayerReady={handleYouTubePlayerReady}
        />
      ) : (
        // Renderizar player padrão para vídeos normais e Drive
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          crossOrigin="anonymous"
          playsInline
        >
          <source src={getVideoSource()} type="video/mp4" />
          <track kind="captions" />
        </video>
      )}
    </div>
  );
};

export default VideoPlayer;