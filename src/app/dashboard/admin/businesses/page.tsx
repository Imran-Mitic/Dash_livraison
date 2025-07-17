'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { PlusIcon, ListBulletIcon, Squares2X2Icon, XMarkIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon, FunnelIcon, MagnifyingGlassIcon, EyeIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isOpen: boolean;
  categoryId: string;
  category: {
    name: string;
  };
  admins: {
    id: string;
    name: string;
  }[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface BusinessFormData {
  id?: string;
  name: string;
  description: string;
  image?: FileList;
  categoryId: string;
  isOpen: boolean;
  adminIds: string[];
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [view, setView] = useState<'list' | 'card'>('card');
  const [perPage, setPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<BusinessFormData>();
  const imageFile = watch('image');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBusinesses();
  }, [businesses, searchTerm, filters]);

  const filterBusinesses = () => {
    let result = [...businesses];

    if (searchTerm) {
      result = result.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.category) {
      result = result.filter(business => business.categoryId === filters.category);
    }

    if (filters.status) {
      const isOpen = filters.status === 'open';
      result = result.filter(business => business.isOpen === isOpen);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(business => new Date(business.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      result = result.filter(business => new Date(business.createdAt) <= endDate);
    }

    setFilteredBusinesses(result);
    setCurrentPage(1);
  };

  const paginated = filteredBusinesses.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      setImagePreview(URL.createObjectURL(file));
    }
  }, [imageFile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [businessRes, categoriesRes, adminsRes] = await Promise.all([
        fetch('/api/businesses'),
        fetch('/api/categories'),
        fetch('/api/admins'),
      ]);

      const [businessData, categoriesData, adminsData] = await Promise.all([
        businessRes.json(),
        categoriesRes.json(),
        adminsRes.json(),
      ]);

      setBusinesses(businessData);
      setFilteredBusinesses(businessData);
      setCategories(categoriesData);
      setAdmins(adminsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce commerce ?')) return;

    try {
      await fetch('/api/businesses', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setBusinesses(prev => prev.filter(b => b.id !== id));
      toast.success('Commerce supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openModal = (business: Business | null = null) => {
    setCurrentBusiness(business);
    if (business) {
      setValue('name', business.name);
      setValue('description', business.description || '');
      setValue('categoryId', business.categoryId);
      setValue('isOpen', business.isOpen);
      setValue('adminIds', business.admins.map(a => a.id));
      if (business.imageUrl) {
        setImagePreview(business.imageUrl);
      }
    } else {
      reset({
        name: '',
        description: '',
        categoryId: '',
        isOpen: true,
        adminIds: [],
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setImagePreview(null);
    setCurrentBusiness(null);
  };

  const onSubmit = async (data: BusinessFormData) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('categoryId', data.categoryId);
      formData.append('isOpen', String(data.isOpen));
      data.adminIds.forEach(id => formData.append('adminIds', id));

      if (data.image && data.image.length > 0) {
        formData.append('file', data.image[0]);
      }

      let response;
      if (currentBusiness) {
        formData.append('id', currentBusiness.id);
        response = await fetch('/api/businesses', {
          method: 'PUT',
          body: formData,
        });
      } else {
        response = await fetch('/api/businesses', {
          method: 'POST',
          body: formData,
        });
      }

      const result = await response.json();

      if (response.ok) {
        toast.success(currentBusiness ? 'Commerce mis à jour' : 'Commerce créé');
        if (currentBusiness) {
          setBusinesses(businesses.map(b => b.id === currentBusiness.id ? result : b));
        } else {
          setBusinesses([result, ...businesses]);
        }
        closeModal();
      } else {
        throw new Error(result.error || 'Erreur');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
      console.error('Erreur:', error);
    }
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <Toaster position="top-center" toastOptions={{ 
        duration: 3000,
        style: {
          borderRadius: '0.5rem',
          background: '#1f2937',
          color: '#f9fafb',
        }
      }} />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentBusiness ? 'Modifier' : 'Ajouter'} un commerce
              </h2>
              <button 
                onClick={closeModal} 
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du commerce *
                  </label>
                  <input
                    {...register('name', { required: 'Ce champ est obligatoire' })}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    {...register('categoryId', { required: 'Ce champ est obligatoire' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center h-10">
                    <input
                      id="isOpen"
                      type="checkbox"
                      {...register('isOpen')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isOpen" className="ml-2 block text-sm text-gray-700">
                      Ouvert actuellement
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Administrateurs
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {admins.map(admin => (
                      <div key={admin.id} className="flex items-center">
                        <input
                          id={`admin-${admin.id}`}
                          type="checkbox"
                          value={admin.id}
                          {...register('adminIds')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`admin-${admin.id}`} className="ml-2 block text-sm text-gray-700">
                          {admin.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="mt-2 flex flex-col sm:flex-row items-start gap-4">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        <span>Choisir une image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        {...register('image')}
                      />
                    </label>
                    
                    {imagePreview && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setValue('image', undefined);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  {currentBusiness ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des commerces</h1>
            <p className="text-gray-500 mt-2">
              {filteredBusinesses.length} {filteredBusinesses.length > 1 ? 'commerces trouvés' : 'commerce trouvé'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Ajouter un commerce</span>
            </button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setView('list')}
                  className={`p-2.5 ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="Vue liste"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('card')}
                  className={`p-2.5 ${view === 'card' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="Vue grille"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
              
              <select
                onChange={(e) => setPerPage(parseInt(e.target.value))}
                className="border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white transition-all duration-200 text-sm"
              >
                {[6, 12, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} par page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un commerce..."
                className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filtres</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">Tous les statuts</option>
                  <option value="open">Ouvert</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commerce
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((business) => (
                    <tr
                      key={business.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {business.imageUrl ? (
                              <Image
                                src={business.imageUrl}
                                alt={business.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                <span className="text-xs">N/N</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                            {business.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{business.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{business.category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          business.isOpen 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {business.isOpen ? 'Ouvert' : 'Fermé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(business.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => openModal(business)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(business.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          <Link href={`/dashboard/admin/businesses/${business.id}`}>
                            <button
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Voir"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <div className="relative h-48 bg-gray-100">
                  {business.imageUrl ? (
                    <Image
                      src={business.imageUrl}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <span className="text-sm">Aucune image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      business.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {business.isOpen ? 'Ouvert' : 'Fermé'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{business.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium mb-2">{business.category.name}</p>
                  {business.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      {format(parseISO(business.createdAt), 'dd/MM/yyyy')}
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(business)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(business.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      <Link href={`/dashboard/admin/businesses/${business.id}`}>
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Voir"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredBusinesses.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <div className="text-sm text-gray-500">
              Affichage de {(currentPage - 1) * perPage + 1} à {Math.min(currentPage * perPage, filteredBusinesses.length)} sur {filteredBusinesses.length} commerces
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.ceil(filteredBusinesses.length / perPage) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    i + 1 === currentPage
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  } transition-all`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBusinesses.length / perPage)))}
                disabled={currentPage === Math.ceil(filteredBusinesses.length / perPage)}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}