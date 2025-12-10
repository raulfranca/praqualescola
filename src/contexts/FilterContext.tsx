import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";
import { SchoolLevel, ManagementType, FilterMetric } from "@/components/FilterDrawer";

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
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(["creche", "pre", "fundamental"]);
  const [selectedManagement, setSelectedManagement] = useState<ManagementType[]>(["prefeitura", "terceirizada"]);
  const [maxDistanceFilter, setMaxDistanceFilterInternal] = useState<number | null>(null);
  const [maxDurationFilter, setMaxDurationFilterInternal] = useState<number | null>(null);
  const [filterMetric, setFilterMetric] = useState<FilterMetric>("distance");
  const [showOnlyVacancies, setShowOnlyVacancies] = useState(false);

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
