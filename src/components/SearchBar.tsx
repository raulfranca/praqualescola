import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SeloDesativado } from "@/components/SeloDesativado";
import { PainelAdmin } from "@/components/PainelAdmin";
import { School } from "@/types/school";
import { useState, useRef, useEffect, useCallback } from "react";
import { removeAccents } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  schools: School[];
  onSelectSchool: (school: School) => void;
  showDropdown?: boolean;
}

export function SearchBar({ value, onChange, schools, onSelectSchool, showDropdown = true }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminAberto, setAdminAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ehComandoAdmin = value.trim().toLowerCase() === "/admin";

  // "/admin" + Enter abre o painel do administrador (pede senha)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && ehComandoAdmin) {
      e.preventDefault();
      onChange("");
      setAdminAberto(true);
    }
  }, [ehComandoAdmin, onChange]);

  // Filter schools based on search query (hide suggestions for /admin command)
  const filteredSchools = value.trim() && !ehComandoAdmin
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
      <div className="relative" data-tour="busca">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 text-muted-foreground`} strokeWidth={1.75} />
        <Input
          ref={inputRef}
          // Busca, não formulário: reduz a barra de senha/cartão/endereço do teclado do Android
          type="search"
          inputMode="search"
          enterKeyHint="search"
          id="busca-escola"
          name="busca-escola"
          placeholder="Buscar escola por nome, endereço ou bairro..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          // Valor não reconhecido: o Chrome ignora "off", mas respeita token desconhecido
          autoComplete="busca-escola"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          className="pl-12 pr-4 h-12 bg-card rounded-full shadow-floating focus-visible:ring-2 text-foreground border-0 focus-visible:ring-primary [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>
      
      {/* Dropdown */}
      {isOpen && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-floating max-h-[60vh] overflow-y-auto z-50">
          {filteredSchools.map((school) => (
            <button
              key={school.id}
              onClick={() => handleSelectSchool(school)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 min-h-11 hover:bg-muted transition-colors text-left"
            >
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {school.type} {school.name}
              </span>
              {school.active === false && <SeloDesativado />}
              <Badge variant="outline" className="text-xs shrink-0">
                {school.neighborhood}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <PainelAdmin aberto={adminAberto} onFechar={() => setAdminAberto(false)} />
    </div>
  );
}
