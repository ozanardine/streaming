import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const MediaCard = ({ media }) => {
  return (
    <Link href={`/watch/${media.id}`}>
      <div className="media-card">
        <div className="media-thumbnail">
          {media.thumbnail_url ? (
            <Image 
              src={media.thumbnail_url} 
              alt={media.title} 
              width={300} 
              height={169} 
              layout="responsive"
            />
          ) : (
            <div className="no-thumbnail">
              <span>{media.title}</span>
            </div>
          )}
        </div>
        <div className="media-info">
          <h3>{media.title}</h3>
          {media.watch_progress && media.watch_progress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${(media.watch_progress / media.duration) * 100}%`}}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default MediaCard