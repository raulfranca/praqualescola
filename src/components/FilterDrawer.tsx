import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

export type SchoolLevel = "creche" | "pre" | "fundamental";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLevels: SchoolLevel[];
  onLevelsChange: (levels: SchoolLevel[]) => void;
  schoolCount: number;
}

export function FilterDrawer({
  open,
  onOpenChange,
  selectedLevels,
  onLevelsChange,
  schoolCount,
}: FilterDrawerProps) {
  const toggleLevel = (level: SchoolLevel) => {
    if (selectedLevels.includes(level)) {
      onLevelsChange(selectedLevels.filter((l) => l !== level));
    } else {
      onLevelsChange([...selectedLevels, level]);
    }
  };

  const clearAll = () => {
    onLevelsChange([]);
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nível</h3>
            
            <div className="space-y-4">
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
