import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { updateWatchProgress } from '../lib/mediaStorage';
import { useToast } from './useToast';

export const usePlayer = (mediaId = null) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buffering, setBuffering] = useState(false);
  const [quality, setQuality] = useState('auto');
  const saveIntervalRef = useRef(null);
  
  const { profile } = useAuth();
  const { error: showError } = useToast();

  // Alternar reprodução/pausa
  const togglePlay = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  // Avançar para um tempo específico
  const seek = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(time, duration || 0)));
  }, [duration]);

  // Definir volume
  const changeVolume = useCallback((vol) => {
    const newVolume = Math.max(0, Math.min(1, vol));
    setVolume(newVolume);
    
    if (newVolume > 0 && muted) {
      setMuted(false);
    }
  }, [muted]);

  // Alternar mudo
  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  // Alternar tela cheia
  const toggleFullscreen = useCallback(() => {
    setFullscreen(prev => !prev);
  }, []);

  // Salvar progresso periodicamente
  useEffect(() => {
    if (!mediaId || !profile || !duration) return;

    // Limpar qualquer intervalo existente
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        updateWatchProgress(mediaId, profile.id, currentTime, duration)
          .catch(err => {
            console.error('Error saving progress:', err);
          });
      }
    }, 10000); // A cada 10 segundos

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [mediaId, profile, currentTime, duration]);

  // Salvar progresso quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (mediaId && profile && currentTime > 0 && duration > 0) {
        updateWatchProgress(mediaId, profile.id, currentTime, duration)
          .catch(err => {
            console.error('Error saving final progress:', err);
          });
      }
    };
  }, [mediaId, profile, currentTime, duration]);

  // Lidar com o término da mídia
  const handleEnded = useCallback(() => {
    setPlaying(false);
    
    // Salvar progresso como concluído
    if (mediaId && profile && duration > 0) {
      updateWatchProgress(mediaId, profile.id, duration, duration)
        .catch(err => {
          console.error('Error saving completed progress:', err);
        });
    }
  }, [mediaId, profile, duration]);

  // Lidar com erros
  const handleError = useCallback((errorMessage) => {
    setError(errorMessage || 'Erro ao reproduzir vídeo');
    setLoading(false);
    setPlaying(false);
    setBuffering(false);
    showError(errorMessage || 'Erro ao reproduzir vídeo. Tente novamente.');
  }, [showError]);

  // Lidar com o carregamento da mídia
  const handleLoaded = useCallback((mediaDuration, initialTime = 0) => {
    setDuration(mediaDuration || 0);
    setCurrentTime(initialTime || 0);
    setLoading(false);
    
    // Iniciar reprodução automática se desejado
    if (options?.autoplay) {
      setPlaying(true);
    }
  }, []);

  // Lidar com atualização de tempo
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time || 0);
  }, []);

  // Mudar qualidade do vídeo
  const changeQuality = useCallback((newQuality) => {
    setQuality(newQuality);
  }, []);

  // Alternar modo de buffer
  const handleBuffering = useCallback((isBuffering) => {
    setBuffering(isBuffering);
  }, []);

  // Calcular o percentual de progresso
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Formatar tempo para exibição (ex: 1:23)
  const formatTime = useCallback((timeInSeconds) => {
    if (typeof timeInSeconds !== 'number' || isNaN(timeInSeconds)) {
      return '0:00';
    }
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Calcular tempo restante
  const remainingTime = duration > currentTime ? duration - currentTime : 0;

  return {
    // Estado
    playing,
    currentTime,
    duration,
    volume,
    muted,
    fullscreen,
    loading,
    error,
    buffering,
    quality,
    progressPercentage,
    
    // Ações
    setPlaying,
    togglePlay,
    seek,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    changeQuality,
    
    // Manipuladores de eventos
    handleEnded,
    handleError,
    handleLoaded,
    handleTimeUpdate,
    handleBuffering,
    
    // Utilitários
    formatTime,
    remainingTime
  };
};