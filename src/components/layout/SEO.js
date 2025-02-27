import React from 'react';
import Head from 'next/head';

/**
 * SEO component for managing all meta tags and document head elements
 * 
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} canonicalUrl - Canonical URL for the page
 * @param {string} ogImage - Open Graph image URL
 * @param {string} ogType - Open Graph type (website, article, etc)
 * @param {Array} keywords - Keywords for meta tags
 */
const SEO = ({
  title = 'Zanflix',
  description = 'Sua plataforma de streaming personalizada',
  canonicalUrl,
  ogImage = '/images/og-image.jpg',
  ogType = 'website',
  keywords = ['streaming', 'zanflix', 'filmes', 'séries', 'animes'],
}) => {
  // Format the full title with site name
  const fullTitle = title === 'Zanflix' ? title : `${title} | Zanflix`;
  
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Favicon */}
      <link rel="icon" href="/images/logo.png" />
      <link rel="apple-touch-icon" href="/images/logo.png" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="Zanflix" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Color Theme */}
      <meta name="theme-color" content="#e91e63" />
      <meta name="msapplication-TileColor" content="#e91e63" />
      
      {/* Font preloading */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
    </Head>
  );
};

export default SEO;