import { cn } from '../../utils/cn';

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

