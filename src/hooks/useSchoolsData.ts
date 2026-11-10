import { useState, useEffect } from "react";
import { School } from "@/types/school";
import { buscarDadosEscolas, montarEscolas } from "@/lib/escolasSupabase";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export function useSchoolsData() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);

        const { escolas, turmas } = await buscarDadosEscolas(SUPABASE_URL, SUPABASE_KEY);
        const parsedSchools = montarEscolas(escolas, turmas);

        setSchools(parsedSchools);

        if (parsedSchools.length === 0) {
          toast.warning('Nenhuma escola encontrada');
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
