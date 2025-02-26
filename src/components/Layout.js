import React from 'react'
import Head from 'next/head'
import Navbar from './Navbar'
import { useAuth } from '../hooks/useAuth'

const Layout = ({ children, title = 'Streaming Familiar' }) => {
  const { user, profile } = useAuth()
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Plataforma de streaming para sua família" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        {(user && profile) && <Navbar />}
        
        <main className="flex-grow px-4 py-6 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="bg-background-dark py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-text-secondary text-sm">
              © {new Date().getFullYear()} Streaming Familiar - Feito com ❤️ para sua família
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Layout