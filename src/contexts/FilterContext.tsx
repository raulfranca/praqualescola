import React, { createContext, useState, useContext, ReactNode } from "react";
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
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(["creche", "pre", "fundamental"]);
  const [selectedManagement, setSelectedManagement] = useState<ManagementType[]>(["prefeitura", "terceirizada"]);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | null>(null);
  const [maxDurationFilter, setMaxDurationFilter] = useState<number | null>(null);
  const [filterMetric, setFilterMetric] = useState<FilterMetric>("distance");
  const [showOnlyVacancies, setShowOnlyVacancies] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        selectedLevels,
        setSelectedLevels,
        selectedManagement,
        setSelectedManagement,
        maxDistanceFilter,
        setMaxDistanceFilter,
        maxDurationFilter,
        setMaxDurationFilter,
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
