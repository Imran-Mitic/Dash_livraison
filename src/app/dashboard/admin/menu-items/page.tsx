'use client';

import { useState } from 'react';
import { useMenuItems } from '@/app/hook/useMeniItems';
import { useMenuSections } from '@/app/hook/useMeniSections';
import { MenuItemList } from '@/app/components/MenuItemList';
import { MenuItemForm } from '@/app/components/MenuItemForm';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { MenuItem } from '@/app/types/menu-item';
import SearchAndFilterBar from '@/app/components/shearchAndFilterPage'; // Ajuste le chemin
import { PlusIcon } from 'lucide-react';

export default function AdminMenuItemsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const { menuItems, loading, error, createMenuItem, updateMenuItem, deleteMenuItem, refetch } = useMenuItems();
  const { sections } = useMenuSections();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '', // Remplacé par menuSectionId pour les sections
    status: '',   // Peut être utilisé pour isAvailable
    startDate: '',
    endDate: ''
  });
  const [perPage, setPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const filterMenuItems = () => {
    let result = [...menuItems];

    // Filtre par recherche
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par section
    if (filters.category) {
      result = result.filter(item => item.menuSectionId === filters.category);
    }

    // Filtre par disponibilité (status)
    if (filters.status) {
      const isAvailable = filters.status === 'open';
      result = result.filter(item => item.isAvailable === isAvailable);
    }

    // Filtre par date
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(item => new Date(item.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      result = result.filter(item => new Date(item.createdAt) <= endDate);
    }

    return result;
  };

  const filteredItems = filterMenuItems();
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Limite à 5 pages visibles
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const handleCreate = async (data: Omit<MenuItem, 'id' | 'createdAt'>) => {
    try {
      await createMenuItem(data);
      setIsCreating(false);
    } catch (error) {
      console.error('Erreur de création:', error);
    }
  };

  const handleUpdate = async (id: string, data: Partial<MenuItem>) => {
    try {
      await updateMenuItem(id, data);
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem(id);
    } catch (error) {
      console.error('Erreur de suppression:', error);
    }
  };

  if (loading && !menuItems.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-bold text-black">Gestion des Items du Menu</CardTitle>
          <button 
              onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <PlusIcon className="h-5 w-5" />
              Ajouter un Produit/plat
            </button>
        </CardHeader>
        <CardContent>
          <SearchAndFilterBar
            categories={sections}
            onSearchChange={setSearchTerm}
            onFilterChange={setFilters}
            onResetFilters={() => {
              setFilters({ category: '', status: '', startDate: '', endDate: '' });
              setSearchTerm('');
            }}
            searchTerm={searchTerm}
            filters={filters}
          />

          {isCreating && (
            <div className="mb-6 rounded-lg bg-white p-4 shadow">
              <h3 className="text-lg font-medium text-black">Nouvel Item</h3>
              <MenuItemForm
                sections={sections}
                onSubmit={handleCreate}
                onCancel={() => setIsCreating(false)}
              />
            </div>
          )}

          <MenuItemList
            items={paginatedItems}
            sections={sections}
            onItemUpdated={refetch}
            onDeleteItem={handleDelete}
          />

          {filteredItems.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-black disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
                >
                  Préc
                </button>
                
                {getPageNumbers().map((page, index) => (
                  typeof page === 'number' ? (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                        page === currentPage
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                      } transition-all duration-200`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} className="flex items-center justify-center w-10 h-10 text-black">
                      ...
                    </span>
                  )
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-black disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
                >
                  Suiv
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}