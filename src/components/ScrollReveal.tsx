import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  yOffset?: number;
}

/**
 * Componente de reveal baseado em Framer Motion (motion/react).
 * Aplica fade-in suave e leve deslocamento vertical (compositor GPU: opacity + transform)
 * conforme os blocos entram no viewport do usuário, respeitando prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
  yOffset = 22,
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.6,
        delay: delayMs / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
