import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export default function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('card', className)} {...props} />;
}

