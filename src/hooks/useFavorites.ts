import { useState, useEffect } from "react";

const FAVORITES_KEY = "school-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (schoolId: string) => {
    setFavorites((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const isFavorite = (schoolId: string) => favorites.includes(schoolId);

  const reorderFavorites = (newOrder: string[]) => {
    setFavorites(newOrder);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    reorderFavorites,
  };
}
