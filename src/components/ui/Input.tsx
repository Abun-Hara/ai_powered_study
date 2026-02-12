import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <div className="stack-xs">
      <input ref={ref} className={cn('input', error ? 'input-error' : '', className)} {...props} />
      {error ? <p className="text-error">{error}</p> : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

