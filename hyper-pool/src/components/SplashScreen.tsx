'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { TOKEN_LOGOS } from '@/lib/constants/tokens';

// Floating icons data
const floatingIcons = [
  { id: 'hype', logo: TOKEN_LOGOS.HYPE, className: 'w-16 h-16 top-[10%] right-[30%]' },
  { id: 'usdc', logo: TOKEN_LOGOS.USDC, className: 'w-20 h-20 top-[60%] left-[15%]' },
  { id: 'sol', logo: TOKEN_LOGOS.SOL, className: 'w-14 h-14 top-[75%] right-[20%]' },
  { id: 'usdt', logo: TOKEN_LOGOS.USDT, className: 'w-12 h-12 top-[15%] left-[20%]' },
];

const splashVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.5,
      when: "afterChildren",
    },
  },
};

const iconVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8
    }
  },
  hidden: { opacity: 0, scale: 0 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.8,
      duration: 0.8,
      staggerChildren: 0.3,
    },
  },
};

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      variants={splashVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onAnimationComplete={() => {
        // Small delay for user to see the final state
        setTimeout(onAnimationComplete, 800);
      }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(140, 255, 0, 0.15) 1px, transparent 0)',
          backgroundSize: '2rem 2rem'
        }}
      />

      {/* Floating Icons */}
      {floatingIcons.map((icon) => (
        <motion.div
          key={icon.id}
          variants={iconVariants}
          className={`absolute ${icon.className} rounded-full overflow-hidden`}
        >
          <Image
            src={icon.logo}
            alt={icon.id}
            width={80}
            height={80}
            className="w-full h-full object-contain"
          />
        </motion.div>
      ))}

      {/* Main Content */}
      <motion.div
        variants={contentVariants}
        className="z-10 flex flex-col items-center text-center px-4"
      >
        {/* Logo */}
        <motion.div
          variants={contentVariants}
          className="mb-6"
        >
          <Image
            src="/assets/images/logoHyperPool.svg"
            alt="HyperPool Logo"
            width={200}
            height={60}
            className="w-auto h-16"
            priority
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-lg text-gray-400 max-w-sm"
          variants={contentVariants}
        >
          Start investing without choosing tokens,
          <br />
          we take care of that for you.
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mt-8"
          variants={contentVariants}
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#8CFF00] rounded-full"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;