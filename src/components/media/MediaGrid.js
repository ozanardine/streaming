import React from 'react';
import MediaCard from './MediaCard';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * A responsive grid layout for displaying media items
 * 
 * @param {Array} items - Array of media items to display
 * @param {boolean} loading - Whether items are loading
 * @param {string} emptyMessage - Message to display when no items are available
 * @param {number} columns - Number of columns on mobile (will be doubled on larger screens)
 * @param {Function} renderItem - Custom render function for items (defaults to MediaCard)
 */
const MediaGrid = ({
  items = [],
  loading = false,
  emptyMessage = "Nenhum conteúdo encontrado",
  columns = 2,
  renderItem,
  className = "",
}) => {
  // Calculate column classes based on the columns prop
  const getGridCols = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 2:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 3:
        return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      default:
        return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Carregando conteúdo..." />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-background-light/20 p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-lg text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${getGridCols()} gap-4 md:gap-6 ${className}`}>
      {items.map((item, index) =>
        renderItem ? (
          renderItem(item, index)
        ) : (
          <div key={item.id || index} className="flex flex-col h-full">
            <MediaCard media={item} />
          </div>
        )
      )}
    </div>
  );
};

export default MediaGrid;