// src/types/menu-item.ts
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  menuSectionId: string;
  type?: string;
  isAvailable: boolean;
  createdAt: Date;
  section?: {
    name: string;
  };
}

export interface MenuSection {
  id: string;
  name: string;
  description?: string;
}