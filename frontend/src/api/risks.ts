import { apiClient } from './client';
import type {
  DeleteRiskResult,
  Risk,
  RiskFilters,
  RiskInput,
} from '../types';

function buildRiskQuery(filters: RiskFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getRisks(filters: RiskFilters = {}): Promise<Risk[]> {
  return apiClient.get<Risk[]>(`/risks${buildRiskQuery(filters)}`);
}

export function getRisk(id: number): Promise<Risk> {
  return apiClient.get<Risk>(`/risks/${id}`);
}

export function createRisk(data: RiskInput): Promise<Risk> {
  return apiClient.post<Risk>('/risks', data);
}

export function updateRisk(id: number, data: RiskInput): Promise<Risk> {
  return apiClient.put<Risk>(`/risks/${id}`, data);
}

export function deleteRisk(id: number): Promise<DeleteRiskResult> {
  return apiClient.delete<DeleteRiskResult>(`/risks/${id}`);
}
