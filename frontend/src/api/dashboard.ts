import api from './client'
import type { DashboardStats, DashboardCharts } from '../types'

export interface DashboardFilters {
  comercial_id?: string
  mes?: string
  tipo?: string
}

export async function getDashboardStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/dashboard/stats', { params: filters })
  return data
}

export async function getDashboardCharts(filters: DashboardFilters = {}): Promise<DashboardCharts> {
  const { data } = await api.get<DashboardCharts>('/api/dashboard/charts', { params: filters })
  return data
}
