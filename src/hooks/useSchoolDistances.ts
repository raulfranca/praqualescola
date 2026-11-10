import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { escolasSemDistancia, sortSchoolsByDistance } from "@/lib/distanceCalculator";
import { estimativaAproximada } from "@/lib/cota";
import { registrarEnderecoNovo } from "@/lib/utils";

const DISTANCES_STORAGE_KEY = "school-distances";
/** Marca, nesta sessão do navegador, que já se pediu de novo a distância real das aproximadas. */
const REPEDIDO_KEY = "distancias-reais-repedidas";

export interface DistanciaEscola {
  distanceInKm: number;
  durationInMinutes?: number;
  /** Estimativa em linha reta (sem o Google). */
  aproximado?: boolean;
}

interface SchoolDistances {
  [schoolId: string]: DistanciaEscola;
}

export interface SchoolWithDistance extends School {
  distanceInKm?: number;
  durationInMinutes?: number;
  aproximado?: boolean;
}

/** Distância já salva no aparelho para uma escola (endereço de casa atual). Não chama nada. */
export function distanciaSalva(schoolId: string): DistanciaEscola | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(DISTANCES_STORAGE_KEY) ?? "{}");
    return salvo[schoolId] ?? null;
  } catch {
    return null;
  }
}

/**
 * Generates a cache key based on location coordinates
 */
function getCacheKey(lat: number, lng: number): string {
  // Round to 5 decimal places (~1m precision) to avoid floating point issues
  const roundedLat = Math.round(lat * 100000) / 100000;
  const roundedLng = Math.round(lng * 100000) / 100000;
  return `cachedDistances_${roundedLat}_${roundedLng}`;
}

/**
 * Pede as distâncias à função do servidor (`api/distancias`), que decide entre o cache
 * compartilhado, o Google e a estimativa. Função fora do ar ou resposta inválida: estimativa
 * local para todas as escolas pedidas.
 */
async function pedirDistancias(
  location: HomeLocation,
  escolas: School[]
): Promise<SchoolDistances> {
  let recebidas: SchoolDistances = {};
  try {
    const res = await fetch("/api/distancias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: location.lat, lng: location.lng }),
    });
    const corpo = res.ok ? await res.json() : null;
    if (corpo && typeof corpo.distancias === "object" && corpo.distancias) recebidas = corpo.distancias;
  } catch (error) {
    console.warn("Função de distâncias indisponível, usando estimativa:", error);
  }

  const resultado: SchoolDistances = {};
  for (const escola of escolas) {
    const d = recebidas[escola.id];
    resultado[escola.id] =
      d && Number.isFinite(d.distanceInKm)
        ? { distanceInKm: d.distanceInKm, durationInMinutes: d.durationInMinutes, aproximado: !!d.aproximado }
        : estimativaAproximada(location, escola);
  }
  return resultado;
}

const temAproximada = (dados: SchoolDistances) => Object.values(dados).some((d) => d.aproximado);

/**
 * Hook to manage distance calculations between home location and schools
 * Provides manual calculation function with caching to control API costs
 */
