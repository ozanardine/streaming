import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/context/ToastContext';
import SafeImage from '../ui/SafeImage';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

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
];

const ProfileSettings = ({ profileId, isNew = false }) => {
  // Hooks
  const { profiles, createProfile, updateProfile, deleteProfile } = useProfiles();
  const { setCurrentProfile, profile: currentProfile } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  
  // State
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/images/default-avatar.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [customAvatar, setCustomAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nameError, setNameError] = useState('');

  // Load profile data if not new
  useEffect(() => {
    if (!isNew && profileId) {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setName(profile.name);
        setAvatarUrl(profile.avatar_url || '/images/default-avatar.png');
      }
    }
  }, [isNew, profileId, profiles]);

  // Validate form
  const validateForm = () => {
    let isValid = true;
    setNameError('');
    
    if (!name.trim()) {
      setNameError('Nome do perfil é obrigatório');
      isValid = false;
    } else if (name.length > 30) {
      setNameError('Nome do perfil deve ter no máximo 30 caracteres');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let finalAvatarUrl = avatarUrl;
      
      // Upload custom avatar if provided
      if (customAvatar) {
        const fileExt = customAvatar.name.split('.').pop();
        const fileName = `${profileId || 'new'}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, customAvatar);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('media').getPublicUrl(filePath);
        finalAvatarUrl = data.publicUrl;
      } else if (selectedAvatar) {
        finalAvatarUrl = selectedAvatar;
      }
      
      let updatedProfile;
      
      if (isNew) {
        // Create new profile
        updatedProfile = await createProfile(name, finalAvatarUrl);
        // Set as current profile
        setCurrentProfile(updatedProfile);
        // Show success message
        success('Perfil criado com sucesso!');
      } else {
        // Update existing profile
        updatedProfile = await updateProfile(profileId, {
          name,
          avatar_url: finalAvatarUrl
        });
        
        // Update current profile if it's the same one being edited
        if (currentProfile?.id === profileId) {
          setCurrentProfile(updatedProfile);
        }
        
        // Show success message
        success('Perfil atualizado com sucesso!');
      }
      
      // Navigate back
      router.push(isNew ? '/browse' : `/profile/${profileId}?success=true`);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError(err.message);
      showError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    
    try {
      await deleteProfile(profileId);
      
      // If the deleted profile is the current one, redirect to profile selection
      if (currentProfile?.id === profileId) {
        setCurrentProfile(null);
        router.push('/');
      } else {
        router.push('/browse');
      }
      
      success('Perfil excluído com sucesso');
    } catch (err) {
      console.error('Erro ao excluir perfil:', err);
      setError(err.message);
      showError('Erro ao excluir perfil. Tente novamente.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomAvatar(file);
      setSelectedAvatar(null);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAvatar = (url) => {
    setSelectedAvatar(url);
    setAvatarUrl(url);
    setCustomAvatar(null);
    setShowAvatarSelector(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-background-card rounded-lg shadow-xl border border-background-light/20 p-6 animate-fade">
      <h1 className="text-2xl font-bold mb-8 text-center">{isNew ? 'Novo Perfil' : 'Editar Perfil'}</h1>
      
      {error && (
        <div className="mb-6 rounded-md border border-error/20 bg-error/10 p-4 text-sm text-error">
          <p className="flex items-center">
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 relative overflow-hidden rounded-lg border-4 border-background shadow-lg">
            <SafeImage 
              src={avatarUrl} 
              alt="Avatar do perfil" 
              width={128} 
              height={128}
              className="object-cover w-full h-full"
              placeholderClassName="bg-background-dark"
            />
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
          >
            {showAvatarSelector ? 'Fechar Seletor' : 'Alterar Avatar'}
          </Button>
          
          {showAvatarSelector && (
            <div className="mt-4 rounded-lg border border-background-light/20 bg-background-dark p-4 shadow-lg w-full sm:w-72">
              <h3 className="text-white font-medium mb-3">Escolha um avatar</h3>
              <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                {avatarOptions.map((avatar, index) => (
                  <button 
                    key={index} 
                    className={`aspect-square w-full overflow-hidden rounded-md transition-all hover:scale-105 ${
                      avatarUrl === avatar 
                        ? 'ring-2 ring-primary border-2 border-primary' 
                        : 'border border-background-light/20 hover:border-primary'
                    }`}
                    onClick={() => selectAvatar(avatar)}
                  >
                    <div className="relative h-full w-full bg-background-dark">
                      <SafeImage 
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        placeholderClassName="bg-background-dark"
                      />
                    </div>
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
                  className="block w-full rounded-md border border-background-light/20 text-sm text-text-secondary
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary-dark
                    cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Profile info section */}
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
                className={`w-full rounded-md border ${
                  nameError ? 'border-error focus:ring-error' : 'border-background-light/20 focus:ring-primary'
                } bg-background p-3 text-white focus:ring-2`}
                required
              />
              {nameError && (
                <p className="mt-1 text-xs text-error">{nameError}</p>
              )}
              <p className="mt-1 text-xs text-text-secondary">
                {30 - name.length} caracteres restantes
              </p>
            </div>
            
            {!isNew && (
              <div className="mt-4 rounded-md bg-background-dark/50 p-4">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Preferências de visualização</h4>
                
                <div className="flex items-center">
                  <input
                    id="autoplay"
                    type="checkbox"
                    className="h-4 w-4 rounded border-background-light text-primary focus:ring-primary"
                  />
                  <label htmlFor="autoplay" className="ml-2 text-sm text-text-secondary">
                    Reproduzir automaticamente próximos episódios
                  </label>
                </div>
                
                <div className="mt-2 flex items-center">
                  <input
                    id="previews"
                    type="checkbox"
                    className="h-4 w-4 rounded border-background-light text-primary focus:ring-primary"
                  />
                  <label htmlFor="previews" className="ml-2 text-sm text-text-secondary">
                    Reproduzir automaticamente prévias
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-wrap justify-center mt-8 gap-4">
        <Button 
          variant="dark"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button 
          variant="primary"
          onClick={handleSave}
          isLoading={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
        
        {!isNew && (
          <Button 
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="mt-4 md:mt-0 w-full md:w-auto"
          >
            Excluir Perfil
          </Button>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Perfil"
        size="sm"
      >
        <div className="py-4">
          <p className="text-center mb-6">
            Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="dark"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileSettings;