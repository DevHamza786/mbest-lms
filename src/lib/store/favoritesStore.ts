import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteResource {
  id: string;
  title: string;
  type: string;
  category: string;
  addedAt: string;
}

interface FavoritesStore {
  favorites: FavoriteResource[];
  addToFavorites: (resource: Omit<FavoriteResource, 'addedAt'>) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getFavoritesByType: (type: string) => FavoriteResource[];
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      addToFavorites: (resource) => {
        const { favorites } = get();
        if (!favorites.find(f => f.id === resource.id)) {
          set({
            favorites: [
              ...favorites,
              { ...resource, addedAt: new Date().toISOString() }
            ]
          });
        }
      },
      
      removeFromFavorites: (id) => {
        set({
          favorites: get().favorites.filter(f => f.id !== id)
        });
      },
      
      isFavorite: (id) => {
        return get().favorites.some(f => f.id === id);
      },
      
      getFavoritesByType: (type) => {
        return get().favorites.filter(f => f.type === type);
      },
    }),
    {
      name: 'lms-favorites-storage',
    }
  )
);