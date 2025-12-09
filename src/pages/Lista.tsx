import { useState, useMemo, useEffect } from "react";
import { SchoolListCard } from "@/components/SchoolListCard";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { SearchBar } from "@/components/SearchBar";
import { ActionChips, SortOption } from "@/components/ActionChips";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { CampaignBanner } from "@/components/CampaignBanner";
import { FilterDrawer, SchoolLevel, ManagementType, FilterMetric } from "@/components/FilterDrawer";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { useSchoolDistances } from "@/hooks/useSchoolDistances";
import { useCampaign } from "@/hooks/useCampaign";
import { School } from "@/types/school";
import { ScrollArea } from "@/components/ui/scroll-area";

const Lista = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showHomeInput, setShowHomeInput] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(["creche", "pre", "fundamental"]);
  const [selectedManagement, setSelectedManagement] = useState<ManagementType[]>(["prefeitura", "terceirizada"]);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | null>(null);
  const [maxDurationFilter, setMaxDurationFilter] = useState<number | null>(null);
  const [filterMetric, setFilterMetric] = useState<FilterMetric>("distance");
  const [showOnlyVacancies, setShowOnlyVacancies] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite } = useFavorites();
  const { homeLocation, setHome, clearHome, hasHome } = useHomeLocation();
  const { isActive: hasCampaign } = useCampaign();

  const { schoolsWithDistances, hasDistances } = useSchoolDistances(schools, homeLocation);

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

  const distanceRange = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) {
      return { min: 0, max: 10 };
    }
    const distances = schoolsWithDistances
      .map(s => s.distanceInKm)
      .filter((d): d is number => d !== undefined);
    if (distances.length === 0) return { min: 0, max: 10 };
    return {
      min: Math.floor(Math.min(...distances) * 10) / 10,
      max: Math.ceil(Math.max(...distances) * 10) / 10
    };
  }, [schoolsWithDistances, hasDistances]);

  const durationRange = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) {
      return { min: 0, max: 30 };
    }
    const durations = schoolsWithDistances
      .map(s => s.durationInMinutes)
      .filter((d): d is number => d !== undefined);
    if (durations.length === 0) return { min: 0, max: 30 };
    return {
      min: Math.floor(Math.min(...durations)),
      max: Math.ceil(Math.max(...durations))
    };
  }, [schoolsWithDistances, hasDistances]);

  const globalHistogramMax = useMemo(() => {
    if (!hasDistances || schoolsWithDistances.length === 0) return 1;
    const bucketCount = 25;
    const range = filterMetric === "distance" ? distanceRange : durationRange;
    const bucketSize = (range.max - range.min) / bucketCount;
    const bucketArray = new Array(bucketCount).fill(0);
    schoolsWithDistances.forEach((school) => {
      const value = filterMetric === "distance" ? school.distanceInKm : school.durationInMinutes;
      if (value !== undefined) {
        const bucketIndex = Math.min(Math.floor((value - range.min) / bucketSize), bucketCount - 1);
        if (bucketIndex >= 0) bucketArray[bucketIndex]++;
      }
    });
    return Math.max(...bucketArray, 1);
  }, [schoolsWithDistances, distanceRange, durationRange, filterMetric, hasDistances]);

  useEffect(() => {
    if (hasDistances) {
      setMaxDistanceFilter(distanceRange.max);
      setMaxDurationFilter(durationRange.max);
    } else {
      setMaxDistanceFilter(null);
      setMaxDurationFilter(null);
    }
  }, [homeLocation, hasDistances, distanceRange.max, durationRange.max]);

  const schoolsMatchingCriteria = useMemo(() => {
    let filtered = schoolsWithDistances;
    filtered = filtered.filter((school) => {
      if (!hasAnyLevel(school)) return true;
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
    if (showOnlyVacancies) {
      filtered = filtered.filter((school) => school.vacancies && school.vacancies > 0);
    }
    return filtered;
  }, [schoolsWithDistances, selectedLevels, selectedManagement, showOnlyVacancies]);

  const filteredSchools = useMemo(() => {
    let filtered = schoolsMatchingCriteria;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.address.toLowerCase().includes(query) ||
          school.neighborhood.toLowerCase().includes(query)
      );
    }
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

  // Sort schools based on sortBy selection
  const sortedSchools = useMemo(() => {
    const schoolsToSort = [...filteredSchools];
    
    switch (sortBy) {
      case "alphabetical":
        return schoolsToSort.sort((a, b) => 
          `${a.type} ${a.name}`.localeCompare(`${b.type} ${b.name}`, 'pt-BR')
        );
      case "vacancies":
        return schoolsToSort.sort((a, b) => 
          (b.vacancies ?? 0) - (a.vacancies ?? 0)
        );
      case "distance":
        if (!hasDistances) return schoolsToSort;
        return schoolsToSort.sort((a, b) => 
          (a.distanceInKm ?? Infinity) - (b.distanceInKm ?? Infinity)
        );
      case "time":
        if (!hasDistances) return schoolsToSort;
        return schoolsToSort.sort((a, b) => 
          (a.durationInMinutes ?? Infinity) - (b.durationInMinutes ?? Infinity)
        );
      default:
        return schoolsToSort;
    }
  }, [filteredSchools, sortBy, hasDistances]);

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
          <CampaignBanner onShowVacancies={handleShowVacanciesFromBanner} />

          {/* Search and Action Chips */}
          <div className="p-4 pb-2 space-y-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              schools={schools}
              onSelectSchool={setSelectedSchool}
            />
            <ActionChips
              hasHome={hasHome}
              homeAddress={homeLocation?.address}
              onHomeClick={() => setShowHomeInput(true)}
              onFilterClick={() => setShowFilterDrawer(true)}
              hasActiveFilters={
                selectedLevels.length < 3 ||
                selectedManagement.length < 2 ||
                (hasDistances && filterMetric === "distance" && maxDistanceFilter !== null && maxDistanceFilter < distanceRange.max) ||
                (hasDistances && filterMetric === "time" && maxDurationFilter !== null && maxDurationFilter < durationRange.max) ||
                showOnlyVacancies
              }
              showSortChip={true}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasCampaign={hasCampaign}
            />
          </div>

          {/* School List */}
          <ScrollArea className="flex-1" style={{ overflowX: 'hidden', width: '100%' }}>
            {sortedSchools.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Nenhuma escola encontrada com esses filtros
              </div>
            ) : (
              <div 
                className="divide-y divide-border"
                style={{ 
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'hidden',
                  boxSizing: 'border-box'
                }}
              >
                {sortedSchools.map((school) => (
                  <SchoolListCard
                    key={school.id}
                    school={school}
                    isFavorite={favorites.includes(school.id)}
                    onToggleFavorite={() => toggleFavorite(school.id)}
                    onClick={() => setSelectedSchool(school)}
                    hasHomeLocation={hasHome}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {showHomeInput && (
        <HomeLocationInput
          onLocationSelected={(location) => {
            setHome(location);
            setShowHomeInput(false);
          }}
          onClose={() => setShowHomeInput(false)}
          homeLocation={homeLocation}
          onClearLocation={() => {
            clearHome();
            setShowHomeInput(false);
          }}
        />
      )}

      <SchoolDetailModal
        school={selectedSchool}
        isFavorite={selectedSchool ? favorites.includes(selectedSchool.id) : false}
        onToggleFavorite={() => selectedSchool && toggleFavorite(selectedSchool.id)}
        onClose={() => setSelectedSchool(null)}
        homeLocation={homeLocation}
      />

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

export default Lista;
