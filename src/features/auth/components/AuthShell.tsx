import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import PublicFooter from '../../../components/shared/PublicFooter';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-root">
      <div className="auth-shell-wrap">
        <motion.section
          className="auth-card-modern card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="icon-heading"><i className="fa-solid fa-graduation-cap" aria-hidden="true" /> {title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </motion.section>
        <PublicFooter />
      </div>
    </div>
  );
}
