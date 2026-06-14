import { api } from './api'

export interface DashboardKPIs {
  ventasHoy: number;
  ordenesHoy: number;
  clientesEstimados: number;
  mesasActivas: number;
  ocupacionPorcentaje: number;
}

export interface PlatoPopular {
  nombre: string;
  cantidad: number;
  imagen?: string;
}

export interface CategoriaPopular {
  nombre: string;
  pedidos: number;
  porcentaje: number;
}

export interface OrdenReciente {
  id: string;
  mesa: string;
  hora: string;
  estado: string;
  total: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  platosMasVendidos: PlatoPopular[];
  categoriasPopulares: CategoriaPopular[];
  ordenesRecientes: OrdenReciente[];
}

export const dashboardService = {
  // Asegúrate de que esta ruta coincida con la que tienes en tu router de Express (ej. /api/dashboard/resumen)
  getResumen: async (): Promise<DashboardData> => {
    return api.get<DashboardData>('/dashboard/resumen')
  }
}