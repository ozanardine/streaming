import React from 'react'
import Image from 'next/image'

const AdminThumbnail = ({ 
  src, 
  alt, 
  width = 80, 
  height = 45, 
  className = ''
}) => {
  // Ensure we always have a fallback image path for src
  const imageSrc = src || '/images/default-thumbnail.png'
  
  return (
    <div className={`relative rounded overflow-hidden bg-background-dark ${className}`} 
      style={{ width: `${width}px`, height: `${height}px` }}>
      {src ? (
        <Image 
          src={imageSrc} 
          alt={alt || 'Thumbnail'} 
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full text-text-secondary text-xs">
          {alt || 'Sem imagem'}
        </div>
      )}
    </div>
  )
}

export default AdminThumbnail