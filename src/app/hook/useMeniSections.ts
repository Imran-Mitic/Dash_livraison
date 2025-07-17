// src/hooks/useMenuSections.ts
import { useState, useEffect } from 'react';
import { MenuSection } from '../types/menu-item';

const API_URL = '/api/menu-sections';

export const useMenuSections = () => {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setSections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return {
    sections,
    loading,
    error,
    refetch: fetchSections,
  };
};