import React, { useEffect, useRef, useState } from 'react'
import { updateWatchProgress } from '../lib/mediaStorage'
import { useAuth } from '../hooks/useAuth'

const VideoPlayer = ({ mediaUrl, mediaId, initialProgress = 0 }) => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const { profile } = useAuth()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Importar Plyr apenas no lado do cliente
    const initializePlayer = async () => {
      if (typeof window !== 'undefined' && videoRef.current && !playerRef.current) {
        // Importação dinâmica do Plyr
        const Plyr = (await import('plyr')).default
        import('plyr/dist/plyr.css')
        
        // Configurações do Plyr
        playerRef.current = new Plyr(videoRef.current, {
          captions: { active: true },
          quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
          controls: [
            'play-large', // Botão play grande no centro
            'play', // Botão play/pause
            'progress', // Barra de progresso
            'current-time', // Tempo atual
            'duration', // Duração total
            'mute', // Botão mudo
            'volume', // Controle de volume
            'captions', // Legendas
            'settings', // Configurações
            'pip', // Picture-in-Picture
            'airplay', // Airplay (para dispositivos Apple)
            'fullscreen' // Tela cheia
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
        
        // Carregar o progresso inicial
        if (initialProgress > 0 && playerRef.current) {
          playerRef.current.once('canplay', () => {
            playerRef.current.currentTime = initialProgress;
          });
        }
        
        setLoaded(true);
      }
    };

    initializePlayer();
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoRef, initialProgress]);

  // Salvar progresso a cada 10 segundos
  useEffect(() => {
    if (typeof window === 'undefined' || !loaded) return;
    
    const saveProgressInterval = setInterval(() => {
      if (playerRef.current && profile?.id) {
        const currentTime = playerRef.current.currentTime;
        const duration = playerRef.current.duration;
        
        // Só salva se estiver vendo o vídeo (não se estiver pausado)
        if (!playerRef.current.paused && currentTime > 0) {
          updateWatchProgress(mediaId, profile.id, currentTime, duration)
            .catch(err => console.error('Erro ao salvar progresso:', err));
        }
      }
    }, 10000);

    return () => {
      clearInterval(saveProgressInterval);
    };
  }, [loaded, mediaId, profile?.id]);

  // Evento de salvamento ao sair/pausar
  useEffect(() => {
    if (typeof window === 'undefined' || !loaded) return;
    
    const handleSaveOnExit = () => {
      if (playerRef.current && profile?.id) {
        const currentTime = playerRef.current.currentTime;
        const duration = playerRef.current.duration;
        
        if (currentTime > 0) {
          updateWatchProgress(mediaId, profile.id, currentTime, duration)
            .catch(err => console.error('Erro ao salvar progresso final:', err));
        }
      }
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    
    return () => {
      handleSaveOnExit();
      window.removeEventListener('beforeunload', handleSaveOnExit);
    };
  }, [loaded, mediaId, profile?.id]);

  return (
    <div className="aspect-video bg-black rounded-lg shadow-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        crossOrigin="anonymous"
        playsInline
      >
        <source src={mediaUrl} type="video/mp4" />
        <track kind="captions" />
      </video>
    </div>
  );
};

export default VideoPlayer;