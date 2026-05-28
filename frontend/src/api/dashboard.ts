import client from './client'
import type { DashboardStats, RankingComercial, Cotizacion, CRMRecord } from '../types'

interface DashboardParams {
  comercialId?: string
  mes?: string
  tipo?: string
}

export const getDashboard = (params?: DashboardParams) =>
  client.get<DashboardStats>('/api/dashboard', { params }).then((r) => r.data)

export const getRanking = () =>
  client.get<RankingComercial[]>('/api/dashboard/ranking').then((r) => r.data)

export const getRecientes = () =>
  client.get<{ records: CRMRecord[]; cotizaciones: Cotizacion[] }>('/api/dashboard/recientes').then((r) => r.data)
