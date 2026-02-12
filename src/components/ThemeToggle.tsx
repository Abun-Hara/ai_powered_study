import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <button className="btn btn-secondary" onClick={toggleMode}>
      {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
}

