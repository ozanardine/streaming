import React, { useEffect, useRef, useState } from 'react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import { updateWatchProgress } from '../lib/mediaStorage'
import { useAuth } from '../hooks/useAuth'

const VideoPlayer = ({ mediaUrl, mediaId, initialProgress = 0 }) => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const { profile } = useAuth()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        captions: { active: true },
        quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] }
      })
      
      // Carregar o progresso inicial
      if (initialProgress > 0 && playerRef.current) {
        playerRef.current.once('canplay', () => {
          playerRef.current.currentTime = initialProgress
        })
      }
      
      setLoaded(true)

      // Salvar progresso a cada 10 segundos
      const saveProgressInterval = setInterval(() => {
        if (playerRef.current && profile?.id) {
          const currentTime = playerRef.current.currentTime
          const duration = playerRef.current.duration
          
          // Só salva se estiver vendo o vídeo (não se estiver pausado)
          if (!playerRef.current.paused && currentTime > 0) {
            updateWatchProgress(mediaId, profile.id, currentTime, duration)
              .catch(err => console.error('Erro ao salvar progresso:', err))
          }
        }
      }, 10000)

      return () => {
        clearInterval(saveProgressInterval)
        if (playerRef.current) {
          playerRef.current.destroy()
        }
      }
    }
  }, [videoRef, mediaId, profile?.id, initialProgress])

  // Evento de salvamento ao sair/pausar
  useEffect(() => {
    const handleSaveOnExit = () => {
      if (playerRef.current && profile?.id) {
        const currentTime = playerRef.current.currentTime
        const duration = playerRef.current.duration
        
        if (currentTime > 0) {
          updateWatchProgress(mediaId, profile.id, currentTime, duration)
            .catch(err => console.error('Erro ao salvar progresso final:', err))
        }
      }
    }

    window.addEventListener('beforeunload', handleSaveOnExit)
    
    return () => {
      handleSaveOnExit()
      window.removeEventListener('beforeunload', handleSaveOnExit)
    }
  }, [mediaId, profile?.id])

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        className="plyr-react plyr"
        controls
        crossOrigin="anonymous"
        playsInline
      >
        <source src={mediaUrl} type="video/mp4" />
        <track kind="captions" />
      </video>
    </div>
  )
}

export default VideoPlayer