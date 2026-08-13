import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  Heading,
  Select,
  Table,
  Text,
  Spinner,
  Callout,
} from '@radix-ui/themes';
import { ApiError, getRisks } from '../api';
import { ScoreSeverity } from '../components/ScoreSeverity';
import {
  RISK_CATEGORIES,
  RISK_STATUSES,
  type Risk,
  type RiskCategory,
  type RiskStatus,
} from '../types';

type CategoryFilter = 'All' | RiskCategory;
type StatusFilter = 'All' | RiskStatus;

export function RiskDashboard() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRisks() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRisks({
          category: category === 'All' ? undefined : category,
          status: status === 'All' ? undefined : status,
        });
        if (!cancelled) {
          setRisks(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load risks. Is the backend running?',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRisks();
    return () => {
      cancelled = true;
    };
  }, [category, status]);

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <div>
          <Heading size="7">Risk Dashboard</Heading>
          <Text as="p" color="gray" size="2" mt="1">
            Sorted by residual score (highest first)
          </Text>
        </div>
        <Button size="3" asChild>
          <Link to="/risks/new">Create Risk</Link>
        </Button>
      </Flex>

      <Flex gap="3" wrap="wrap" align="end">
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="category-filter">
            Category
          </Text>
          <Select.Root
            value={category}
            onValueChange={(value) => setCategory(value as CategoryFilter)}
          >
            <Select.Trigger id="category-filter" placeholder="Category" />
            <Select.Content>
              <Select.Item value="All">All</Select.Item>
              {RISK_CATEGORIES.map((item) => (
                <Select.Item key={item} value={item}>
                  {item}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="status-filter">
            Status
          </Text>
          <Select.Root
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <Select.Trigger id="status-filter" placeholder="Status" />
            <Select.Content>
              <Select.Item value="All">All</Select.Item>
              {RISK_STATUSES.map((item) => (
                <Select.Item key={item} value={item}>
                  {item}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {error && (
        <Callout.Root color="red">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {loading ? (
        <Flex align="center" gap="2" py="6">
          <Spinner />
          <Text color="gray">Loading risks…</Text>
        </Flex>
      ) : risks.length === 0 ? (
        <Text color="gray">
          No risks found. Create a risk to get started.
        </Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Inherent</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Residual</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">
                Mitigations
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {risks.map((risk) => (
              <Table.Row
                key={risk.id}
                className={
                  risk.residualSeverity === 'Critical'
                    ? 'risk-row risk-row--critical'
                    : risk.residualSeverity === 'High'
                      ? 'risk-row risk-row--high'
                      : 'risk-row'
                }
                onClick={() => navigate(`/risks/${risk.id}`)}
              >
                <Table.Cell>
                  <Text weight="medium">{risk.title}</Text>
                </Table.Cell>
                <Table.Cell>{risk.category}</Table.Cell>
                <Table.Cell>{risk.status}</Table.Cell>
                <Table.Cell>
                  <ScoreSeverity
                    score={risk.inherentScore}
                    severity={risk.inherentSeverity}
                  />
                </Table.Cell>
                <Table.Cell>
                  <ScoreSeverity
                    score={risk.residualScore}
                    severity={risk.residualSeverity}
                  />
                </Table.Cell>
                <Table.Cell align="right">{risk.mitigationCount}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Flex>
  );
}
