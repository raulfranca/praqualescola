import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DistanceHistogram } from "@/components/DistanceHistogram";
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

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLevels: SchoolLevel[];
  onLevelsChange: (levels: SchoolLevel[]) => void;
  selectedManagement: ManagementType[];
  onManagementChange: (management: ManagementType[]) => void;
  schoolCount: number;
  // Distance filter props (only when home location is set)
  hasHomeLocation?: boolean;
  minDistance?: number;
  maxDistance?: number;
  selectedDistance?: number;
  onDistanceChange?: (distance: number) => void;
  schoolDistances?: number[];
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
}: FilterDrawerProps) {
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
    // Reset distance to max (show all)
    if (onDistanceChange && hasHomeLocation) {
      onDistanceChange(maxDistance);
    }
  };

  const applyFilters = () => {
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

            {hasHomeLocation && onDistanceChange && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Distância</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    Até {selectedDistance.toFixed(1)} km
                  </span>
                </div>
                
                <div className="px-2">
                  {schoolDistances.length > 0 && (
                    <DistanceHistogram
                      distances={schoolDistances}
                      minDistance={minDistance}
                      maxDistance={maxDistance}
                    />
                  )}
                  <Slider
                    value={[selectedDistance]}
                    onValueChange={(value) => onDistanceChange(value[0])}
                    min={minDistance}
                    max={maxDistance}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{minDistance.toFixed(1)} km</span>
                    <span>{maxDistance.toFixed(1)} km</span>
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
              className="text-base underline"
            >
              Limpar tudo
            </Button>
            
            <Button
              onClick={applyFilters}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-12 rounded-lg text-base font-semibold"
            >
              Mostrar {schoolCount} {schoolCount === 1 ? "escola" : "escolas"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
