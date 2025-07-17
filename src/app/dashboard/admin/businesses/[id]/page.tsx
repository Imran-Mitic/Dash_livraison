'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  category: { name: string };
  admins: { id: string; name: string }[];
  createdAt: string;
  menuSections: MenuSection[];
}

interface MenuSection {
  id: string;
  name: string;
  businessId: string;
  menuItems: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  type?: string;
  imageUrl?: string;
  isAvailable: boolean;
  menuSectionId: string;
  createdAt: string;
  updatedAt: string;
}

interface SectionFormData {
  id?: string;
  name: string;
  businessId: string;
}

interface ItemFormData {
  id?: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  menuSectionId: string;
}

export default function BusinessDetailPage() {
  const { id } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'sections' | 'items'>('info');
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<MenuSection | null>(null);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'section' | 'item'>('section');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    register: registerSection, 
    handleSubmit: handleSubmitSection, 
    reset: resetSection, 
    setValue: setValueSection, 
    formState: { errors: sectionErrors } 
  } = useForm<SectionFormData>();

  const { 
    register: registerItem, 
    handleSubmit: handleSubmitItem, 
    reset: resetItem, 
    setValue: setValueItem, 
    formState: { errors: itemErrors } 
  } = useForm<ItemFormData>();

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${id}?includeSections=true`);
      const data = await res.json();
      setBusiness(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (type: 'section' | 'item', id: string) => {
    setDeleteType(type);
    if (type === 'section') {
      setSectionToDelete(id);
    } else {
      setItemToDelete(id);
    }
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSectionToDelete(null);
    setItemToDelete(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteType === 'section' && sectionToDelete) {
        await fetch('/api/menu-sections', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sectionToDelete }),
        });
        
        if (business) {
          const updatedBusiness = { ...business };
          updatedBusiness.menuSections = updatedBusiness.menuSections.filter(s => s.id !== sectionToDelete);
          setBusiness(updatedBusiness);
        }
        toast.success('Section supprimée avec succès');
      } 
      else if (deleteType === 'item' && itemToDelete && currentSection) {
        await fetch('/api/menu-items', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemToDelete }),
        });
        
        if (business) {
          const updatedBusiness = { ...business };
          updatedBusiness.menuSections = updatedBusiness.menuSections.map(section =>
            section.id === currentSection.id
              ? { ...section, menuItems: section.menuItems.filter(i => i.id !== itemToDelete) }
              : section
          );
          setBusiness(updatedBusiness);
        }
        toast.success('Item supprimé avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const openSectionModal = (section: MenuSection | null = null) => {
    setCurrentSection(section);
    if (section) {
      setValueSection('name', section.name);
      setValueSection('businessId', section.businessId);
    } else {
      resetSection({
        name: '',
        businessId: id as string,
      });
    }
    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    resetSection();
    setCurrentSection(null);
  };

  const onSubmitSection = async (data: SectionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/menu-sections', {
        method: currentSection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: currentSection?.id }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(currentSection ? 'Section mise à jour' : 'Section créée');
        if (business) {
          const updatedBusiness = { ...business };
          updatedBusiness.menuSections = currentSection
            ? updatedBusiness.menuSections.map(s => s.id === result.id ? result : s)
            : [...(updatedBusiness.menuSections || []), result];
          setBusiness(updatedBusiness);
        }
      } else {
        throw new Error(result.error || 'Erreur');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
      closeSectionModal();
    }
  };

  const openItemModal = (item: MenuItem | null = null) => {
    setCurrentItem(item);
    if (item) {
      setValueItem('name', item.name);
      setValueItem('description', item.description || '');
      setValueItem('price', item.price);
      setValueItem('isAvailable', item.isAvailable);
      setValueItem('menuSectionId', item.menuSectionId);
    } else {
      resetItem({
        name: '',
        description: '',
        price: 0,
        isAvailable: true,
        menuSectionId: currentSection?.id || '',
      });
    }
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    resetItem();
    setCurrentItem(null);
  };

  const onSubmitItem = async (data: ItemFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/menu-items', {
        method: currentItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: currentItem?.id }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(currentItem ? 'Item mis à jour' : 'Item créé');
        if (business && currentSection) {
          const updatedBusiness = { ...business };
          updatedBusiness.menuSections = updatedBusiness.menuSections.map(section =>
            section.id === currentSection.id
              ? { 
                  ...section, 
                  menuItems: currentItem 
                    ? section.menuItems.map(i => i.id === result.id ? result : i) 
                    : [...section.menuItems, result] 
                }
              : section
          );
          setBusiness(updatedBusiness);
        }
      } else {
        throw new Error(result.error || 'Erreur');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
      closeItemModal();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!business) {
    return <div>Commerce non trouvé</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/admin/businesses">
            <button className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
        </div>

        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'info' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'sections' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'items' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Items
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {activeTab === 'info' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Informations de base</h3>
                    <div className="mt-2 space-y-2">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Nom:</span>
                        <span className="font-medium">{business.name}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Catégorie:</span>
                        <span className="font-medium">{business.category.name}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Statut:</span>
                        <span className={`font-medium ${business.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                          {business.isOpen ? 'Ouvert' : 'Fermé'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Créé le:</span>
                        <span className="font-medium">{format(parseISO(business.createdAt), 'dd/MM/yyyy')}</span>
                      </p>
                    </div>
                  </div>

                  {business.admins.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Administrateurs</h3>
                      <div className="mt-2">
                        {business.admins.map(admin => (
                          <div key={admin.id} className="flex items-center gap-2 py-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500"></span>
                            <span className="font-medium">{admin.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {business.description && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description</h3>
                      <p className="mt-2 text-gray-700">{business.description}</p>
                    </div>
                  )}

                  {business.imageUrl && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Image</h3>
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <Image 
                          src={business.imageUrl} 
                          alt={business.name} 
                          width={400} 
                          height={300} 
                          className="object-cover w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Sections du menu</h3>
                <button
                  onClick={() => openSectionModal()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  Ajouter une section
                </button>
              </div>

              {business.menuSections?.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
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
                      {business.menuSections.map((section) => (
                        <tr key={section.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{section.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {format(parseISO(section.createdAt), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => openSectionModal(section)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openDeleteModal('section', section.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune section disponible</p>
                  <button
                    onClick={() => openSectionModal()}
                    className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Créer votre première section
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une section
                </label>
                <select
                  id="section-select"
                  onChange={(e) => setCurrentSection(business.menuSections.find(s => s.id === e.target.value) || null)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">-- Choisir une section --</option>
                  {business.menuSections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>

              {currentSection && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Items de {currentSection.name}</h3>
                    <button
                      onClick={() => openItemModal()}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Ajouter un item
                    </button>
                  </div>

                  {currentSection.menuItems?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentSection.menuItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <span className="font-bold text-indigo-600">{item.price}F</span>
                            </div>
                            {item.description && (
                              <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <span className={`px-2 py-1 text-xs rounded-full ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.isAvailable ? 'Disponible' : 'Indisponible'}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openItemModal(item)}
                                  className="p-1 text-gray-500 hover:text-indigo-600"
                                  title="Modifier"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal('item', item.id)}
                                  className="p-1 text-gray-500 hover:text-red-600"
                                  title="Supprimer"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Aucun item disponible dans cette section</p>
                      <button
                        onClick={() => openItemModal()}
                        className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Ajouter votre premier item
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Supprimer {deleteType === 'section' ? 'la section' : "l'item"}
                </h2>
                <button 
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir supprimer {deleteType === 'section' ? 'cette section' : "cet item"} ? 
                  Cette action est irréversible.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 ${isDeleting ? 'opacity-75' : ''}`}
                >
                  {isDeleting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Section */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {currentSection ? 'Modifier' : 'Ajouter'} une section
              </h2>
              <button onClick={closeSectionModal} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitSection(onSubmitSection)} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la section *
                  </label>
                  <input
                    {...registerSection('name', { required: 'Ce champ est obligatoire' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {sectionErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{sectionErrors.name.message}</p>
                  )}
                </div>
                <input
                  {...registerSection('businessId')}
                  type="hidden"
                  value={id as string}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={closeSectionModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75' : ''}`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting 
                    ? (currentSection ? 'Mise à jour...' : 'Création...') 
                    : (currentSection ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {currentItem ? 'Modifier' : 'Ajouter'} un item
              </h2>
              <button onClick={closeItemModal} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitItem(onSubmitItem)} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'item *
                  </label>
                  <input
                    {...registerItem('name', { required: 'Ce champ est obligatoire' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {itemErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{itemErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...registerItem('description')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix *
                  </label>
                  <input
                    {...registerItem('price', { required: 'Ce champ est obligatoire', valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {itemErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{itemErrors.price.message}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    {...registerItem('isAvailable')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                    Disponible
                  </label>
                </div>
                <input
                  {...registerItem('menuSectionId')}
                  type="hidden"
                  value={currentSection?.id || ''}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75' : ''}`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting 
                    ? (currentItem ? 'Mise à jour...' : 'Création...') 
                    : (currentItem ? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}