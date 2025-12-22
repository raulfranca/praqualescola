import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { SchoolLevel, ManagementType, FilterMetric } from "@/components/FilterDrawer";

// Session storage key for filters
const FILTERS_SESSION_KEY = "escola-filters-session";

// Default filter values - reset to these on new session
const DEFAULT_FILTERS = {
  selectedLevels: ["creche", "pre", "fundamental"] as SchoolLevel[],
  selectedManagement: ["prefeitura", "terceirizada"] as ManagementType[],
  maxDistanceFilter: null as number | null,
  maxDurationFilter: null as number | null,
  filterMetric: "distance" as FilterMetric,
  showOnlyVacancies: false,
};

interface StoredFilters {
  selectedLevels: SchoolLevel[];
  selectedManagement: ManagementType[];
  maxDistanceFilter: number | null;
  maxDurationFilter: number | null;
  filterMetric: FilterMetric;
  showOnlyVacancies: boolean;
}

function getInitialFilters(): StoredFilters {
  try {
    const stored = sessionStorage.getItem(FILTERS_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredFilters;
      console.log("📍 Filters restored from session:", parsed);
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse stored filters:", e);
  }
  
  console.log("🔄 New session detected - Using default filters");
  return DEFAULT_FILTERS;
}

interface FilterContextType {
  selectedLevels: SchoolLevel[];
  setSelectedLevels: (levels: SchoolLevel[]) => void;
  selectedManagement: ManagementType[];
  setSelectedManagement: (management: ManagementType[]) => void;
  maxDistanceFilter: number | null;
  setMaxDistanceFilter: (distance: number | null) => void;
  maxDurationFilter: number | null;
  setMaxDurationFilter: (duration: number | null) => void;
  filterMetric: FilterMetric;
  setFilterMetric: (metric: FilterMetric) => void;
  showOnlyVacancies: boolean;
  setShowOnlyVacancies: (show: boolean) => void;
  initializeDistanceFilters: (hasDistances: boolean, distanceMax: number, durationMax: number) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const initialFilters = getInitialFilters();
  
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(initialFilters.selectedLevels);
  const [selectedManagement, setSelectedManagement] = useState<ManagementType[]>(initialFilters.selectedManagement);
  const [maxDistanceFilter, setMaxDistanceFilterInternal] = useState<number | null>(initialFilters.maxDistanceFilter);
  const [maxDurationFilter, setMaxDurationFilterInternal] = useState<number | null>(initialFilters.maxDurationFilter);
  const [filterMetric, setFilterMetric] = useState<FilterMetric>(initialFilters.filterMetric);
  const [showOnlyVacancies, setShowOnlyVacancies] = useState(initialFilters.showOnlyVacancies);

  // Persist filters to sessionStorage whenever they change
  useEffect(() => {
    const filtersToStore: StoredFilters = {
      selectedLevels,
      selectedManagement,
      maxDistanceFilter,
      maxDurationFilter,
      filterMetric,
      showOnlyVacancies,
    };
    sessionStorage.setItem(FILTERS_SESSION_KEY, JSON.stringify(filtersToStore));
  }, [selectedLevels, selectedManagement, maxDistanceFilter, maxDurationFilter, filterMetric, showOnlyVacancies]);

  const initializeDistanceFilters = useCallback((hasDistances: boolean, distanceMax: number, durationMax: number) => {
    if (hasDistances) {
      setMaxDistanceFilterInternal(prev => prev ?? distanceMax);
      setMaxDurationFilterInternal(prev => prev ?? durationMax);
    } else {
      setMaxDistanceFilterInternal(null);
      setMaxDurationFilterInternal(null);
    }
  }, []);

  return (
    <FilterContext.Provider
      value={{
        selectedLevels,
        setSelectedLevels,
        selectedManagement,
        setSelectedManagement,
        maxDistanceFilter,
        setMaxDistanceFilter: setMaxDistanceFilterInternal,
        maxDurationFilter,
        setMaxDurationFilter: setMaxDurationFilterInternal,
        initializeDistanceFilters,
        filterMetric,
        setFilterMetric,
        showOnlyVacancies,
        setShowOnlyVacancies,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};
