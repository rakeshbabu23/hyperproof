import { useEffect, useState } from 'react';
import { Flex, Heading, Button, Text, Spinner, Callout } from '@radix-ui/themes';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RiskForm } from '../components/RiskForm';
import { getRisk, updateRisk } from '../api';
import { getErrorMessage, isNotFoundError } from '../utils/errors';
import type { RiskInput } from '../types';

export function EditRiskPage() {
  const { id } = useParams();
  const riskId = Number(id);
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<RiskInput | null>(null);
  const [mitigationCount, setMitigationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        const risk = await getRisk(riskId);
        if (!cancelled) {
          setInitialValues({
            title: risk.title,
            description: risk.description,
            category: risk.category,
            owner: risk.owner,
            likelihood: risk.likelihood,
            impact: risk.impact,
            status: risk.status,
          });
          setMitigationCount(risk.mitigationCount);
        }
      } catch (err) {
        if (!cancelled) {
          setInitialValues(null);
          if (isNotFoundError(err)) {
            setNotFound(true);
            setError('This risk was not found. It may have been deleted.');
          } else {
            setNotFound(false);
            setError(getErrorMessage(err, 'Failed to load risk for editing.'));
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

  async function handleSubmit(data: RiskInput) {
    await updateRisk(riskId, data);
    navigate(`/risks/${riskId}`);
  }

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Heading size="7">Edit Risk</Heading>
        <Button variant="soft" asChild>
          <Link to={Number.isInteger(riskId) ? `/risks/${riskId}` : '/'}>
            Back
          </Link>
        </Button>
      </Flex>

      {loading && (
        <Flex align="center" gap="2">
          <Spinner />
          <Text color="gray">Loading risk…</Text>
        </Flex>
      )}

      {!loading && notFound && (
        <Flex direction="column" gap="3">
          <Callout.Root color="amber">
            <Callout.Text>
              {error ?? 'This risk was not found. It may have been deleted.'}
            </Callout.Text>
          </Callout.Root>
          <Button variant="soft" asChild style={{ width: 'fit-content' }}>
            <Link to="/">Back to dashboard</Link>
          </Button>
        </Flex>
      )}

      {!loading && !notFound && error && (
        <Flex direction="column" gap="3">
          <Callout.Root color="red">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
          <Button
            style={{ width: 'fit-content' }}
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try again
          </Button>
        </Flex>
      )}

      {!loading && !error && initialValues && (
        <RiskForm
          key={riskId}
          mode="edit"
          initialValues={initialValues}
          mitigationCount={mitigationCount}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/risks/${riskId}`)}
        />
      )}
    </Flex>
  );
}
