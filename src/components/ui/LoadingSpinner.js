import React from 'react'

const LoadingSpinner = ({ size = 'medium', message = null }) => {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-12 w-12 border-t-2 border-b-2',
    large: 'h-16 w-16 border-4'
  }
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-primary`}></div>
      {message && <p className="mt-4 text-text-secondary">{message}</p>}
    </div>
  )
}

export default LoadingSpinner