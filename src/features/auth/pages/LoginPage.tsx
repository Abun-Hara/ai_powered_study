import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { LoginValues, loginSchema } from '../schema';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'student@example.com', password: '', rememberMe: true },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.email, values.password, Boolean(values.rememberMe));
      toast.success('Signed in successfully');
      navigate(values.email.includes('admin') ? '/admin' : '/dashboard');
    } catch {
      toast.error('Login failed, please try again');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage courses, notes, and your AI study plan.">
      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <label>
          Email
          <Input type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        </label>

        <label>
          Password
          <div className="password-row">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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

        <label className="row checkbox-row">
          <input type="checkbox" {...register('rememberMe')} />
          <span>Remember me</span>
        </label>

        <Button type="submit" disabled={isSubmitting}>
          <span className="icon-label">
            <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
            {isSubmitting ? 'Signing in...' : 'Login'}
          </span>
        </Button>

        <Button type="button" variant="secondary" onClick={() => toast('Google OAuth will be connected in backend phase')}>
          <span className="icon-label">
            <i className="fa-brands fa-google" aria-hidden="true" />
            Continue with Google
          </span>
        </Button>

        <p className="muted">
          New user? <Link to="/register">Create account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
