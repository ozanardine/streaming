import { useState, useEffect } from 'react'
import Image from 'next/image'

const SafeImage = ({ 
  src, 
  alt, 
  fallbackSrc = '/images/default-thumbnail.png', 
  placeholderClassName = 'bg-background-dark',
  loading = 'lazy',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(fallbackSrc)
  const [imgError, setImgError] = useState(!src)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Only update source if it's a valid string
    if (typeof src === 'string' && src.trim() !== '') {
      setImgSrc(src)
      setImgError(false)
    } else {
      setImgSrc(fallbackSrc)
      setImgError(true)
    }
    setIsLoading(true)
  }, [src, fallbackSrc])

  // If there's no valid src or there's already an error, show placeholder
  if (!imgSrc || imgError) {
    return (
      <div 
        className={`${placeholderClassName} flex items-center justify-center h-full w-full ${props.className || ''}`}
        style={props.style || {}}
      >
        <span className="text-text-secondary text-sm text-center p-2 truncate">
          {alt || 'Sem imagem'}
        </span>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className={`${placeholderClassName} absolute inset-0 flex items-center justify-center ${props.className || ''}`}>
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        {...props}
        src={imgSrc}
        alt={alt || 'Imagem'}
        loading={loading}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc)
          setImgError(true)
          setIsLoading(false)
        }}
        unoptimized={true}
      />
    </>
  )
}

export default SafeImage