import React, { useEffect, useState } from 'react';
import { TOAST_TYPES, useToast } from '../../lib/context/ToastContext';

// Individual Toast component
const ToastItem = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    // Set auto-dismiss timer based on toast duration
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [toast.duration]);
  
  useEffect(() => {
    if (isExiting) {
      const exitTimer = setTimeout(() => {
        onRemove(toast.id);
      }, 300);
      
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, onRemove, toast.id]);
  
  const handleRemove = () => {
    setIsExiting(true);
  };

  // Icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case TOAST_TYPES.ERROR:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
        );
      case TOAST_TYPES.WARNING:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        );
        case TOAST_TYPES.INFO:
          default:
            return (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
            );
        }
      };
    
      // Background color based on toast type
      const getBackground = () => {
        switch (toast.type) {
          case TOAST_TYPES.SUCCESS:
            return 'bg-success bg-opacity-90';
          case TOAST_TYPES.ERROR:
            return 'bg-error bg-opacity-90';
          case TOAST_TYPES.WARNING:
            return 'bg-warning bg-opacity-90';
          case TOAST_TYPES.INFO:
          default:
            return 'bg-primary bg-opacity-90';
        }
      };
    
      return (
        <div 
          className={`flex items-center p-4 mb-3 rounded-md shadow-lg ${getBackground()} transform transition-all duration-300 ${
            isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="flex-shrink-0 mr-3 text-white">
            {getIcon()}
          </div>
          <div className="flex-1 text-white text-sm">
            {toast.message}
          </div>
          <button 
            onClick={handleRemove}
            className="ml-4 text-white hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      );
    };
    
    // Toast container component
    const Toast = () => {
      const { toasts, removeToast } = useToast();
    
      if (!toasts || toasts.length === 0) {
        return null;
      }
    
      return (
        <div className="fixed top-4 right-4 z-50 w-72 max-w-full">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      );
    };
    
    export default Toast;