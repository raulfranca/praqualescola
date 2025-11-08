import { useState, useEffect } from "react";

const HOME_LOCATION_KEY = "home-location";

export interface HomeLocation {
  lat: number;
  lng: number;
  address: string;
}

export function useHomeLocation() {
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(() => {
    const stored = localStorage.getItem(HOME_LOCATION_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (homeLocation) {
      localStorage.setItem(HOME_LOCATION_KEY, JSON.stringify(homeLocation));
    } else {
      localStorage.removeItem(HOME_LOCATION_KEY);
    }
  }, [homeLocation]);

  const setHome = (location: HomeLocation) => {
    setHomeLocation(location);
  };

  const clearHome = () => {
    setHomeLocation(null);
  };

  return {
    homeLocation,
    setHome,
    clearHome,
    hasHome: homeLocation !== null,
  };
}
