import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="sticky top-[120px] z-40 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar escola por nome, endereço ou bairro..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-card border-border focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
