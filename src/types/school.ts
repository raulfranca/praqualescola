export interface School {
  id: number;
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
}

export interface FavoriteSchool {
  schoolId: number;
  order: number;
}
