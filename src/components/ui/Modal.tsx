import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal card"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row-between">
          <h3>{title}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

