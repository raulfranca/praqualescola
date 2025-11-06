export interface School {
  id: number;
  type: string;
  name: string;
  address: string;
  neighborhood: string;
  sector: string;
  lat?: number;
  lng?: number;
  phone?: string;
}

export interface FavoriteSchool {
  schoolId: number;
  order: number;
}
