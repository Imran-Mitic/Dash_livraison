// src/hooks/useMenuItems.ts
import { useState, useEffect } from 'react';
import { MenuItem } from '../types/menu-item';

const API_URL = '/api/menu-items';

export const useMenuItems = (sectionId?: string) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const url = sectionId ? `${API_URL}?menuSectionId=${sectionId}` : API_URL;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const createMenuItem = async (itemData: Omit<MenuItem, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Erreur de création');
      await fetchMenuItems();
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de création');
      throw err;
    }
  };

  const updateMenuItem = async (id: string, itemData: Partial<MenuItem>) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...itemData }),
      });
      if (!response.ok) throw new Error('Erreur de mise à jour');
      await fetchMenuItems();
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Erreur de suppression');
      await fetchMenuItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
      throw err;
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [sectionId]);

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuItems,
  };
};