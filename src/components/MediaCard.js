import React, { memo } from 'react'
import Link from 'next/link'
import SafeImage from './SafeImage'

// Use memo to prevent unnecessary re-renders
const MediaCard = memo(({ media }) => {
  if (!media) return null;
  
  const progress = media.watch_progress && media.duration 
    ? (media.watch_progress / media.duration * 100) || 0 
    : 0
  const hasProgress = media.watch_progress && media.watch_progress > 0 && progress < 95
  
  return (
    <Link href={`/watch/${media.id}`}>
      <div className="media-card group h-full">
        <div className="aspect-video relative rounded-md overflow-hidden bg-background-dark">
          <SafeImage 
            src={media.thumbnail_url || null} // Explicitly pass null instead of undefined
            alt={media.title || 'Media item'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover"
            placeholderClassName="bg-background-dark"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="rounded-full w-12 h-12 bg-primary/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="px-1 py-2">
          <h3 className="text-sm font-medium truncate">{media.title || 'Sem título'}</h3>
          
          {/* Progress bar */}
          {hasProgress && (
            <div className="mt-2 h-1 bg-background-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {media.category && (
            <div className="mt-1">
              <span className="text-xs text-text-secondary">{media.category}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;