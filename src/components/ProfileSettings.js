import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useProfiles } from '../hooks/useProfiles'
import { useAuth } from '../hooks/useAuth'

const avatarOptions = [
  '/images/avatars/avatar1.png',
  '/images/avatars/avatar2.png',
  '/images/avatars/avatar3.png',
  '/images/avatars/avatar4.png',
  '/images/avatars/avatar5.png',
  '/images/avatars/avatar6.png',
  '/images/avatars/avatar7.png',
  '/images/avatars/avatar8.png',
  '/images/avatars/avatar9.png',
  '/images/avatars/avatar10.png',
  '/images/avatars/avatar11.png',
  '/images/avatars/avatar12.png',
  '/images/default-avatar.png'
]

const ProfileSettings = ({ profileId, isNew = false }) => {
  const { profiles, createProfile, updateProfile, deleteProfile } = useProfiles()
  const { setCurrentProfile, profile: currentProfile } = useAuth()
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('/images/default-avatar.png')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [customAvatar, setCustomAvatar] = useState(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const router = useRouter()

  // Carregar dados do perfil se não for novo
  useEffect(() => {
    if (!isNew && profileId) {
      const profile = profiles.find(p => p.id === profileId)
      if (profile) {
        setName(profile.name)
        setAvatarUrl(profile.avatar_url || '/images/default-avatar.png')
      }
    }
  }, [isNew, profileId, profiles])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nome do perfil é obrigatório')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      let finalAvatarUrl = avatarUrl
      
      // Upload do avatar personalizado
      if (customAvatar) {
        const fileExt = customAvatar.name.split('.').pop()
        const fileName = `${profileId || 'new'}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, customAvatar)
          
        if (uploadError) throw uploadError
        
        const { data } = supabase.storage.from('media').getPublicUrl(filePath)
        finalAvatarUrl = data.publicUrl
      } else if (selectedAvatar) {
        finalAvatarUrl = selectedAvatar
      }
      
      let updatedProfile
      
      if (isNew) {
        // Criar novo perfil
        updatedProfile = await createProfile(name, finalAvatarUrl)
        // Definir como perfil atual
        setCurrentProfile(updatedProfile)
      } else {
        // Atualizar perfil existente
        updatedProfile = await updateProfile(profileId, {
          name,
          avatar_url: finalAvatarUrl
        })
        
        // Atualizar perfil atual se for o mesmo que está sendo editado
        if (currentProfile?.id === profileId) {
          setCurrentProfile(updatedProfile)
        }
      }
      
      router.push(isNew ? '/browse' : `/profile/${profileId}?success=true`)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.')) {
      setLoading(true)
      
      try {
        await deleteProfile(profileId)
        
        // Se o perfil excluído for o atual, redirecionar para a seleção de perfil
        if (currentProfile?.id === profileId) {
          setCurrentProfile(null)
          router.push('/')
        } else {
          router.push('/browse')
        }
      } catch (err) {
        console.error('Erro ao excluir perfil:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCustomAvatar(file)
      setSelectedAvatar(null)
      
      // Mostrar preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarUrl(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const selectAvatar = (url) => {
    setSelectedAvatar(url)
    setAvatarUrl(url)
    setCustomAvatar(null)
    setShowAvatarSelector(false)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-center">{isNew ? 'Novo Perfil' : 'Editar Perfil'}</h1>
      
      {error && (
        <div className="bg-red-500/80 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-background-light rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 relative overflow-hidden rounded-lg border-4 border-background">
              <Image 
                src={avatarUrl} 
                alt="Avatar do perfil" 
                fill
                className="object-cover"
              />
            </div>
            <button 
              type="button" 
              className="px-4 py-2 bg-background hover:bg-background-dark text-white rounded-md text-sm transition-colors duration-200"
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            >
              Alterar Avatar
            </button>
            
            {showAvatarSelector && (
              <div className="mt-4 bg-background-dark p-4 rounded-lg shadow-lg w-full max-w-xs">
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {avatarOptions.map((avatar, index) => (
                    <button 
                      key={index} 
                      className="relative aspect-square rounded-md overflow-hidden border-2 hover:border-primary focus:border-primary transition-colors duration-200"
                      style={{ borderColor: avatarUrl === avatar ? '#e50914' : 'transparent' }}
                      onClick={() => selectAvatar(avatar)}
                    >
                      <Image 
                        src={avatar} 
                        alt={`Avatar ${index + 1}`} 
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Ou faça upload do seu próprio avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-text-secondary
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-background file:text-white
                      hover:file:bg-background-dark
                      cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full">
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-text-secondary mb-1">
                  Nome do Perfil
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome do perfil"
                  maxLength={30}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center mt-8 gap-4">
          <button 
            type="button" 
            className="px-6 py-2 bg-background hover:bg-background-dark text-white rounded-md transition-colors duration-200"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button 
            type="button" 
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors duration-200"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </span>
            ) : 'Salvar'}
          </button>
          
          {!isNew && (
            <button 
              type="button" 
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 mt-4 md:mt-0 w-full md:w-auto"
              onClick={handleDelete}
              disabled={loading}
            >
              Excluir Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings