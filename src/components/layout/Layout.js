import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import SEO from './SEO';

/**
 * Main layout component that wraps all pages
 */
const Layout = ({ 
  children, 
  title = 'Zanflix',
  description = 'Sua plataforma de streaming personalizada',
  showNavbar = true,
  showFooter = true,
  fullWidth = false,
  withGradient = false
}) => {
  const { user, profile } = useAuth();
  
  return (
    <>
      <SEO title={title} description={description} />
      
      <div className="relative min-h-screen flex flex-col bg-background text-text">
        {/* Optional background gradient */}
        {withGradient && (
          <div className="absolute inset-0 bg-gradient-radial from-background-dark to-background pointer-events-none"></div>
        )}
        
        {/* Navbar - only show if user and profile exist and showNavbar is true */}
        {showNavbar && (user && profile) && <Navbar />}
        
        {/* Main content */}
        <main className={`relative flex-grow px-4 py-6 md:px-6 lg:px-8 ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
          {children}
        </main>
        
        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </>
  );
};

export default Layout;