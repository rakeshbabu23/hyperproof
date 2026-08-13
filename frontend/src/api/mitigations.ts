import { apiClient } from './client';
import type {
  DeleteMitigationResult,
  MitigationInput,
  MitigationMutationResult,
} from '../types';

export function createMitigation(
  riskId: number,
  data: MitigationInput,
): Promise<MitigationMutationResult> {
  return apiClient.post<MitigationMutationResult>(
    `/risks/${riskId}/mitigations`,
    data,
  );
}

export function updateMitigation(
  id: number,
  data: MitigationInput,
): Promise<MitigationMutationResult> {
  return apiClient.put<MitigationMutationResult>(`/mitigations/${id}`, data);
}

export function deleteMitigation(id: number): Promise<DeleteMitigationResult> {
  return apiClient.delete<DeleteMitigationResult>(`/mitigations/${id}`);
}
