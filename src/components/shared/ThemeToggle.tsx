import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return (
    <Button variant="secondary" onClick={toggleMode}>
      <span className="icon-label">
        <i className={mode === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} aria-hidden="true" />
        {mode === 'dark' ? 'Light' : 'Dark'}
      </span>
    </Button>
  );
}
