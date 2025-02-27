import React from 'react'
import { useRouter } from 'next/router'

const ErrorDisplay = ({ message, buttonText = 'Voltar', onButtonClick = null }) => {
  const router = useRouter()
  
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick()
    } else {
      router.back()
    }
  }
  
  return (
    <div className="max-w-md mx-auto bg-background-light p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-red-500 mb-4">Erro</h2>
      <p className="mb-6">{message}</p>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
      >
        {buttonText}
      </button>
    </div>
  )
}

export default ErrorDisplay