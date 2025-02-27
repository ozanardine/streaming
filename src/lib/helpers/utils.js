/**
 * Executa a função de debounce
 * @param {Function} func - Função a ser executada depois do delay
 * @param {number} wait - Tempo de espera em milissegundos
 * @returns {Function} - Função com debounce aplicado
 */
export const debounce = (func, wait) => {
    let timeout;
    
    const debouncedFn = function(...args) {
      const context = this;
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
    
    debouncedFn.cancel = function() {
      clearTimeout(timeout);
    };
    
    return debouncedFn;
  };
  
  /**
   * Formata duração em segundos para string legível
   * @param {number} seconds - Duração em segundos
   * @param {boolean} includeHours - Se deve sempre incluir horas
   * @returns {string} - Duração formatada
   */
  export const formatDuration = (seconds, includeHours = false) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0 || includeHours) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Trunca texto com ellipsis
   * @param {string} text - Texto a ser truncado
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} - Texto truncado
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  /**
   * Gera um ID único
   * @returns {string} - ID único
   */
  export const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  /**
   * Verifica se um objeto está vazio
   * @param {Object} obj - Objeto a ser verificado
   * @returns {boolean} - Se o objeto está vazio
   */
  export const isEmptyObject = (obj) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  };
  
  /**
   * Converte tamanho de arquivo para formato legível
   * @param {number} bytes - Tamanho em bytes
   * @param {number} decimals - Número de casas decimais
   * @returns {string} - Tamanho formatado
   */
  export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };