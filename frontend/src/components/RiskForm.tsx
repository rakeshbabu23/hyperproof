import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Callout,
  Flex,
  Select,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { ApiError } from '../api';
import {
  calculateInherentRisk,
  getSeverityBand,
} from '../utils/riskCalculations';
import {
  RISK_CATEGORIES,
  RISK_STATUSES,
  type RiskCategory,
  type RiskInput,
  type RiskStatus,
  type Severity,
} from '../types';
import { EMPTY_RISK_FORM } from '../constants/riskForm';

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

const SEVERITY_COLOR: Record<Severity, 'green' | 'yellow' | 'orange' | 'red'> = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
};

interface RiskFormProps {
  initialValues?: RiskInput;
  /** Current mitigation count from the API (used for Closed-status guidance). */
  mitigationCount?: number;
  /** Affects Closed-status guidance copy. */
  mode?: 'create' | 'edit';
  submitLabel: string;
  onSubmit: (data: RiskInput) => Promise<void>;
  onCancel: () => void;
}

function validateLocal(values: RiskInput): string | null {
  if (!values.title.trim()) return 'Title is required';
  if (!values.description.trim()) return 'Description is required';
  if (!values.owner.trim()) return 'Owner is required';
  if (!Number.isInteger(values.likelihood) || values.likelihood < 1 || values.likelihood > 5) {
    return 'Likelihood must be an integer between 1 and 5';
  }
  if (!Number.isInteger(values.impact) || values.impact < 1 || values.impact > 5) {
    return 'Impact must be an integer between 1 and 5';
  }
  return null;
}

export function RiskForm({
  initialValues = EMPTY_RISK_FORM,
  mitigationCount = 0,
  mode = 'edit',
  submitLabel,
  onSubmit,
  onCancel,
}: RiskFormProps) {
  const [values, setValues] = useState<RiskInput>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const inherentScore = calculateInherentRisk(values.likelihood, values.impact);
  const inherentSeverity = getSeverityBand(inherentScore);
  const closedWithoutMitigations =
    values.status === 'Closed' && mitigationCount === 0;

  function updateField<K extends keyof RiskInput>(key: K, value: RiskInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setError(null);
    setFieldErrors([]);

    const localError = validateLocal(values);
    if (localError) {
      setError(localError);
      return;
    }

    const payload: RiskInput = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      owner: values.owner.trim(),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors.map((item) => item.message));
      } else if (err instanceof TypeError) {
        setError('Could not reach the server. Is the backend running?');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4" style={{ maxWidth: 560 }}>
        {error && (
          <Callout.Root color="red">
            <Callout.Text>{error}</Callout.Text>
            {fieldErrors.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {fieldErrors.map((message) => (
                  <li key={message}>
                    <Text size="2">{message}</Text>
                  </li>
                ))}
              </ul>
            )}
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="risk-title">
            Title
          </Text>
          <TextField.Root
            id="risk-title"
            value={values.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Short risk title"
            required
            disabled={submitting}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="risk-description">
            Description
          </Text>
          <TextArea
            id="risk-description"
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Describe the risk"
            rows={4}
            required
            disabled={submitting}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="risk-category">
            Category
          </Text>
          <Select.Root
            value={values.category}
            onValueChange={(value) => updateField('category', value as RiskCategory)}
            disabled={submitting}
          >
            <Select.Trigger id="risk-category" />
            <Select.Content>
              {RISK_CATEGORIES.map((category) => (
                <Select.Item key={category} value={category}>
                  {category}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="risk-owner">
            Owner
          </Text>
          <TextField.Root
            id="risk-owner"
            value={values.owner}
            onChange={(event) => updateField('owner', event.target.value)}
            placeholder="Risk owner"
            required
            disabled={submitting}
          />
        </Flex>

        <Flex gap="3" wrap="wrap">
          <Flex direction="column" gap="1" style={{ minWidth: 140 }}>
            <Text as="label" size="2" weight="medium" htmlFor="risk-likelihood">
              Likelihood
            </Text>
            <Select.Root
              value={String(values.likelihood)}
              onValueChange={(value) => updateField('likelihood', Number(value))}
              disabled={submitting}
            >
              <Select.Trigger id="risk-likelihood" />
              <Select.Content>
                {SCORE_OPTIONS.map((score) => (
                  <Select.Item key={score} value={String(score)}>
                    {score}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="1" style={{ minWidth: 140 }}>
            <Text as="label" size="2" weight="medium" htmlFor="risk-impact">
              Impact
            </Text>
            <Select.Root
              value={String(values.impact)}
              onValueChange={(value) => updateField('impact', Number(value))}
              disabled={submitting}
            >
              <Select.Trigger id="risk-impact" />
              <Select.Content>
                {SCORE_OPTIONS.map((score) => (
                  <Select.Item key={score} value={String(score)}>
                    {score}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="1" style={{ minWidth: 140 }}>
            <Text as="label" size="2" weight="medium" htmlFor="risk-status">
              Status
            </Text>
            <Select.Root
              value={values.status}
              onValueChange={(value) => updateField('status', value as RiskStatus)}
              disabled={submitting}
            >
              <Select.Trigger id="risk-status" />
              <Select.Content>
                {RISK_STATUSES.map((status) => (
                  <Select.Item key={status} value={status}>
                    {status}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        {closedWithoutMitigations && (
          <Callout.Root color="amber">
            <Callout.Text>
              {mode === 'create'
                ? 'A risk cannot be created as Closed with zero mitigations. Create it as Open or Mitigating, add a mitigation, then mark it Closed.'
                : 'A risk cannot be marked Closed with zero mitigations. Add at least one mitigation first, then set the status to Closed.'}
            </Callout.Text>
          </Callout.Root>
        )}

        <div className="inherent-preview">
          <Text size="2" color="gray" weight="medium">
            Inherent risk (preview)
          </Text>
          <Flex align="center" gap="3" mt="2" wrap="wrap">
            <Text size="3">
              Inherent Risk: <strong>{inherentScore}</strong>
            </Text>
            <Flex align="center" gap="2">
              <Text size="3">Severity:</Text>
              <Badge color={SEVERITY_COLOR[inherentSeverity]} variant="soft">
                {inherentSeverity}
              </Badge>
            </Flex>
          </Flex>
          <Text size="1" color="gray" mt="2">
            Preview only — scores are recalculated by the backend.
          </Text>
        </div>

        <Flex gap="3">
          <Button type="submit" loading={submitting} disabled={submitting}>
            {submitLabel}
          </Button>
          <Button type="button" variant="soft" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
