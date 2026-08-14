import type { RiskInput } from '../types';

export const EMPTY_RISK_FORM: RiskInput = {
  title: '',
  description: '',
  category: 'Operational',
  owner: '',
  likelihood: 3,
  impact: 3,
  status: 'Open',
};
