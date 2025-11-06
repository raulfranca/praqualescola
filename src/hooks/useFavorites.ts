import { useState, useEffect } from "react";

const FAVORITES_KEY = "school-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (schoolId: number) => {
    setFavorites((prev) =>
      prev.includes(schoolId)
        ? prev.filter((id) => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const isFavorite = (schoolId: number) => favorites.includes(schoolId);

  const reorderFavorites = (newOrder: number[]) => {
    setFavorites(newOrder);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    reorderFavorites,
  };
}
