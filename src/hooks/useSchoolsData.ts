import { useState, useEffect } from "react";
import { School } from "@/types/school";
import { parseCSV } from "@/lib/csvParser";
import { toast } from "sonner";
import { useCampaign } from "./useCampaign";

const GOOGLE_SHEETS_CSV_URL = 
  "https://docs.google.com/spreadsheets/d/1I3W6LJtNyeTfzXdo5gh4xiAy9IuKw-Fyp1luA4e753A/export?format=csv";

export function useSchoolsData() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isActive, config } = useCampaign();
  
  // Log campaign status
  console.log('🎪 Campaign Status:', {
    isActive,
    campaign: config.title,
    period: `${config.startsAt} → ${config.endsAt}`
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(GOOGLE_SHEETS_CSV_URL);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados das escolas');
        }
        
        const csvText = await response.text();
        const parsedSchools = parseCSV(csvText, config.vacancyColumnHeader);
        
        setSchools(parsedSchools);
        
        if (parsedSchools.length === 0) {
          toast.warning('Nenhuma escola encontrada na planilha');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error('Erro ao carregar escolas', {
          description: errorMessage
        });
        console.error('Erro ao buscar dados das escolas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  return { schools, loading, error };
}
