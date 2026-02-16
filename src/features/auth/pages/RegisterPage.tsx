import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { RegisterValues, registerSchema } from '../schema';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await signUp(values.name, values.email, values.password);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start building your AI-powered study workflow.">
      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Full Name
          <Input placeholder="Your name" error={errors.name?.message} {...register('name')} />
        </label>
        <label>
          Email
          <Input type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        </label>
        <label>
          Password
          <div className="password-row">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="button" variant="secondary" onClick={() => setShowPassword((prev) => !prev)}>
              <span className="icon-label">
                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} aria-hidden="true" />
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </Button>
          </div>
        </label>
        <label>
          Confirm Password
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </label>

        <Button type="submit" disabled={isSubmitting}>
          <span className="icon-label">
            <i className="fa-solid fa-user-plus" aria-hidden="true" />
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </span>
        </Button>

        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
