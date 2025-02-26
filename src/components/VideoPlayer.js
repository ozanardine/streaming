import React, { useEffect, useRef, useState } from 'react'
import { updateWatchProgress } from '../lib/mediaStorage'
import { useAuth } from '../hooks/useAuth'

// Função utilitária para verificar e extrair IDs do YouTube
const getYoutubeID = (url) => {
  // Padrões possíveis de URLs do YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\?]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Verificar se a URL é do Google Drive
const isGoogleDriveUrl = (url) => {
  return url.includes('drive.google.com');
}

// Formatar URL do Google Drive para reprodução direta
const formatGoogleDriveUrl = (url) => {
  // Extrair o ID do arquivo do Google Drive
  const fileIdMatch = url.match(/\/d\/([^\/]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }
  // Tentar extrair de links de visualização
  const viewerMatch = url.match(/id=([^&]+)/);
  if (viewerMatch && viewerMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${viewerMatch[1]}`;
  }
  return url;
}

const VideoPlayer = ({ mediaUrl, mediaId, initialProgress = 0 }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const { profile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [isYoutube, setIsYoutube] = useState(false);
  const [youtubeId, setYoutubeId] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [playerType, setPlayerType] = useState('standard'); // 'standard', 'youtube', 'drive'

  useEffect(() => {
    // Detectar o tipo de vídeo
    const youtubeID = getYoutubeID(mediaUrl);
    
    if (youtubeID) {
      setIsYoutube(true);
      setYoutubeId(youtubeID);
      setPlayerType('youtube');
    } else if (isGoogleDriveUrl(mediaUrl)) {
      setPlayerType('drive');
    } else {
      setPlayerType('standard');
    }
  }, [mediaUrl]);

  // Inicializar o player do YouTube
  useEffect(() => {
    if (playerType === 'youtube' && youtubeId && typeof window !== 'undefined') {
      // Carregar a API do YouTube se ainda não estiver carregada
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = initYoutubePlayer;
      } else {
        initYoutubePlayer();
      }
    }
    
    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, [youtubeId, playerType]);
  
  // Inicializar o player padrão para vídeos não-YouTube
  useEffect(() => {
    if (playerType !== 'youtube' && typeof window !== 'undefined' && videoRef.current && !playerRef.current) {
      const initializePlayer = async () => {
        // Importação dinâmica do Plyr
        const Plyr = (await import('plyr')).default;
        import('plyr/dist/plyr.css');
        
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
      };

      initializePlayer();
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoRef, initialProgress, playerType]);

  // Função para inicializar o player do YouTube
  const initYoutubePlayer = () => {
    if (!youtubeId || youtubePlayerRef.current) return;
    
    const container = document.getElementById('youtube-player-container');
    if (!container) return;
    
    youtubePlayerRef.current = new window.YT.Player('youtube-player-container', {
      height: '100%',
      width: '100%',
      videoId: youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        start: Math.floor(initialProgress)
      },
      events: {
        onReady: (event) => {
          if (initialProgress > 0) {
            event.target.seekTo(initialProgress);
          }
          setDuration(event.target.getDuration());
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            // Iniciar monitoramento de tempo para YouTube
            startYouTubeTimeTracking();
          }
        }
      }
    });
  };
  
  // Monitorar tempo de reprodução do YouTube
  const startYouTubeTimeTracking = () => {
    const interval = setInterval(() => {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        setCurrentTime(youtubePlayerRef.current.getCurrentTime());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  };

  // Salvar progresso a cada 10 segundos
  useEffect(() => {
    if (typeof window === 'undefined' || (!loaded && !youtubePlayerRef.current)) return;
    
    const saveProgressInterval = setInterval(() => {
      if (profile?.id) {
        // Obter tempo atual dependendo do tipo de player
        let playerTime = 0;
        let playerDuration = 0;
        let isPlaying = false;
        
        if (playerType === 'youtube' && youtubePlayerRef.current) {
          try {
            playerTime = youtubePlayerRef.current.getCurrentTime() || 0;
            playerDuration = youtubePlayerRef.current.getDuration() || 0;
            isPlaying = youtubePlayerRef.current.getPlayerState() === 1; // 1 = playing
          } catch (e) {
            console.error('Erro ao obter tempo do YouTube:', e);
          }
        } else if (playerRef.current) {
          playerTime = playerRef.current.currentTime;
          playerDuration = playerRef.current.duration;
          isPlaying = !playerRef.current.paused;
        }
        
        // Só salva se estiver vendo o vídeo (não se estiver pausado)
        if (isPlaying && playerTime > 0) {
          updateWatchProgress(mediaId, profile.id, playerTime, playerDuration)
            .catch(err => console.error('Erro ao salvar progresso:', err));
        }
      }
    }, 10000);

    return () => {
      clearInterval(saveProgressInterval);
    };
  }, [loaded, mediaId, profile?.id, playerType]);

  // Evento de salvamento ao sair/pausar
  useEffect(() => {
    if (typeof window === 'undefined' || (!loaded && !youtubePlayerRef.current)) return;
    
    const handleSaveOnExit = () => {
      if (profile?.id) {
        let playerTime = 0;
        let playerDuration = 0;
        
        if (playerType === 'youtube' && youtubePlayerRef.current) {
          try {
            playerTime = youtubePlayerRef.current.getCurrentTime() || 0;
            playerDuration = youtubePlayerRef.current.getDuration() || 0;
          } catch (e) {
            console.error('Erro ao obter tempo do YouTube (saída):', e);
          }
        } else if (playerRef.current) {
          playerTime = playerRef.current.currentTime;
          playerDuration = playerRef.current.duration;
        }
        
        if (playerTime > 0) {
          updateWatchProgress(mediaId, profile.id, playerTime, playerDuration)
            .catch(err => console.error('Erro ao salvar progresso final:', err));
        }
      }
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    
    return () => {
      handleSaveOnExit();
      window.removeEventListener('beforeunload', handleSaveOnExit);
    };
  }, [loaded, mediaId, profile?.id, playerType]);

  // Determinar que URL usar para vídeos padrão
  const getVideoSource = () => {
    if (playerType === 'drive') {
      return formatGoogleDriveUrl(mediaUrl);
    }
    return mediaUrl;
  };

  return (
    <div className="aspect-video bg-black rounded-lg shadow-lg overflow-hidden relative">
      {playerType === 'youtube' ? (
        // Renderizar container para YouTube
        <div id="youtube-player-container" className="w-full h-full"></div>
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