'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TOKEN_LOGOS } from '@/lib/constants/tokens';

interface PoolCardProps {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl?: string;
  volume24h?: string;
  risk: 'low' | 'medium' | 'high';
  tokens: Array<{ symbol: string; icon?: string }>;
  tagline: string;
  index?: number;
  onClick?: () => void;
}

const riskColors = {
  low: 'text-[#8CFF00]',
  medium: 'text-yellow-500',
  high: 'text-orange-500'
};

const riskLabels = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk'
};

export const PoolCard = ({
  id,
  name,
  description,
  apy,
  tvl,
  volume24h,
  risk,
  tokens,
  tagline,
  index = 0,
  onClick
}: PoolCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/earn?pool=${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={handleClick}
      className="bg-zinc-900 rounded-2xl p-5 cursor-pointer hover:bg-zinc-800/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Token Icons */}
        <div className="flex -space-x-2">
          {tokens.map((token, idx) => {
            const logo = TOKEN_LOGOS[token.symbol as keyof typeof TOKEN_LOGOS];
            return (
              <div
                key={idx}
                className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center overflow-hidden"
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {token.symbol.slice(0, 1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Arrow Icon */}
        <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
      </div>

      {/* Pool Name */}
      <h3 className="text-white font-semibold text-lg mb-2">{name}</h3>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {description}
      </p>

      {/* APY and Risk */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[#8CFF00] font-bold text-lg">{apy.toFixed(2)}% APY</span>
            <span className="text-gray-500">ⓘ</span>
          </div>
          <span className="text-gray-500 text-sm">{tagline}</span>
        </div>

        {/* TVL and Volume */}
        {(tvl || volume24h) && (
          <div className="flex items-center justify-between text-xs">
            {tvl && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">TVL:</span>
                <span className="text-gray-400 font-medium">{tvl}</span>
              </div>
            )}
            {volume24h && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">24h Vol:</span>
                <span className="text-gray-400 font-medium">{volume24h}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};