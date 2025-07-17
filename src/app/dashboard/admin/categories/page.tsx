'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { PlusIcon, ListBulletIcon, Squares2X2Icon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import toast, { Toaster } from 'react-hot-toast'

// Définir l'interface Category
interface Category {
  id: string
  name: string
  slug: string
  imageUrl?: string
  createdAt: string
}

interface CategoryFormData {
  id?: string
  name: string
  image?: FileList
  currentImageUrl?: string
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [view, setView] = useState<'list' | 'card'>('list')
  const [perPage, setPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>()
  const imageFile = watch('image')

  const paginated = categories.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        toast.error('Erreur lors du chargement des catégories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0]
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [imageFile])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id))
      toast.success('Catégorie supprimée avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const openModal = (category: Category | null = null) => {
    setCurrentCategory(category)
    if (category) {
      setValue('name', category.name)
      setValue('id', category.id)
      if (category.imageUrl) {
        setImagePreview(category.imageUrl)
        setValue('currentImageUrl', category.imageUrl)
      }
    } else {
      reset()
      setImagePreview(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    reset()
    setImagePreview(null)
    setCurrentCategory(null)
  }

const onSubmit = async (data: CategoryFormData) => {
  try {
    const formData = new FormData()
    formData.append('name', data.name)
    
    // Ajoutez l'image actuelle si elle existe
    if (currentCategory?.imageUrl) {
      formData.append('currentImageUrl', currentCategory.imageUrl)
    }
    
    // Ajoutez la nouvelle image si elle est sélectionnée
    if (data.image && data.image.length > 0) {
      formData.append('file', data.image[0])
    }

    const url = '/api/categories'
    const method = currentCategory ? 'PUT' : 'POST'
    
    // Pour la mise à jour, ajoutez l'ID
    if (currentCategory) {
      formData.append('id', currentCategory.id)
    }

    const response = await fetch(url, {
      method,
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.details || 'Erreur inconnue')
    }

    const result = await response.json()
    toast.success(currentCategory ? 'Catégorie mise à jour' : 'Catégorie créée')
    
    if (currentCategory) {
      setCategories(categories.map(cat => 
        cat.id === currentCategory.id ? result : cat
      ))
    } else {
      setCategories([result, ...categories])
    }
    closeModal()
  } catch (error: any) {
    toast.error(error.message || 'Une erreur est survenue')
    console.error('Erreur:', error)
  }
}

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen text-gray-800">
      <Toaster position="top-right" />
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                {currentCategory ? 'Modifier' : 'Ajouter'} une catégorie
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  {...register('name', { required: 'Ce champ est obligatoire' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
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
                </div>
                
                {imagePreview && (
                  <div className="mt-4 relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={200}
                      height={150}
                      className="rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setValue('image', undefined)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
                >
                  {currentCategory ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
            <p className="text-gray-500 mt-1">Gérez vos catégories de produits</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <PlusIcon className="h-5 w-5" />
              Ajouter une catégorie
            </button>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setView('list')}
                  className={`p-2 ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('card')}
                  className={`p-2 ${view === 'card' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
              
              <select
                onChange={(e) => setPerPage(parseInt(e.target.value))}
                className="border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white transition-all duration-200 text-sm"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="p-4 text-left font-medium">Nom</th>
                  <th className="p-4 text-left font-medium">Image</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="p-4 font-medium text-gray-900">{cat.name}</td>
                    <td className="p-4">
                      {cat.imageUrl ? (
                        <Image
                          src={cat.imageUrl}
                          alt={cat.name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{format(new Date(cat.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => openModal(cat)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200 text-sm font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginated.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <div className="relative h-40 bg-gray-100">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      Pas d'image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Créé le {format(new Date(cat.createdAt), 'dd/MM/yyyy')}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <button 
                      onClick={() => openModal(cat)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {categories.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.ceil(categories.length / perPage) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    i + 1 === currentPage
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  } transition-all duration-200`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(categories.length / perPage)))}
                disabled={currentPage === Math.ceil(categories.length / perPage)}
                className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}