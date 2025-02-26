import React from 'react'
import SafeImage from './SafeImage'

const AdminThumbnail = ({ 
  src, 
  alt, 
  width = 80, 
  height = 45, 
  className = ''
}) => {
  return (
    <div className={`relative rounded overflow-hidden bg-background-dark ${className}`} 
      style={{ width: `${width}px`, height: `${height}px` }}>
      <SafeImage 
        src={src} 
        alt={alt} 
        fill
        className="object-cover"
        placeholderClassName="bg-background-dark"
      />
    </div>
  )
}

export default AdminThumbnail