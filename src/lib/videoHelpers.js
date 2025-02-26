/**
 * Utilitários para processamento de vídeos e URLs
 */

/**
 * Extrair ID de vídeo do YouTube de diferentes formatos de URL
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo ou null se não for possível extrair
 */
export const extractYouTubeId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\?]+)/i
    ];
  
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };
  
  /**
   * Formatar URL do YouTube para formato de incorporação
   * @param {string} url - URL original do YouTube
   * @returns {string} - URL de incorporação
   */
  export const formatYouTubeUrl = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  
  /**
   * Verificar se a URL é do Google Drive
   * @param {string} url - URL para verificar
   * @returns {boolean} - true se for uma URL do Google Drive
   */
  export const isGoogleDriveUrl = (url) => {
    return url.includes('drive.google.com');
  };
  
  /**
   * Formatar URL do Google Drive para reprodução direta
   * @param {string} url - URL original do Google Drive
   * @returns {string} - URL formatada para reprodução
   */
  export const formatGoogleDriveUrl = (url) => {
    // Extrair o ID do arquivo do Google Drive
    const fileIdMatch = url.match(/\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    
    // Tentar extrair de links de visualização
    const viewerMatch = url.match(/id=([^&]+)/);
    if (viewerMatch && viewerMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${viewerMatch[1]}`;
    }
    
    return url;
  };
  
  /**
   * Determinar o tipo de URL de vídeo
   * @param {string} url - URL para verificar
   * @returns {string} - Tipo de URL: 'youtube', 'drive', ou 'other'
   */
  export const getVideoUrlType = (url) => {
    if (!url) return 'other';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('drive.google.com')) {
      return 'drive';
    } else {
      return 'other';
    }
  };
  
  /**
   * Formatar URL externa com base no tipo detectado
   * @param {string} url - URL original
   * @param {string} urlType - Tipo de URL ('youtube', 'drive', 'other')
   * @returns {string} - URL formatada
   */
  export const formatExternalUrl = (url, urlType) => {
    if (!url) return '';
    
    const detectedType = urlType || getVideoUrlType(url);
    
    switch (detectedType) {
      case 'youtube':
        return formatYouTubeUrl(url);
      case 'drive':
        return formatGoogleDriveUrl(url);
      default:
        return url;
    }
  };
  
  /**
   * Gerar URL de thumbnail para vídeos do YouTube
   * @param {string} url - URL do YouTube
   * @returns {string|null} - URL da thumbnail ou null
   */
  export const getYouTubeThumbnailUrl = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      // Usar a thumbnail de alta qualidade
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };
  
  /**
   * Verificar se uma URL é um arquivo de vídeo direto
   * @param {string} url - URL para verificar
   * @returns {boolean} - true se for uma URL de arquivo de vídeo
   */
  export const isDirectVideoFileUrl = (url) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.3gp'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };