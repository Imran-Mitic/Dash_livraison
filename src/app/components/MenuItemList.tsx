import { useState } from 'react';
import { MenuItem } from '../types/menu-item';
import { MenuItemForm } from './MenuItemForm';

interface MenuItemListProps {
  items: MenuItem[];
  sections: { id: string; name: string }[];
  onItemUpdated: () => void;
  onDeleteItem: (id: string) => Promise<void>;
}

export const MenuItemList = ({ items, sections, onItemUpdated, onDeleteItem }: MenuItemListProps) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await onDeleteItem(id);
      onItemUpdated();
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {editingItem ? (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-medium text-black">Modifier l'item</h3>
          <MenuItemForm
            initialData={editingItem}
            sections={sections}
            onSubmit={async (data) => {
              // Vous devrez implémenter la logique de mise à jour dans le composant parent
              onItemUpdated();
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      ) : null}

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-black sm:pl-6">
                Nom
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                Section
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                Prix
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                Disponible
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-black sm:pl-6">
                  {item.name}
                  {item.description && (
                    <p className="text-xs text-black">{item.description}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                  {item.section?.name || 'N/A'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                  {item.price.toFixed(2)} F
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                  {item.isAvailable ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-black">
                      Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-black">
                      Non
                    </span>
                  )}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {isDeleting === item.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};