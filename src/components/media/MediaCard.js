import React, { memo } from 'react';
import Link from 'next/link';
import SafeImage from '../ui/SafeImage';

// Use memo to prevent unnecessary re-renders
const MediaCard = memo(({ media }) => {
  if (!media) return null;
  
  const progress = media.watch_progress && media.duration 
    ? (media.watch_progress / media.duration * 100) || 0 
    : 0;
  const hasProgress = media.watch_progress && media.watch_progress > 0 && progress < 95;
  
  // Format duration from seconds to minutes
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };
  
  return (
    <Link href={`/watch/${media.id}`}>
      <div className="group relative h-full overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-card-hover">
        {/* Image container */}
        <div className="aspect-video relative overflow-hidden rounded-t-lg bg-background-dark">
          <SafeImage 
            src={media.thumbnail_url || null}
            alt={media.title || 'Media item'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            placeholderClassName="bg-background-dark"
          />
          
          {/* Duration badge if available */}
          {media.duration > 0 && (
            <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-70 px-1.5 py-0.5 text-xs text-white">
              {formatDuration(media.duration)}
            </div>
          )}
          
          {/* Hover overlay with play button */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-90 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Info section */}
        <div className="p-3 bg-background-card rounded-b-lg">
          <h3 className="font-medium truncate text-sm">{media.title || 'Sem título'}</h3>
          
          {/* Progress bar */}
          {hasProgress && (
            <div className="mt-2 h-1 bg-background-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          <div className="mt-1 flex items-center justify-between">
            {media.category && (
              <span className="text-xs text-text-secondary">{media.category}</span>
            )}
            
            {/* If there's watch progress, show a "Continue" text */}
            {hasProgress && (
              <span className="text-xs text-primary">Continuar</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;