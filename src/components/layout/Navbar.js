import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';
import Button from '../ui/Button';

const Navbar = () => {
  const { user, profile, logout, setCurrentProfile, isAdmin } = useAuth();
  const { profiles } = useProfiles();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Handle clicks outside menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Profile menu
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      
      // Search box
      if (searchRef.current && !searchRef.current.contains(event.target) && !event.target.closest('button[data-search]')) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileSwitch = (newProfile) => {
    setCurrentProfile(newProfile);
    setShowMenu(false);
  };

  const defaultLogoSrc = "/images/logo.png";
  const defaultAvatarSrc = "/images/default-avatar.png";

  const navLinkClasses = (isActive) => 
    `relative py-2 transition-colors duration-200 ${
      isActive 
        ? 'text-white font-medium' 
        : 'text-text-secondary hover:text-white'
    }`;

  // Add active indicator for current section
  const activeIndicator = (isActive) => isActive && (
    <span className="absolute bottom-0 left-0 h-1 w-full bg-primary"></span>
  );
  
  return (
    <nav className="sticky top-0 z-50 bg-background-dark/90 backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link href="/browse" className="flex-shrink-0">
              <div className="w-24 h-8 relative">
                <Image 
                  src={defaultLogoSrc} 
                  alt="Zanflix" 
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <Link 
                href="/browse" 
                className={navLinkClasses(router.pathname === '/browse' && !router.query.category)}
              >
                Início
                {activeIndicator(router.pathname === '/browse' && !router.query.category)}
              </Link>
              <Link 
                href="/browse?category=filmes"
                className={navLinkClasses(router.query.category === 'filmes')}
              >
                Filmes
                {activeIndicator(router.query.category === 'filmes')}
              </Link>
              <Link 
                href="/browse?category=series"
                className={navLinkClasses(router.query.category === 'series')}
              >
                Séries
                {activeIndicator(router.query.category === 'series')}
              </Link>
              <Link 
                href="/favorites"
                className={navLinkClasses(router.pathname === '/favorites')}
              >
                Favoritos
                {activeIndicator(router.pathname === '/favorites')}
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin"
                  className={`relative py-2 transition-colors duration-200 ${
                    router.pathname.startsWith('/admin') 
                      ? 'text-primary font-medium' 
                      : 'text-primary hover:text-primary-light'
                  }`}
                >
                  Admin
                  {router.pathname.startsWith('/admin') && (
                    <span className="absolute bottom-0 left-0 h-1 w-full bg-primary"></span>
                  )}
                </Link>
              )}
            </div>
          </div>
          
          {/* Right side - search and profile */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            {showSearch ? (
              <div ref={searchRef} className="relative">
                <form onSubmit={handleSearch} className="flex items-center bg-background rounded-md overflow-hidden border border-background-light">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Títulos, pessoas, gêneros..."
                    className="bg-transparent border-none text-sm py-1 px-3 focus:ring-0 text-white w-full md:w-60"
                    autoFocus
                  />
                  <button type="submit" className="p-2 text-text-secondary hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button 
                    type="button" 
                    className="p-2 text-text-secondary hover:text-white"
                    onClick={() => setShowSearch(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              </div>
            ) : (
              <button 
                className="p-2 rounded-full text-text-secondary hover:text-white"
                onClick={() => setShowSearch(true)}
                data-search="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            {/* Profile Menu */}
            <div className="relative ml-3" ref={menuRef}>
              <button 
                className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="w-8 h-8 relative overflow-hidden rounded-full border-2 border-background">
                  <Image 
                    src={profile?.avatar_url || defaultAvatarSrc} 
                    alt={profile?.name || 'Perfil'} 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <svg className={`h-4 w-4 text-white transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-menu bg-background-light overflow-hidden border border-background-dark/50 divide-y divide-background-dark/50">
                  <div className="py-2">
                    {/* User profiles */}
                    <div className="px-4 py-2 bg-background-dark/30">
                      <p className="text-xs font-medium text-text-secondary">Perfis</p>
                    </div>
                    
                    {profiles.map(p => (
                      <button 
                        key={p.id}
                        className={`flex items-center w-full px-4 py-2 text-sm text-white ${p.id === profile?.id ? 'bg-primary/20' : 'hover:bg-background-dark'}`}
                        onClick={() => handleProfileSwitch(p)}
                      >
                        <div className="w-6 h-6 relative overflow-hidden rounded-full mr-3 bg-background-dark">
                          <Image 
                            src={p.avatar_url || defaultAvatarSrc} 
                            alt={p.name || 'Profile'} 
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span>{p.name}</span>
                        
                        {p.id === profile?.id && (
                          <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                    
                    <Link href="/profile/new" className="block" onClick={() => setShowMenu(false)}>
                      <div className="flex items-center px-4 py-2 text-sm text-white hover:bg-background-dark">
                        <div className="w-6 h-6 bg-background-dark rounded-full flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>Adicionar Perfil</span>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="py-2">
                    {/* Admin link (for admins only) */}
                    {isAdmin && (
                      <Link href="/admin" className="block" onClick={() => setShowMenu(false)}>
                        <div className="flex items-center px-4 py-2 text-sm text-primary hover:bg-background-dark font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Painel Administrativo
                        </div>
                      </Link>
                    )}
                    
                    {/* Profile management */}
                    <Link href={`/profile/${profile?.id}`} className="block" onClick={() => setShowMenu(false)}>
                      <div className="flex items-center px-4 py-2 text-sm text-white hover:bg-background-dark">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Gerenciar Perfil
                      </div>
                    </Link>
                    
                    {/* Logout */}
                    <button 
                      className="w-full flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-background-dark text-left"
                      onClick={logout}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-text-secondary hover:text-white focus:outline-none"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-background px-2 pt-2 pb-4 border-t border-background-light">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/browse" 
                className={`${router.pathname === '/browse' && !router.query.category ? 'text-white bg-primary-dark/10 border-l-4 border-primary' : 'text-text-secondary border-l-4 border-transparent'} block px-3 py-2 rounded-md font-medium`}
                onClick={() => setShowMobileMenu(false)}
              >
                Início
              </Link>
              <Link 
                href="/browse?category=filmes"
                className={`${router.query.category === 'filmes' ? 'text-white bg-primary-dark/10 border-l-4 border-primary' : 'text-text-secondary border-l-4 border-transparent'} block px-3 py-2 rounded-md font-medium`}
                onClick={() => setShowMobileMenu(false)}
              >
                Filmes
              </Link>
              <Link 
                href="/browse?category=series"
                className={`${router.query.category === 'series' ? 'text-white bg-primary-dark/10 border-l-4 border-primary' : 'text-text-secondary border-l-4 border-transparent'} block px-3 py-2 rounded-md font-medium`}
                onClick={() => setShowMobileMenu(false)}
              >
                Séries
              </Link>
              <Link 
                href="/favorites"
                className={`${router.pathname === '/favorites' ? 'text-white bg-primary-dark/10 border-l-4 border-primary' : 'text-text-secondary border-l-4 border-transparent'} block px-3 py-2 rounded-md font-medium`}
                onClick={() => setShowMobileMenu(false)}
              >
                Favoritos
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin"
                  className={`${router.pathname.startsWith('/admin') ? 'text-primary bg-primary-dark/10 border-l-4 border-primary' : 'text-primary border-l-4 border-transparent'} block px-3 py-2 rounded-md font-medium`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;