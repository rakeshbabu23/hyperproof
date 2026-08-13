import { Heading, Text, Button, Flex } from '@radix-ui/themes';
import { Link, useParams } from 'react-router-dom';

/** Placeholder until the risk detail page is implemented. */
export function RiskDetailPage() {
  const { id } = useParams();

  return (
    <Flex direction="column" gap="3">
      <Heading size="6">Risk Detail</Heading>
      <Text color="gray">Detail view for risk #{id} coming next.</Text>
      <Button variant="soft" asChild style={{ width: 'fit-content' }}>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </Flex>
  );
}