export function useSchoolDistances(
  schools: School[],
  homeLocation: HomeLocation | null
) {
  const [distances, setDistances] = useState<SchoolDistances>(() => {
    // Load from localStorage on mount if we have a home location
    const stored = localStorage.getItem(DISTANCES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });
  const [isCalculating, setIsCalculating] = useState(false);
  // Conjuntos de escolas faltantes já tentados nesta montagem (evita repetir chamadas à API)
  const tentativasRef = useRef(new Set<string>());

  /**
   * Calcula só as escolas que faltam em `base` e devolve o cache completo (ou `base`, se nada mudou).
   * Não grava nada: quem chama decide.
   */
  const completarDistancias = useCallback(async (
    location: HomeLocation,
    base: SchoolDistances
  ): Promise<SchoolDistances> => {
    const faltando = escolasSemDistancia(schools, base);
    if (faltando.length === 0) return base;
    const tentativa = `${getCacheKey(location.lat, location.lng)}:${faltando.map((s) => s.id).join(",")}`;
    if (tentativasRef.current.has(tentativa)) return base;
    tentativasRef.current.add(tentativa);

    return { ...base, ...(await pedirDistancias(location, faltando)) };
  }, [schools]);

  const gravarDistancias = useCallback((location: HomeLocation, dados: SchoolDistances) => {
    localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(dados));
    localStorage.setItem(getCacheKey(location.lat, location.lng), JSON.stringify(dados));
  }, []);

  // Escola carregada sem distância (ex.: cadastrada depois do cálculo): calcula só ela e junta ao cache.
  useEffect(() => {
    if (!homeLocation || schools.length === 0 || Object.keys(distances).length === 0) return;
    let cancelado = false;
    completarDistancias(homeLocation, distances).then((completo) => {
      if (cancelado || completo === distances) return;
      gravarDistancias(homeLocation, completo);
      setDistances(completo);
    });
    return () => {
      cancelado = true;
    };
  }, [homeLocation, schools, distances, completarDistancias, gravarDistancias]);

  // Distâncias aproximadas salvas: pede as reais de novo, no máximo uma vez por sessão.
  useEffect(() => {
    if (!homeLocation || schools.length === 0 || !temAproximada(distances)) return;
    if (sessionStorage.getItem(REPEDIDO_KEY)) return;
    sessionStorage.setItem(REPEDIDO_KEY, "1");
    const aproximadas = schools.filter((s) => distances[s.id]?.aproximado);
    pedirDistancias(homeLocation, aproximadas).then((novas) => {
      const reais = Object.entries(novas).filter(([, d]) => !d.aproximado);
      if (reais.length === 0) return;
      setDistances((atuais) => {
        const juntas = { ...atuais, ...Object.fromEntries(reais) };
        gravarDistancias(homeLocation, juntas);
        return juntas;
      });
    });
  }, [homeLocation, schools, distances, gravarDistancias]);

  /**
   * Check if we have cached distances for a given location
   */
  const hasCachedDistances = useCallback((location: HomeLocation): boolean => {
    const cacheKey = getCacheKey(location.lat, location.lng);
    return localStorage.getItem(cacheKey) !== null;
  }, []);

  /**
   * Clear all distance data when home location is removed
   */
  const clearDistances = useCallback(() => {
    setDistances({});
    localStorage.removeItem(DISTANCES_STORAGE_KEY);
  }, []);

  /**
   * Calcula e guarda as distâncias de um endereço. Nunca falha: sem a função, usa a estimativa.
   * Devolve se o resultado tem distâncias aproximadas.
   */
  const calculateAndCacheDistances = useCallback(async (
    location: HomeLocation
  ): Promise<{ aproximado: boolean }> => {
    const cacheKey = getCacheKey(location.lat, location.lng);

    // Endereço já calculado neste aparelho: não conta no limite do dia.
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const cached = await completarDistancias(location, JSON.parse(cachedData) as SchoolDistances);
      setDistances(cached);
      gravarDistancias(location, cached);
      return { aproximado: temAproximada(cached) };
    }

    registrarEnderecoNovo();
    setIsCalculating(true);
    const novas = await pedirDistancias(location, schools);
    setDistances(novas);
    gravarDistancias(location, novas);
    setIsCalculating(false);
    return { aproximado: temAproximada(novas) };
  }, [schools, completarDistancias, gravarDistancias]);

  // Enrich schools with distance and duration data
  const schoolsWithDistances: SchoolWithDistance[] = useMemo(() => {
    return schools.map((school) => ({
      ...school,
      distanceInKm: distances[school.id]?.distanceInKm,
      durationInMinutes: distances[school.id]?.durationInMinutes,
      aproximado: distances[school.id]?.aproximado,
    }));
  }, [schools, distances]);

  // Sorted schools (closest first)
  const sortedSchools = useMemo(() => {
    if (!homeLocation) return schoolsWithDistances;
    return sortSchoolsByDistance(schoolsWithDistances);
  }, [schoolsWithDistances, homeLocation]);

  return {
    schoolsWithDistances,
    sortedSchools,
    hasDistances: Object.keys(distances).length > 0,
    distanciasAproximadas: temAproximada(distances),
    isCalculating,
    calculateAndCacheDistances,
    hasCachedDistances,
    clearDistances,
  };
}
