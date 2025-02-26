import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useProfiles } from '../hooks/useProfiles'

const Navbar = () => {
  const { user, profile, logout, setCurrentProfile, isAdmin } = useAuth()
  const { profiles } = useProfiles()
  const [showMenu, setShowMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef(null)
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleProfileSwitch = (newProfile) => {
    setCurrentProfile(newProfile)
    setShowMenu(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/browse" className="flex-shrink-0">
              <div className="w-24 h-8 relative">
                <Image 
                  src="/images/logo.png" 
                  alt="Zanflix" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-8">
                <Link 
                  href="/browse" 
                  className={`${router.pathname === '/browse' ? 'text-white font-medium' : 'text-gray-300 hover:text-white'} transition-colors duration-200`}
                >
                  Início
                </Link>
                <Link 
                  href="/browse?category=filmes"
                  className={`${router.query.category === 'filmes' ? 'text-white font-medium' : 'text-gray-300 hover:text-white'} transition-colors duration-200`}
                >
                  Filmes
                </Link>
                <Link 
                  href="/browse?category=series"
                  className={`${router.query.category === 'series' ? 'text-white font-medium' : 'text-gray-300 hover:text-white'} transition-colors duration-200`}
                >
                  Séries
                </Link>
                <Link 
                  href="/favorites"
                  className={`${router.pathname === '/favorites' ? 'text-white font-medium' : 'text-gray-300 hover:text-white'} transition-colors duration-200`}
                >
                  Favoritos
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin"
                    className={`${router.pathname.startsWith('/admin') ? 'text-primary font-medium' : 'text-primary hover:text-primary-light'} transition-colors duration-200`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center bg-background-dark rounded-md overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Títulos, pessoas, gêneros..."
                  className="bg-transparent border-none text-sm py-1 px-3 focus:ring-0 text-white w-full md:w-60"
                  autoFocus
                />
                <button type="submit" className="p-2 text-gray-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button 
                  type="button" 
                  className="p-2 text-gray-300 hover:text-white"
                  onClick={() => setShowSearch(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            ) : (
              <button 
                className="p-2 rounded-full text-gray-300 hover:text-white"
                onClick={() => setShowSearch(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            <div className="relative ml-4" ref={menuRef}>
              <button 
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="w-8 h-8 relative overflow-hidden rounded-md">
                  <Image 
                    src={profile?.avatar_url || '/images/default-avatar.png'} 
                    alt={profile?.name || 'Perfil'} 
                    fill
                    className="object-cover"
                  />
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-menu bg-background-light overflow-hidden">
                  <div className="py-2">
                    {profiles.map(p => (
                      <button 
                        key={p.id}
                        className={`flex items-center w-full px-4 py-2 text-sm text-white ${p.id === profile?.id ? 'bg-primary/20' : 'hover:bg-background-dark'}`}
                        onClick={() => handleProfileSwitch(p)}
                      >
                        <div className="w-6 h-6 relative overflow-hidden rounded mr-3">
                          <Image 
                            src={p.avatar_url || '/images/default-avatar.png'} 
                            alt={p.name} 
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span>{p.name}</span>
                      </button>
                    ))}
                    
                    <Link href="/profile/new" className="block" onClick={() => setShowMenu(false)}>
                      <div className="flex items-center px-4 py-2 text-sm text-white hover:bg-background-dark">
                        <div className="w-6 h-6 bg-background-dark rounded flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>Adicionar Perfil</span>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="border-t border-background">
                    {/* Link para Admin Panel (apenas para admins) */}
                    {isAdmin && (
                      <Link href="/admin" className="block" onClick={() => setShowMenu(false)}>
                        <div className="px-4 py-2 text-sm text-primary hover:bg-background-dark font-medium">
                          Painel Administrativo
                        </div>
                      </Link>
                    )}
                    
                    <Link href={`/profile/${profile?.id}`} className="block" onClick={() => setShowMenu(false)}>
                      <div className="px-4 py-2 text-sm text-white hover:bg-background-dark">
                        Gerenciar Perfil
                      </div>
                    </Link>
                    
                    <button 
                      className="w-full px-4 py-2 text-sm text-text-secondary hover:bg-background-dark text-left"
                      onClick={logout}
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden border-t border-background-light mt-2 pt-2 pb-3">
          <div className="flex flex-wrap space-x-3">
            <Link 
              href="/browse" 
              className={`${router.pathname === '/browse' ? 'text-white' : 'text-gray-300'} px-3 py-1 text-sm font-medium`}
            >
              Início
            </Link>
            <Link 
              href="/browse?category=filmes"
              className={`${router.query.category === 'filmes' ? 'text-white' : 'text-gray-300'} px-3 py-1 text-sm font-medium`}
            >
              Filmes
            </Link>
            <Link 
              href="/browse?category=series"
              className={`${router.query.category === 'series' ? 'text-white' : 'text-gray-300'} px-3 py-1 text-sm font-medium`}
            >
              Séries
            </Link>
            <Link 
              href="/favorites"
              className={`${router.pathname === '/favorites' ? 'text-white' : 'text-gray-300'} px-3 py-1 text-sm font-medium`}
            >
              Favoritos
            </Link>
            {isAdmin && (
              <Link 
                href="/admin"
                className="text-primary px-3 py-1 text-sm font-medium"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar