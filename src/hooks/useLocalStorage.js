import { useState, useEffect } from 'react';

/**
 * Custom hook to manage state with local storage
 * 
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value if not found in storage
 * @returns {Array} [storedValue, setValue, removeValue]
 */
function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });
  
  // Effect to update local storage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Save state to localStorage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // Log errors
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);
  
  // Function to remove value from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };
  
  return [storedValue, setStoredValue, removeValue];
}

export default useLocalStorage;