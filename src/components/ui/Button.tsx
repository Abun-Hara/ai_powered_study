import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={cn('btn', `btn-${variant}`, className)} {...props} />;
}

