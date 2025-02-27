import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { debounce } from '../lib/helpers/utils';

export const useSearch = (options = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(options.filters || {});
  const { error: showError } = useToast();
  
  const limit = options.limit || 20;
  const searchDelay = options.delay || 500;

  // Função de busca
  const performSearch = useCallback(async (searchTerm, searchFilters = {}) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Construir a consulta base
      let query = supabase
        .from('media')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Aplicar filtros adicionais
      if (searchFilters.category) {
        query = query.eq('category', searchFilters.category);
      }
      
      if (searchFilters.type) {
        query = query.eq('type', searchFilters.type);
      }
      
      const { data, error: searchError } = await query;
      
      if (searchError) throw searchError;
      
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Erro ao realizar busca. Tente novamente.');
      showError('Falha na busca. Verifique sua conexão.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [limit, showError]);

  // Versão com debounce para evitar muitas requisições
  const debouncedSearch = useCallback(
    debounce((searchTerm, searchFilters) => {
      performSearch(searchTerm, searchFilters);
    }, searchDelay),
    [performSearch, searchDelay]
  );

  // Realizar busca quando a query ou filtros mudam
  useEffect(() => {
    debouncedSearch(query, filters);
    
    // Limpar busca em andamento no cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, filters, debouncedSearch]);

  // Atualizar query
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // Limpar busca
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setFilters(options.filters || {});
  }, [options.filters]);

  return {
    query,
    results,
    loading,
    error,
    filters,
    updateQuery,
    updateFilters,
    clearSearch,
    performSearch
  };
};