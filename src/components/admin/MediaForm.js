import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/context/ToastContext';
import Button from '../ui/Button';
import { saveExternalUrl, uploadToSupabase } from '../../lib/mediaStorage';
import { getYouTubeThumbnailUrl } from '../../lib/helpers/videoHelpers';

const CATEGORIES = ['filmes', 'series', 'anime', 'documentarios', 'infantil', 'educativo'];

const MediaForm = ({ mediaId = null }) => {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch media details if editing
  useEffect(() => {
    if (mediaId) {
      setIsEditing(true);
      fetchMediaDetails();
    }
  }, [mediaId]);

  const fetchMediaDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setUrl(data.media_url || '');
        setThumbnailPreview(data.thumbnail_url || '');
        setIsYouTube(data.media_url?.includes('youtube.com') || data.media_url?.includes('youtu.be'));
      }
    } catch (err) {
      console.error('Error fetching media details:', err);
      showError('Erro ao carregar detalhes da mídia');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle URL change to detect YouTube links
  useEffect(() => {
    const detectYouTube = () => {
      const isYT = url.includes('youtube.com') || url.includes('youtu.be');
      setIsYouTube(isYT);
      
      // Try to get YouTube thumbnail
      if (isYT && !thumbnailFile && !thumbnailPreview) {
        const thumbnailUrl = getYouTubeThumbnailUrl(url);
        if (thumbnailUrl) {
          setThumbnailPreview(thumbnailUrl);
        }
      }
    };
    
    detectYouTube();
  }, [url, thumbnailFile, thumbnailPreview]);
  
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    setError(null);
    
    if (!title.trim()) {
      setError('Título é obrigatório');
      return false;
    }
    
    if (!url.trim()) {
      setError('URL do vídeo é obrigatória');
      return false;
    }
    
    if (!category) {
      setError('Categoria é obrigatória');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      let thumbnailUrl = thumbnailPreview;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const result = await uploadToSupabase(thumbnailFile, 'thumbnails');
        thumbnailUrl = result.url;
      }
      
      if (isEditing) {
        // Update existing media
        const { error: updateError } = await supabase
          .from('media')
          .update({
            title,
            description,
            category,
            media_url: url,
            thumbnail_url: thumbnailUrl,
            updated_at: new Date()
          })
          .eq('id', mediaId);
        
        if (updateError) throw updateError;
        
        success('Mídia atualizada com sucesso!');
      } else {
        // Create new media
        await saveExternalUrl(url, title, description, category, thumbnailUrl);
        success('Mídia adicionada com sucesso!');
      }
      
      // Redirect to admin media list
      router.push('/admin/media');
    } catch (err) {
      console.error('Error saving media:', err);
      setError(err.message || 'Erro ao salvar mídia');
      showError('Erro ao salvar mídia. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <p className="text-error">Acesso negado. Você precisa ser um administrador para acessar esta página.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-background-card rounded-lg border border-background-light/20 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Mídia' : 'Adicionar Nova Mídia'}</h1>
      
      {error && (
        <div className="mb-6 bg-error/10 border border-error/20 text-error rounded-md p-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                Título <span className="text-error">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-background-light bg-background p-3 text-white focus:ring-2 focus:ring-primary"
                placeholder="Nome do vídeo"
                required
              />
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">
                Categoria <span className="text-error">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-background-light bg-background p-3 text-white focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Media URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-text-secondary mb-1">
                URL do Vídeo <span className="text-error">*</span>
              </label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-md border border-background-light bg-background p-3 text-white focus:ring-2 focus:ring-primary"
                placeholder="https://youtube.com/... ou link direto"
                required
              />
              <p className="mt-1 text-xs text-text-secondary">
                {isYouTube ? 'Link do YouTube detectado' : 'Use links do YouTube ou links diretos para vídeo'}
              </p>
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-background-light bg-background p-3 text-white focus:ring-2 focus:ring-primary"
                placeholder="Descrição do vídeo"
              />
            </div>
          </div>
          
          <div>
            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Thumbnail
              </label>
              <div className="mb-4">
                {thumbnailPreview ? (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-background-light">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview('');
                        setThumbnailFile(null);
                      }}
                      className="absolute top-2 right-2 bg-background-dark/80 text-white p-1 rounded-full hover:bg-error/80"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center rounded-md border border-dashed border-background-light bg-background-dark mb-4">
                    <div className="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-text-secondary">Sem thumbnail</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-text-secondary mb-1">
                    Upload de Thumbnail
                  </label>
                  <input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full rounded-md border border-background-light bg-background p-2 text-sm text-text-secondary
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-white
                      hover:file:bg-primary-dark"
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    {isYouTube && !thumbnailFile && 'Thumbnail do YouTube será usada automaticamente.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-background-light/20">
          <Button
            variant="dark"
            onClick={() => router.push('/admin/media')}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Adicionar Mídia'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MediaForm;