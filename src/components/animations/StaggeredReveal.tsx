import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggeredRevealProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggeredReveal({ 
  children, 
  staggerDelay = 0.1,
  className = ''
}: StaggeredRevealProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {children.map((child, index) => (
        <motion.div 
          key={index} 
          variants={item}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}