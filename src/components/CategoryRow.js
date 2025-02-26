import React, { useRef, useState, useCallback, useEffect } from 'react'
import MediaCard from './MediaCard'
import { useInView } from 'react-intersection-observer'; // You'll need to install this package

const CategoryRow = ({ title, media = [] }) => {
  const rowRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Use Intersection Observer to lazy load rows
  const { ref: observerRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  
  // Set visibility when row comes into view
  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);
  
  const scroll = useCallback((direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75
      
      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      })
    }
  }, []);

  if (!media.length) {
    return null
  }

  return (
    <div className="mb-10" ref={observerRef}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      
      <div className="relative group">
        {media.length > 4 && (
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:scale-110"
            onClick={() => scroll('left')}
            aria-label="Rolar à esquerda"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        <div 
          className="flex space-x-4 overflow-x-auto scrollbar-hide py-2 px-1"
          ref={rowRef}
          style={{ scrollbarWidth: 'none' }}
        >
          {isVisible && media.map(item => (
            <div key={item.id} className="flex-shrink-0 w-60 md:w-64">
              <MediaCard media={item} />
            </div>
          ))}
          
          {!isVisible && media.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-60 md:w-64">
              <div className="aspect-video bg-background-dark animate-pulse rounded-md"></div>
              <div className="mt-2 h-4 bg-background-dark animate-pulse rounded-md"></div>
            </div>
          ))}
        </div>
        
        {media.length > 4 && (
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:scale-110"
            onClick={() => scroll('right')}
            aria-label="Rolar à direita"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default CategoryRow;