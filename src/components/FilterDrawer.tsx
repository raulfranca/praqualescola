import { useState, useEffect, useRef, useCallback } from "react";
import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DistanceHistogram } from "@/components/DistanceHistogram";
import { useCampaign } from "@/contexts/CampaignContext";
import { trackEvent } from "@/lib/analytics";
import coruja from "../../design-system/assets/coruja.svg";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

export type SchoolLevel = "creche" | "pre" | "fundamental";
export type ManagementType = "prefeitura" | "terceirizada";
export type FilterMetric = "distance" | "time";

/**
 * Format duration in minutes to "Xh Ymin" or "X min"
 * Examples: 55 -> "55 min", 66 -> "1h 06min", 125 -> "2h 05min"
 */
function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} min`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const paddedMinutes = minutes.toString().padStart(2, '0');
  
  return `${hours}h ${paddedMinutes}min`;
}

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLevels: SchoolLevel[];
  onLevelsChange: (levels: SchoolLevel[]) => void;
  selectedManagement: ManagementType[];
  onManagementChange: (management: ManagementType[]) => void;
  schoolCount: number;
  // Distance/Time filter props (only when home location is set)
  hasHomeLocation?: boolean;
  minDistance?: number;
  maxDistance?: number;
  selectedDistance?: number;
  onDistanceChange?: (distance: number) => void;
  schoolDistances?: number[];
  minDuration?: number;
  maxDuration?: number;
  selectedDuration?: number;
  onDurationChange?: (duration: number) => void;
  schoolDurations?: number[];
  globalHistogramMax?: number;
  filterMetric?: FilterMetric;
  onMetricChange?: (metric: FilterMetric) => void;
  // Campaign filter props
  showOnlyVacancies?: boolean;
  onVacanciesChange?: (showOnly: boolean) => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  selectedLevels,
  onLevelsChange,
  selectedManagement,
  onManagementChange,
  schoolCount,
  hasHomeLocation = false,
  minDistance = 0,
  maxDistance = 10,
  selectedDistance = 10,
  onDistanceChange,
  schoolDistances = [],
  minDuration = 0,
  maxDuration = 30,
  selectedDuration = 30,
  onDurationChange,
  schoolDurations = [],
  globalHistogramMax = 1,
  filterMetric = "distance",
  onMetricChange,
  showOnlyVacancies = false,
  onVacanciesChange,
}: FilterDrawerProps) {
  const { campanha } = useCampaign();
  // Local state for smooth slider dragging (visual only)
  const [localDistance, setLocalDistance] = useState(selectedDistance);
  const [localDuration, setLocalDuration] = useState(selectedDuration);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<number | null>(null);

  // Sync local state when prop changes (e.g., "Limpar tudo")
  useEffect(() => {
    setLocalDistance(selectedDistance);
  }, [selectedDistance]);

  useEffect(() => {
    setLocalDuration(selectedDuration);
  }, [selectedDuration]);

  // True throttling: updates happen continuously at intervals during drag (100ms = ~10 updates/sec)
  const handleDistanceChange = useCallback((value: number) => {
    setLocalDistance(value);
    pendingValueRef.current = value;

    if (!throttleTimerRef.current) {
      onDistanceChange?.(value);
      pendingValueRef.current = null;
      
      throttleTimerRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          onDistanceChange?.(pendingValueRef.current);
          pendingValueRef.current = null;
        }
        throttleTimerRef.current = null;
      }, 100);
    }
  }, [onDistanceChange]);

  const handleDurationChange = useCallback((value: number) => {
    setLocalDuration(value);
    pendingValueRef.current = value;

    if (!throttleTimerRef.current) {
      onDurationChange?.(value);
      pendingValueRef.current = null;
      
      throttleTimerRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          onDurationChange?.(pendingValueRef.current);
          pendingValueRef.current = null;
        }
        throttleTimerRef.current = null;
      }, 100);
    }
  }, [onDurationChange]);

  // Cleanup throttle timer on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  const toggleLevel = (level: SchoolLevel) => {
    if (selectedLevels.includes(level)) {
      onLevelsChange(selectedLevels.filter((l) => l !== level));
    } else {
      onLevelsChange([...selectedLevels, level]);
    }
  };

  const toggleManagement = (type: ManagementType) => {
    if (selectedManagement.includes(type)) {
      onManagementChange(selectedManagement.filter((t) => t !== type));
    } else {
      onManagementChange([...selectedManagement, type]);
    }
  };

  const clearAll = () => {
    onLevelsChange(["creche", "pre", "fundamental"]);
    onManagementChange(["prefeitura", "terceirizada"]);
    // Reset distance/duration to max (show all)
    if (hasHomeLocation) {
      if (onDistanceChange) onDistanceChange(maxDistance);
      if (onDurationChange) onDurationChange(maxDuration);
    }
    // Reset campaign filter
    if (onVacanciesChange) {
      onVacanciesChange(false);
    }
  };

  const applyFilters = () => {
    // Track filter application
    trackEvent('apply_filters', {
      levels: selectedLevels.join(','),
      management: selectedManagement.join(','),
      metric: filterMetric,
      has_distance_filter: hasHomeLocation && (
        filterMetric === 'distance' ? selectedDistance < maxDistance : selectedDuration < maxDuration
      ),
      campaign_filter_active: showOnlyVacancies
    });
    
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-2xl font-semibold">Filtros</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Campaign Filter Toggle (only visible when campaign is active) */}
            {campanha && onVacanciesChange && (
              <div className="grid grid-cols-[40px_minmax(0,1fr)_52px] items-center gap-2.5 rounded-xl bg-info-bg py-3.5 pl-2.5 pr-3.5 text-info-fg">
                <img src={coruja} alt="" aria-hidden="true" className="h-10 w-10" />
                <label htmlFor="so-vagas" className="flex min-w-0 flex-col gap-0.5 cursor-pointer">
                  <strong className="text-[15px] font-semibold text-foreground">Só escolas com vagas</strong>
                  <span className="text-[13px]">
                    {campanha.nome} · {campanha.escolas_com_vaga}{" "}
                    {campanha.escolas_com_vaga === 1 ? "escola" : "escolas"}
                  </span>
                </label>
                <Switch
                  id="so-vagas"
                  checked={showOnlyVacancies}
                  onCheckedChange={onVacanciesChange}
                  className="h-8 w-[52px] [&>span]:h-6 [&>span]:w-6 [&>span]:data-[state=checked]:translate-x-5"
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Nível</h3>
              
              <div className="flex flex-row gap-4 flex-wrap">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedLevels.includes("creche")}
                    onCheckedChange={() => toggleLevel("creche")}
                  />
                  <span className="text-base">Creche</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedLevels.includes("pre")}
                    onCheckedChange={() => toggleLevel("pre")}
                  />
                  <span className="text-base">Pré</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedLevels.includes("fundamental")}
                    onCheckedChange={() => toggleLevel("fundamental")}
                  />
                  <span className="text-base">Fundamental</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Administração</h3>
              
              <div className="flex flex-row gap-4 flex-wrap">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedManagement.includes("prefeitura")}
                    onCheckedChange={() => toggleManagement("prefeitura")}
                  />
                  <span className="text-base">Prefeitura</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedManagement.includes("terceirizada")}
                    onCheckedChange={() => toggleManagement("terceirizada")}
                  />
                  <span className="text-base">Terceirizada</span>
                </label>
              </div>
            </div>

            {hasHomeLocation && (onDistanceChange || onDurationChange) && (
              <div className="space-y-3">
                <ToggleGroup
                  type="single"
                  value={filterMetric}
                  onValueChange={(value) => {
                    if (value) onMetricChange?.(value as FilterMetric);
                  }}
                  className="grid w-full grid-cols-2 gap-0 rounded-lg bg-secondary p-1"
                >
                  {(["distance", "time"] as const).map((m) => (
                    <ToggleGroupItem
                      key={m}
                      value={m}
                      className="h-[38px] rounded-md text-sm transition-all data-[state=on]:bg-card data-[state=on]:font-semibold data-[state=on]:text-primary data-[state=on]:shadow-ambient data-[state=off]:bg-transparent data-[state=off]:font-medium data-[state=off]:text-muted-foreground"
                    >
                      {m === "distance" ? "Distância" : "Tempo"}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                <div className="flex items-baseline justify-between text-[13px]" data-testid="limite-distancia">
                  <span className="font-semibold">
                    {filterMetric === "distance" ? `Até ${localDistance.toFixed(1)} km` : `Até ${formatDuration(localDuration)}`}
                  </span>
                  <span className="text-muted-foreground">
                    {(() => {
                      const n =
                        filterMetric === "distance"
                          ? schoolDistances.filter((d) => d <= localDistance).length
                          : schoolDurations.filter((d) => d <= localDuration).length;
                      return `${n} ${n === 1 ? "escola" : "escolas"}`;
                    })()}
                  </span>
                </div>

                <div>
                  {filterMetric === "distance" && schoolDistances.length > 0 && (
                    <DistanceHistogram
                      distances={schoolDistances}
                      minDistance={minDistance}
                      maxDistance={maxDistance}
                      globalMax={globalHistogramMax}
                      selected={localDistance}
                    />
                  )}
                  {filterMetric === "time" && schoolDurations.length > 0 && (
                    <DistanceHistogram
                      distances={schoolDurations}
                      minDistance={minDuration}
                      maxDistance={maxDuration}
                      globalMax={globalHistogramMax}
                      selected={localDuration}
                    />
                  )}
                  
                  {filterMetric === "distance" && onDistanceChange && (
                    <Slider
                      value={[localDistance]}
                      onValueChange={(value) => handleDistanceChange(value[0])}
                      min={minDistance}
                      max={maxDistance}
                      step={0.1}
                      className="w-full"
                    />
                  )}
                  {filterMetric === "time" && onDurationChange && (
                    <Slider
                      value={[localDuration]}
                      onValueChange={(value) => handleDurationChange(value[0])}
                      min={minDuration}
                      max={maxDuration}
                      step={1}
                      className="w-full"
                    />
                  )}
                  
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    {filterMetric === "distance" ? (
                      <>
                        <span>{minDistance.toFixed(1)} km</span>
                        <span>{maxDistance.toFixed(1)} km</span>
                      </>
                    ) : (
                      <>
                        <span>{formatDuration(minDuration)}</span>
                        <span>{formatDuration(maxDuration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t bg-background px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={clearAll}
              className="text-base text-primary hover:text-primary"
            >
              Limpar tudo
            </Button>
            
            <Button
              onClick={applyFilters}
              className="flex-1 bg-gradient-primary hover:bg-primary-strong text-primary-foreground h-12 rounded-lg text-base font-semibold"
            >
              Mostrar {schoolCount} {schoolCount === 1 ? "escola" : "escolas"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
