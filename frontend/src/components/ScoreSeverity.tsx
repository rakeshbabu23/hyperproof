import { Badge } from '@radix-ui/themes';
import type { Severity } from '../types';

const SEVERITY_COLOR: Record<Severity, 'green' | 'yellow' | 'orange' | 'red'> = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
};

interface ScoreSeverityProps {
  score: number;
  severity: Severity;
}

export function ScoreSeverity({ score, severity }: ScoreSeverityProps) {
  return (
    <span className="score-severity">
      <strong>{score}</strong>
      <Badge color={SEVERITY_COLOR[severity]} variant="soft" size="1">
        {severity}
      </Badge>
    </span>
  );
}
