export interface School {
  id: string;
  type: string;
  name: string;
  address: string;
  cep: string;
  phone: string;
  extension?: string;
  neighborhood: string;
  lat: number;
  lng: number;
  sector: string;
  polo: string;
  outsourced?: string;
  bercario?: number;
  infantil1?: number;
  infantil2?: number;
  pre1?: number;
  pre2?: number;
  ano1?: number;
  ano2?: number;
  ano3?: number;
  ano4?: number;
  ano5?: number;
  vacancies?: number;
  durationInMinutes?: number;
  /** Escola em funcionamento no cadastro da SME (o CAIC está inativo). */
  active?: boolean;
  /** Observação do cadastro da SME. */
  note?: string;
  /** Códigos INEP dos prédios onde funcionam turmas desta escola, além do próprio. */
  hostedAt?: string[];
}
