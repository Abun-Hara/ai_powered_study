import Button from './Button';
import Card from './Card';

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="stack">
      <h3>Request failed</h3>
      <p className="muted">{message}</p>
      {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
    </Card>
  );
}

