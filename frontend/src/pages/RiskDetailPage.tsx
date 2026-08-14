import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Callout,
  Flex,
  Heading,
  Select,
  Spinner,
  Text,
  TextArea,
} from '@radix-ui/themes';
import {
  createMitigation,
  deleteMitigation,
  deleteRisk,
  getRisk,
  updateMitigation,
} from '../api';
import { ScoreSeverity } from '../components/ScoreSeverity';
import {
  getErrorMessage,
  getFieldErrorMessages,
  isNotFoundError,
} from '../utils/errors';
import type { Mitigation, MitigationInput, Risk, Severity } from '../types';

const EFFECTIVENESS_OPTIONS = [1, 2, 3, 4, 5] as const;

const SEVERITY_COLOR: Record<Severity, 'green' | 'yellow' | 'orange' | 'red'> = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
};

const EMPTY_MITIGATION_FORM: MitigationInput = {
  description: '',
  effectiveness: 3,
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RiskDetailPage() {
  const { id } = useParams();
  const riskId = Number(id);
  const navigate = useNavigate();

  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFieldErrors, setActionFieldErrors] = useState<string[]>([]);

  const [addForm, setAddForm] = useState<MitigationInput>(EMPTY_MITIGATION_FORM);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MitigationInput>(EMPTY_MITIGATION_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingRisk, setDeletingRisk] = useState(false);

  const mitigationBusy = adding || savingEdit || deletingId !== null;
  const pageBusy = mitigationBusy || deletingRisk;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isInteger(riskId) || riskId <= 0) {
        setNotFound(true);
        setError('That risk id is not valid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await getRisk(riskId);
        if (!cancelled) {
          setRisk(data);
        }
      } catch (err) {
        if (!cancelled) {
          setRisk(null);
          if (isNotFoundError(err)) {
            setNotFound(true);
            setError('This risk was not found. It may have been deleted.');
          } else {
            setNotFound(false);
            setError(getErrorMessage(err, 'Failed to load risk.'));
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [riskId, reloadKey]);

  function setActionFailure(err: unknown, fallback: string) {
    setActionError(getErrorMessage(err, fallback));
    setActionFieldErrors(getFieldErrorMessages(err));
  }

  async function handleAddMitigation(event: FormEvent) {
    event.preventDefault();
    if (pageBusy) {
      return;
    }

    setActionError(null);
    setActionFieldErrors([]);

    if (!addForm.description.trim()) {
      setActionError('Description is required');
      return;
    }

    setAdding(true);
    try {
      const result = await createMitigation(riskId, {
        description: addForm.description.trim(),
        effectiveness: addForm.effectiveness,
      });
      setRisk(result.risk);
      setAddForm(EMPTY_MITIGATION_FORM);
    } catch (err) {
      setActionFailure(err, 'Failed to add mitigation.');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(mitigation: Mitigation) {
    if (pageBusy) {
      return;
    }
    setActionError(null);
    setActionFieldErrors([]);
    setEditingId(mitigation.id);
    setEditForm({
      description: mitigation.description,
      effectiveness: mitigation.effectiveness,
    });
  }

  function cancelEdit() {
    if (savingEdit) {
      return;
    }
    setEditingId(null);
    setEditForm(EMPTY_MITIGATION_FORM);
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (editingId === null || pageBusy) {
      return;
    }

    setActionError(null);
    setActionFieldErrors([]);
    if (!editForm.description.trim()) {
      setActionError('Description is required');
      return;
    }

    setSavingEdit(true);
    try {
      const result = await updateMitigation(editingId, {
        description: editForm.description.trim(),
        effectiveness: editForm.effectiveness,
      });
      setRisk(result.risk);
      setEditingId(null);
      setEditForm(EMPTY_MITIGATION_FORM);
    } catch (err) {
      setActionFailure(err, 'Failed to update mitigation.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(mitigationId: number) {
    if (pageBusy) {
      return;
    }

    setActionError(null);
    setActionFieldErrors([]);
    setDeletingId(mitigationId);
    try {
      const result = await deleteMitigation(mitigationId);
      setRisk(result.risk);
      if (editingId === mitigationId) {
        setEditingId(null);
        setEditForm(EMPTY_MITIGATION_FORM);
      }
    } catch (err) {
      setActionFailure(err, 'Failed to delete mitigation.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteRisk() {
    if (pageBusy || !risk) {
      return;
    }

    const confirmed = window.confirm(
      `Delete risk "${risk.title}"? Its mitigations will also be deleted.`,
    );
    if (!confirmed) {
      return;
    }

    setActionError(null);
    setActionFieldErrors([]);
    setDeletingRisk(true);
    try {
      await deleteRisk(risk.id);
      navigate('/');
    } catch (err) {
      setActionFailure(err, 'Failed to delete risk.');
      setDeletingRisk(false);
    }
  }

  if (loading) {
    return (
      <Flex align="center" gap="2" py="6">
        <Spinner />
        <Text color="gray">Loading risk…</Text>
      </Flex>
    );
  }

  if (notFound) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="6">Risk not found</Heading>
        <Callout.Root color="amber">
          <Callout.Text>
            {error ?? 'This risk was not found. It may have been deleted.'}
          </Callout.Text>
        </Callout.Root>
        <Button variant="soft" asChild style={{ width: 'fit-content' }}>
          <Link to="/">Back to dashboard</Link>
        </Button>
      </Flex>
    );
  }

  if (error || !risk) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="6">Could not load risk</Heading>
        <Callout.Root color="red">
          <Callout.Text>{error ?? 'Something went wrong.'}</Callout.Text>
        </Callout.Root>
        <Flex gap="2">
          <Button onClick={() => setReloadKey((key) => key + 1)}>Try again</Button>
          <Button variant="soft" asChild>
            <Link to="/">Back to dashboard</Link>
          </Button>
        </Flex>
      </Flex>
    );
  }

  const mitigations = risk.mitigations ?? [];

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="start" wrap="wrap" gap="3">
        <div>
          <Heading size="7">{risk.title}</Heading>
          <Text as="p" color="gray" size="2" mt="1">
            {risk.category} · {risk.status} · Owner: {risk.owner}
          </Text>
        </div>
        <Flex gap="2" wrap="wrap">
          <Button asChild disabled={deletingRisk}>
            <Link to={`/risks/${risk.id}/edit`}>Edit Risk</Link>
          </Button>
          <Button
            color="red"
            variant="soft"
            loading={deletingRisk}
            disabled={pageBusy}
            onClick={() => void handleDeleteRisk()}
          >
            Delete Risk
          </Button>
          <Button variant="soft" asChild>
            <Link to="/">Dashboard</Link>
          </Button>
        </Flex>
      </Flex>

      <div className="residual-highlight">
        <Text size="2" weight="medium" color="gray">
          Residual risk
        </Text>
        <Flex align="center" gap="3" mt="2" wrap="wrap">
          <Text size="8" weight="bold">
            {risk.residualScore}
          </Text>
          <Badge
            size="2"
            color={SEVERITY_COLOR[risk.residualSeverity]}
            variant="solid"
          >
            {risk.residualSeverity}
          </Badge>
        </Flex>
        <Text size="2" color="gray" mt="2">
          Risk remaining after current mitigations ({risk.mitigationCount})
        </Text>
      </div>

      <Flex direction="column" gap="3">
        <Heading size="4">Details</Heading>
        <Text as="p">{risk.description}</Text>

        <div className="detail-grid">
          <DetailItem label="Category" value={risk.category} />
          <DetailItem label="Owner" value={risk.owner} />
          <DetailItem label="Status" value={risk.status} />
          <DetailItem label="Likelihood" value={String(risk.likelihood)} />
          <DetailItem label="Impact" value={String(risk.impact)} />
          <DetailItem label="Mitigations" value={String(risk.mitigationCount)} />
          <div>
            <Text size="2" color="gray">
              Inherent
            </Text>
            <div>
              <ScoreSeverity
                score={risk.inherentScore}
                severity={risk.inherentSeverity}
              />
            </div>
          </div>
          <div>
            <Text size="2" color="gray">
              Residual
            </Text>
            <div>
              <ScoreSeverity
                score={risk.residualScore}
                severity={risk.residualSeverity}
              />
            </div>
          </div>
        </div>
      </Flex>

      <Flex direction="column" gap="3">
        <Heading size="4">Mitigations</Heading>

        {actionError && (
          <Callout.Root color="red">
            <Callout.Text>{actionError}</Callout.Text>
            {actionFieldErrors.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {actionFieldErrors.map((message) => (
                  <li key={message}>
                    <Text size="2">{message}</Text>
                  </li>
                ))}
              </ul>
            )}
          </Callout.Root>
        )}

        {mitigations.length === 0 ? (
          <Text color="gray">No mitigations yet. Add one below.</Text>
        ) : (
          <Flex direction="column" gap="3">
            {mitigations.map((mitigation) => (
              <div key={mitigation.id} className="mitigation-card">
                {editingId === mitigation.id ? (
                  <form onSubmit={handleSaveEdit}>
                    <Flex direction="column" gap="3">
                      <TextArea
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        rows={3}
                        required
                        disabled={savingEdit}
                      />
                      <Flex direction="column" gap="1" style={{ maxWidth: 160 }}>
                        <Text as="label" size="2" weight="medium">
                          Effectiveness
                        </Text>
                        <Select.Root
                          value={String(editForm.effectiveness)}
                          onValueChange={(value) =>
                            setEditForm((current) => ({
                              ...current,
                              effectiveness: Number(value),
                            }))
                          }
                          disabled={savingEdit}
                        >
                          <Select.Trigger />
                          <Select.Content>
                            {EFFECTIVENESS_OPTIONS.map((value) => (
                              <Select.Item key={value} value={String(value)}>
                                {value}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Flex>
                      <Flex gap="2">
                        <Button type="submit" loading={savingEdit} disabled={savingEdit}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="soft"
                          onClick={cancelEdit}
                          disabled={savingEdit}
                        >
                          Cancel
                        </Button>
                      </Flex>
                    </Flex>
                  </form>
                ) : (
                  <Flex justify="between" align="start" gap="3" wrap="wrap">
                    <div>
                      <Text as="p" weight="medium">
                        {mitigation.description}
                      </Text>
                      <Text as="p" size="2" color="gray" mt="1">
                        Effectiveness: {mitigation.effectiveness} · Added{' '}
                        {formatDate(mitigation.createdAt)}
                      </Text>
                    </div>
                    <Flex gap="2">
                      <Button
                        size="2"
                        variant="soft"
                        disabled={pageBusy}
                        onClick={() => startEdit(mitigation)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="2"
                        color="red"
                        variant="soft"
                        loading={deletingId === mitigation.id}
                        disabled={pageBusy}
                        onClick={() => void handleDelete(mitigation.id)}
                      >
                        Delete
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </div>
            ))}
          </Flex>
        )}

        <form className="add-mitigation" onSubmit={handleAddMitigation}>
          <Heading size="3" mb="3">
            Add Mitigation
          </Heading>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="mitigation-description">
                Description
              </Text>
              <TextArea
                id="mitigation-description"
                value={addForm.description}
                onChange={(event) =>
                  setAddForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the control or mitigation"
                rows={3}
                required
                disabled={adding}
              />
            </Flex>

            <Flex direction="column" gap="1" style={{ maxWidth: 160 }}>
              <Text as="label" size="2" weight="medium" htmlFor="mitigation-effectiveness">
                Effectiveness
              </Text>
              <Select.Root
                value={String(addForm.effectiveness)}
                onValueChange={(value) =>
                  setAddForm((current) => ({
                    ...current,
                    effectiveness: Number(value),
                  }))
                }
                disabled={adding}
              >
                <Select.Trigger id="mitigation-effectiveness" />
                <Select.Content>
                  {EFFECTIVENESS_OPTIONS.map((value) => (
                    <Select.Item key={value} value={String(value)}>
                      {value}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>

            <Button
              type="submit"
              loading={adding}
              disabled={pageBusy}
              style={{ width: 'fit-content' }}
            >
              Add Mitigation
            </Button>
          </Flex>
        </form>
      </Flex>
    </Flex>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="2" color="gray">
        {label}
      </Text>
      <Text as="p" weight="medium">
        {value}
      </Text>
    </div>
  );
}
