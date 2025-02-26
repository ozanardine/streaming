import { useState } from 'react'
import Image from 'next/image'

const SafeImage = ({ src, alt, fallbackSrc = '/images/default-thumbnail.png', ...props }) => {
  const [imgSrc, setImgSrc] = useState(src)
  
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
      unoptimized={src && (src.includes('supabase.co') || src.includes('drive.google.com'))}
    />
  )
}

export default SafeImage