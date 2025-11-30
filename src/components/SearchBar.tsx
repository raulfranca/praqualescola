import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School } from "@/types/school";
import { useState, useRef, useEffect } from "react";
import { removeAccents } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  schools: School[];
  onSelectSchool: (school: School) => void;
}

export function SearchBar({ value, onChange, schools, onSelectSchool }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter schools based on search query
  const filteredSchools = value.trim()
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder="Buscar escola por nome, endereço ou bairro..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-12 pr-4 h-12 bg-white border-0 rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-primary text-foreground"
        />
      </div>
      
      {/* Dropdown */}
      {isOpen && (
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
