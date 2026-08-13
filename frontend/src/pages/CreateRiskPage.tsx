import { Heading, Text, Button, Flex } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

/** Placeholder until the create-risk form is implemented. */
export function CreateRiskPage() {
  return (
    <Flex direction="column" gap="3">
      <Heading size="6">Create Risk</Heading>
      <Text color="gray">Risk creation form coming next.</Text>
      <Button variant="soft" asChild style={{ width: 'fit-content' }}>
        <Link to="/">Back to dashboard</Link>
      </Button>
    </Flex>
  );
}
