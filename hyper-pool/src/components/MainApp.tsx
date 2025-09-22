'use client';

import { motion } from 'framer-motion';
import { BottomNav } from '@/components/layout/BottomNav';

interface MainAppProps {
  children: React.ReactNode;
}

const MainApp = ({ children }: MainAppProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black"
    >
      {children}
      <BottomNav />
    </motion.div>
  );
};

export default MainApp;