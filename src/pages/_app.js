import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../lib/context/AuthContext';
import { ToastProvider } from '../lib/context/ToastContext';
import Toast from '../components/ui/Toast';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Handle global loading state for route changes
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);
  
  return (
    <ToastProvider>
      <AuthProvider>
        {loading && (
          <div className="fixed inset-0 bg-background-dark/50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <Component {...pageProps} />
        <Toast />
      </AuthProvider>
    </ToastProvider>
  );
}

export default MyApp;