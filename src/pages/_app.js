import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../hooks/useAuth';
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
        {/* Componentes de loading e toast... */}
        <Component {...pageProps} />
      </AuthProvider>
    </ToastProvider>
  );
}

export default MyApp;