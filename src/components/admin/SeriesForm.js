import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../lib/context/ToastContext';
import Button from '../ui/Button';
import { uploadSeriesImage } from '../../lib/seriesService';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['series', 'anime', 'documentarios', 'infantil', 'educativo'];

const SeriesForm = ({ seriesId = null }) => {
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isAnime, setIsAnime] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch series details if editing
  useEffect(() => {
    if (seriesId) {
      setIsEditing(true);
      fetchSeriesDetails();
    }
  }, [seriesId]);

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setIsAnime(data.is_anime || false);
        setThumbnailPreview(data.thumbnail_url || '');
        setBannerPreview(data.banner_url || '');
      }
    } catch (err) {
      console.error('Error fetching series details:', err);
      showError('Erro ao carregar detalhes da série');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerPreview(event.target.result);
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
      let bannerUrl = bannerPreview;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const result = await uploadSeriesImage(thumbnailFile, 'series/thumbnails');
        thumbnailUrl = result.url;
      }
      
      // Upload banner if provided
      if (bannerFile) {
        const result = await uploadSeriesImage(bannerFile, 'series/banners');
        bannerUrl = result.url;
      }
      
      const seriesData = {
        title,
        description,
        category,
        is_anime: isAnime,
        thumbnail_url: thumbnailUrl,
        banner_url: bannerUrl,
        added_by: isEditing ? undefined : null, // Will be set by Supabase RLS
      };
      
      if (isEditing) {
        // Update existing series
        const { error: updateError } = await supabase
          .from('series')
          .update({
            ...seriesData,
            updated_at: new Date()
          })
          .eq('id', seriesId);
        
        if (updateError) throw updateError;
        
        success('Série atualizada com sucesso!');
      } else {
        // Create new series
        const { error: insertError } = await supabase
          .from('series')
          .insert([seriesData]);
        
        if (insertError) throw insertError;
        
        success('Série adicionada com sucesso!');
      }
      
      // Redirect to admin series list
      router.push('/admin/series');
    } catch (err) {
      console.error('Error saving series:', err);
      setError(err.message || 'Erro ao salvar série');
      showError('Erro ao salvar série. Por favor, tente novamente.');
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
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Série' : 'Adicionar Nova Série'}</h1>
      
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
                placeholder="Nome da série"
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
            
            {/* Is Anime */}
            <div className="flex items-center">
              <input
                id="isAnime"
                type="checkbox"
                checked={isAnime}
                onChange={(e) => setIsAnime(e.target.checked)}
                className="h-4 w-4 rounded border-background-light text-primary focus:ring-primary"
              />
              <label htmlFor="isAnime" className="ml-2 text-sm text-text-secondary">
                É um anime?
              </label>
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
                placeholder="Descrição da série"
              />
            </div>
          </div>
          
          <div className="space-y-6">
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
                      <p className="mt-2 text-sm text-text-secondary">Thumbnail da série</p>
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
                </div>
              </div>
            </div>
            
            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Banner
              </label>
              <div className="mb-4">
                {bannerPreview ? (
                  <div className="relative w-full h-32 overflow-hidden rounded-md border border-background-light">
                    <img 
                      src={bannerPreview} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerPreview('');
                        setBannerFile(null);
                      }}
                      className="absolute top-2 right-2 bg-background-dark/80 text-white p-1 rounded-full hover:bg-error/80"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 flex items-center justify-center rounded-md border border-dashed border-background-light bg-background-dark mb-4">
                    <div className="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-text-secondary">Banner da série</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="banner" className="block text-sm font-medium text-text-secondary mb-1">
                    Upload de Banner (imagem larga)
                  </label>
                  <input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="w-full rounded-md border border-background-light bg-background p-2 text-sm text-text-secondary
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-white
                      hover:file:bg-primary-dark"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-background-light/20">
          <Button
            variant="dark"
            onClick={() => router.push('/admin/series')}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Adicionar Série'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SeriesForm;