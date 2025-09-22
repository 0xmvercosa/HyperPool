'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import MainApp from '@/components/MainApp';
import { NetworkDebug } from "@/components/wallet/NetworkDebug";
import { Toaster } from 'react-hot-toast';

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure minimum splash time in case animations load too quickly
    const minSplashTime = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(minSplashTime);
  }, []);

  const handleAnimationComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <SplashScreen key="splash" onAnimationComplete={handleAnimationComplete} />
        ) : (
          <MainApp key="main-app">
            <main className="min-h-screen pb-20">
              {children}
            </main>
          </MainApp>
        )}
      </AnimatePresence>
      {!isLoading && (
        <>
          <NetworkDebug />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
              },
            }}
          />
        </>
      )}
    </>
  );
};

export default AppWrapper;