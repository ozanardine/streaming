import { useState } from 'react'
import Image from 'next/image'

const SafeImage = ({ 
  src, 
  alt, 
  fallbackSrc = '/images/default-thumbnail.png', 
  placeholderClassName = 'bg-background-dark',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src)
  const [imgError, setImgError] = useState(!src)

  // Se não houver src ou já houver um erro, mostrar placeholder
  if (!src || imgError) {
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
    <Image
      {...props}
      src={imgSrc}
      alt={alt || 'Imagem'}
      onError={() => {
        setImgSrc(fallbackSrc)
        setImgError(true)
      }}
      unoptimized={true} // Importante: desativa a otimização do Next.js
    />
  )
}

export default SafeImage