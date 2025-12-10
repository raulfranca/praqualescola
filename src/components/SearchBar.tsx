import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School } from "@/types/school";
import { useState, useRef, useEffect, useCallback } from "react";
import { removeAccents } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  schools: School[];
  onSelectSchool: (school: School) => void;
  showDropdown?: boolean;
  onDevModeChange?: (enabled: boolean) => void;
}

export function SearchBar({ value, onChange, schools, onSelectSchool, showDropdown = true, onDevModeChange }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Toggle dev mode handler
  const handleDevModeToggle = useCallback(() => {
    const newState = !devModeEnabled;
    setDevModeEnabled(newState);
    onDevModeChange?.(newState);
    onChange(""); // Clear the search input
    
    toast({
      title: newState ? "Modo Desenvolvedor Ativado" : "Modo Desenvolvedor Desativado",
      description: newState 
        ? "Limite diário de endereço removido." 
        : "Limite diário de endereço restaurado.",
      variant: newState ? "default" : "default",
    });
  }, [devModeEnabled, onDevModeChange, onChange, toast]);

  // Handle key press for /dev command
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim().toLowerCase() === "/dev") {
      e.preventDefault();
      handleDevModeToggle();
    }
  }, [value, handleDevModeToggle]);

  // Filter schools based on search query (hide suggestions for /dev command)
  const filteredSchools = value.trim() && value.trim().toLowerCase() !== "/dev"
    ? schools.filter((school) => {
        const query = removeAccents(value.toLowerCase());
        return (
          removeAccents(school.name.toLowerCase()).includes(query) ||
          removeAccents(school.neighborhood.toLowerCase()).includes(query) ||
          removeAccents(school.address.toLowerCase()).includes(query) ||
          (school.outsourced && removeAccents(school.outsourced.toLowerCase()).includes(query))
        );
      }).slice(0, 8) // Limit to 8 results
    : [];

  // Show dropdown when there's a query and results
  useEffect(() => {
    setIsOpen(value.trim().length > 0 && filteredSchools.length > 0);
  }, [value, filteredSchools.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSchool = (school: School) => {
    // Track school view from search bar
    trackEvent('view_item', {
      item_id: school.id,
      item_name: school.name,
      item_category: school.type,
      source: 'search_bar'
    });
    
    // Track the search term that led to this selection
    trackEvent('search', {
      search_term: value,
      item_selected: school.name
    });
    
    onSelectSchool(school);
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:w-96" ref={dropdownRef}>
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${devModeEnabled ? "text-red-500" : "text-muted-foreground"}`} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={devModeEnabled ? "Modo Desenvolvedor" : "Buscar escola por nome, endereço ou bairro..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`pl-12 pr-4 h-12 bg-white rounded-full shadow-lg focus-visible:ring-2 text-foreground ${
            devModeEnabled 
              ? "border-2 border-red-500 focus-visible:ring-red-500" 
              : "border-0 focus-visible:ring-primary"
          }`}
        />
      </div>
      
      {/* Dropdown */}
      {isOpen && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto z-50">
          {filteredSchools.map((school) => (
            <button
              key={school.id}
              onClick={() => handleSelectSchool(school)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
            >
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {school.type} {school.name}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {school.neighborhood}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
