import { Flex, Heading, Button } from '@radix-ui/themes';
import { Link, useNavigate } from 'react-router-dom';
import { RiskForm } from '../components/RiskForm';
import { EMPTY_RISK_FORM } from '../constants/riskForm';
import { createRisk } from '../api';
import type { RiskInput } from '../types';

export function CreateRiskPage() {
  const navigate = useNavigate();

  async function handleSubmit(data: RiskInput) {
    const risk = await createRisk(data);
    navigate(`/risks/${risk.id}`);
  }

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Heading size="7">Create Risk</Heading>
        <Button variant="soft" asChild>
          <Link to="/">Back to dashboard</Link>
        </Button>
      </Flex>

      <RiskForm
        mode="create"
        initialValues={EMPTY_RISK_FORM}
        submitLabel="Create Risk"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </Flex>
  );
}
