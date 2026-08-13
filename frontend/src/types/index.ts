export type RiskCategory =
  | 'Operational'
  | 'Financial'
  | 'Compliance'
  | 'Security'
  | 'Strategic';

export type RiskStatus = 'Open' | 'Mitigating' | 'Closed';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export const RISK_CATEGORIES: RiskCategory[] = [
  'Operational',
  'Financial',
  'Compliance',
  'Security',
  'Strategic',
];

export const RISK_STATUSES: RiskStatus[] = ['Open', 'Mitigating', 'Closed'];

export interface Mitigation {
  id: number;
  riskId: number;
  description: string;
  effectiveness: number;
  createdAt: string;
}

export interface Risk {
  id: number;
  title: string;
  description: string;
  category: RiskCategory;
  owner: string;
  likelihood: number;
  impact: number;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
  inherentScore: number;
  inherentSeverity: Severity;
  residualScore: number;
  residualSeverity: Severity;
  mitigationCount: number;
}

/** Fields required to create or fully update a risk. */
export interface RiskInput {
  title: string;
  description: string;
  category: RiskCategory;
  owner: string;
  likelihood: number;
  impact: number;
  status: RiskStatus;
}

export interface MitigationInput {
  description: string;
  effectiveness: number;
}

export interface RiskFilters {
  category?: RiskCategory;
  status?: RiskStatus;
}

export interface MitigationMutationResult {
  mitigation: Mitigation;
  risk: Risk;
}

export interface DeleteRiskResult {
  id: number;
  deleted: true;
}

export interface DeleteMitigationResult {
  id: number;
  deleted: true;
  risk: Risk;
}

export interface ApiFieldError {
  field: string;
  message: string;
}
