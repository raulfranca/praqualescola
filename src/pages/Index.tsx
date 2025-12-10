import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ActionChips } from "@/components/ActionChips";
import { MapView } from "@/components/MapView";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { CampaignBanner } from "@/components/CampaignBanner";
import { FilterDrawer, SchoolLevel, ManagementType, FilterMetric } from "@/components/FilterDrawer";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { useSchoolDistances } from "@/hooks/useSchoolDistances";
import { useFilters } from "@/contexts/FilterContext";
import { School } from "@/types/school";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [showHomeInput, setShowHomeInput] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  
  // Use shared filter context
  const {
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
  } = useFilters();
  
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite } = useFavorites();
  const { homeLocation, setHome, clearHome, hasHome } = useHomeLocation();
  
  // Calculate distances from home location to all schools (manual calculation)
  const { 
    schoolsWithDistances, 
    sortedSchools, 
    hasDistances,
    isCalculating,
    calculateAndCacheDistances,
    hasCachedDistances,
    clearDistances,
  } = useSchoolDistances(schools, homeLocation);

  const hasLevel = (school: School, level: SchoolLevel): boolean => {
    switch (level) {
      case "creche":
        return !!(school.bercario || school.infantil1 || school.infantil2);
      case "pre":
        return !!(school.pre1 || school.pre2);
      case "fundamental":
        return !!(school.ano1 || school.ano2 || school.ano3 || school.ano4 || school.ano5);
      default:
        return false;
    }
  };

  const hasAnyLevel = (school: School): boolean => {
    return !!(
      school.bercario || school.infantil1 || school.infantil2 ||
      school.pre1 || school.pre2 ||
      school.ano1 || school.ano2 || school.ano3 || school.ano4 || school.ano5
    );
  };

  // Calculate distance range for slider
  const distanceRange = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) {
      return { min: 0, max: 10 };
    }
    
    const distances = schoolsWithDistances
      .map(s => s.distanceInKm)
      .filter((d): d is number => d !== undefined);
    
    if (distances.length === 0) {
      return { min: 0, max: 10 };
    }
    
    const min = Math.min(...distances);
    const max = Math.max(...distances);
    
    return { 
      min: Math.floor(min * 10) / 10, // Round down to 1 decimal
      max: Math.ceil(max * 10) / 10   // Round up to 1 decimal
    };
  }, [schoolsWithDistances, hasDistances]);

  // Calculate duration range for slider
  const durationRange = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) {
      return { min: 0, max: 30 };
    }
    
    const durations = schoolsWithDistances
      .map(s => s.durationInMinutes)
      .filter((d): d is number => d !== undefined);
    
    if (durations.length === 0) {
      return { min: 0, max: 30 };
    }
    
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { 
      min: Math.floor(min),
      max: Math.ceil(max)
    };
  }, [schoolsWithDistances, hasDistances]);

  // Calculate global histogram max for absolute scaling (using ALL schools, not filtered)
  const globalHistogramMax = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) {
      return 1;
    }

    const bucketCount = 25;
    const range = filterMetric === "distance" ? distanceRange : durationRange;
    const bucketSize = (range.max - range.min) / bucketCount;
    const bucketArray = new Array(bucketCount).fill(0);

    schoolsWithDistances.forEach((school) => {
      const value = filterMetric === "distance" ? school.distanceInKm : school.durationInMinutes;
      if (value !== undefined) {
        const bucketIndex = Math.min(
          Math.floor((value - range.min) / bucketSize),
          bucketCount - 1
        );
        if (bucketIndex >= 0) {
          bucketArray[bucketIndex]++;
        }
      }
    });

    return Math.max(...bucketArray, 1);
  }, [schoolsWithDistances, distanceRange, durationRange, filterMetric, hasDistances]);

  const { initializeDistanceFilters } = useFilters();

  useEffect(() => {
    initializeDistanceFilters(hasDistances, distanceRange.max, durationRange.max);
  }, [hasDistances, distanceRange.max, durationRange.max, initializeDistanceFilters]);

  // Master filtered list: applies Level, Management, and Campaign filters (NOT distance)
  // This represents "all eligible schools regardless of distance" for histogram and future UI counters
  const schoolsMatchingCriteria = useMemo(() => {
    let filtered = schoolsWithDistances;

    // Apply filters with exception rule
    filtered = filtered.filter((school) => {
      // Exception: Schools with NO levels are ALWAYS visible
      if (!hasAnyLevel(school)) {
        return true;
      }

      // For schools with levels, apply both filters
      const matchesLevel = selectedLevels.some((level) => hasLevel(school, level));
      
      const matchesManagement = selectedManagement.some((type) => {
        if (type === "prefeitura") {
          return !school.outsourced || school.outsourced.trim() === "";
        } else {
          return school.outsourced && school.outsourced.trim() !== "";
        }
      });

      return matchesLevel && matchesManagement;
    });

    // Apply campaign vacancy filter
    if (showOnlyVacancies) {
      filtered = filtered.filter((school) => {
        return school.vacancies && school.vacancies > 0;
      });
    }

    return filtered;
  }, [schoolsWithDistances, selectedLevels, selectedManagement, showOnlyVacancies]);

  const filteredSchools = useMemo(() => {
    let filtered = schoolsMatchingCriteria;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.address.toLowerCase().includes(query) ||
          school.neighborhood.toLowerCase().includes(query)
      );
    }

    // Apply distance/duration filter (only when home location is set)
    if (hasDistances) {
      if (filterMetric === "distance" && maxDistanceFilter !== null) {
        filtered = filtered.filter((school) => {
          if (school.distanceInKm === undefined) return false;
          return school.distanceInKm <= maxDistanceFilter;
        });
      } else if (filterMetric === "time" && maxDurationFilter !== null) {
        filtered = filtered.filter((school) => {
          if (school.durationInMinutes === undefined) return false;
          return school.durationInMinutes <= maxDurationFilter;
        });
      }
    }

    return filtered;
  }, [searchQuery, schoolsMatchingCriteria, hasDistances, maxDistanceFilter, maxDurationFilter, filterMetric]);

  // When selecting from search bar - should center map
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setShouldCenterMap(true);
  };

  // When clicking on map marker - should NOT center map
  const handleSchoolClickOnMap = (school: School) => {
    setSelectedSchool(school);
    setShouldCenterMap(false);
  };

  const handleFilterClick = () => {
    setShowFilterDrawer(true);
  };

  const handleShowVacanciesFromBanner = () => {
    setShowOnlyVacancies(true);
    setShowFilterDrawer(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-16 md:pb-0 md:ml-16">
      {loading && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando escolas...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Campaign Banner */}
          <CampaignBanner onShowVacancies={handleShowVacanciesFromBanner} />

          {/* Floating Search Bar and Action Chips */}
          <div className="absolute top-4 left-4 right-4 md:left-20 z-50 flex flex-col md:flex-row gap-3 md:items-start">
            <SearchBar
              value={searchQuery} 
              onChange={setSearchQuery}
              schools={schools}
              onSelectSchool={handleSelectSchool}
              onDevModeChange={setDevModeEnabled}
            />
            <ActionChips
              hasHome={hasHome}
              homeAddress={homeLocation?.address}
              onHomeClick={() => setShowHomeInput(true)}
              onFilterClick={handleFilterClick}
              hasActiveFilters={
                selectedLevels.length < 3 || 
                selectedManagement.length < 2 ||
                (hasDistances && filterMetric === "distance" && maxDistanceFilter !== null && maxDistanceFilter < distanceRange.max) ||
                (hasDistances && filterMetric === "time" && maxDurationFilter !== null && maxDurationFilter < durationRange.max) ||
                showOnlyVacancies
              }
            />
          </div>

          {/* Map View - Full Screen */}
          <div className="relative flex-1 w-full h-full">
            <MapView
              schools={filteredSchools}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              selectedSchool={selectedSchool}
              onSchoolClick={handleSchoolClickOnMap}
              shouldCenterMap={shouldCenterMap}
              homeLocation={homeLocation}
              isActive={true}
            />
          </div>
        </>
      )}

      {/* Home Location Input - Always mounted, controlled by showHomeInput state */}
      {showHomeInput && (
        <HomeLocationInput
          onLocationSelected={(location) => {
            setHome(location);
          }}
          onClose={() => setShowHomeInput(false)}
          homeLocation={homeLocation}
          onClearLocation={() => {
            clearHome();
            clearDistances();
            setShowHomeInput(false);
          }}
          onCalculateDistances={calculateAndCacheDistances}
          isCalculating={isCalculating}
          hasCachedDistances={hasCachedDistances}
          devModeEnabled={devModeEnabled}
        />
      )}

      {/* School Detail Modal - Always mounted, controlled by open prop */}
      <SchoolDetailModal
        school={selectedSchool}
        isFavorite={selectedSchool ? favorites.includes(selectedSchool.id) : false}
        onToggleFavorite={() => selectedSchool && toggleFavorite(selectedSchool.id)}
        onClose={() => setSelectedSchool(null)}
        homeLocation={homeLocation}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        open={showFilterDrawer}
        onOpenChange={setShowFilterDrawer}
        selectedLevels={selectedLevels}
        onLevelsChange={setSelectedLevels}
        selectedManagement={selectedManagement}
        onManagementChange={setSelectedManagement}
        schoolCount={filteredSchools.length}
        hasHomeLocation={hasHome}
        minDistance={distanceRange.min}
        maxDistance={distanceRange.max}
        selectedDistance={maxDistanceFilter ?? distanceRange.max}
        onDistanceChange={setMaxDistanceFilter}
        schoolDistances={schoolsMatchingCriteria
          .map(s => s.distanceInKm)
          .filter((d): d is number => d !== undefined)}
        minDuration={durationRange.min}
        maxDuration={durationRange.max}
        selectedDuration={maxDurationFilter ?? durationRange.max}
        onDurationChange={setMaxDurationFilter}
        schoolDurations={schoolsMatchingCriteria
          .map(s => s.durationInMinutes)
          .filter((d): d is number => d !== undefined)}
        globalHistogramMax={globalHistogramMax}
        filterMetric={filterMetric}
        onMetricChange={setFilterMetric}
        showOnlyVacancies={showOnlyVacancies}
        onVacanciesChange={setShowOnlyVacancies}
      />
    </div>
  );
};

export default Index;
