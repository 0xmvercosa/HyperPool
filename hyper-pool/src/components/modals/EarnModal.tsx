'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, Loader2, DollarSign, TrendingUp, Shield, Zap } from 'lucide-react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useSwap } from '@/lib/hooks/useSwap';
import { useInvestments } from '@/lib/hooks/useInvestments';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { TOKEN_LOGOS } from '@/lib/constants/tokens';
import poolsData from '@/config/pools.json';

interface EarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string | null;
}

export const EarnModal = ({ isOpen, onClose, poolId }: EarnModalProps) => {
  const { balance, isConnected } = useWallet();
  const { executeSwap, isLoading: isSwapping, approveInputToken, isApproving, getQuote } = useSwap();
  const { addInvestment } = useInvestments();
  const [investmentAmount, setInvestmentAmount] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'approving' | 'swapping' | 'success'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const pool = poolsData.pools.find(p => p.id === poolId);
  const riskInfo = pool ? poolsData.riskLevels[pool.riskLevel as keyof typeof poolsData.riskLevels] : null;

  useEffect(() => {
    if (isOpen) {
      // Set initial amount to 0.50 or minimum
      const minAmount = pool?.minInvestment || 0.5;
      const defaultAmount = Math.max(minAmount, Math.min(5, balance?.usdc || 0));
      // Round to nearest 0.50
      const rounded = Math.round(defaultAmount * 2) / 2;
      setInvestmentAmount(rounded);
    }
  }, [isOpen, pool, balance]);

  if (!pool) return null;

  // Calculate projected yield based on investment amount and APY
  const calculateYield = (amount: number) => {
    const yearlyYield = (amount * pool.apy.current) / 100;
    return yearlyYield.toFixed(2);
  };

  const handleGetQuote = async () => {
    console.log('handleGetQuote called with:', {
      poolId,
      investmentAmount,
      balance: balance?.usdc
    });

    if (!poolId || !pool) {
      toast.error('Pool not selected');
      return;
    }

    if (investmentAmount < 0.5) {
      toast.error('Minimum investment is $0.50');
      return;
    }

    if (!balance?.usdc || investmentAmount > balance.usdc) {
      toast.error(`Insufficient balance. You have $${balance?.usdc?.toFixed(2) || '0.00'}`);
      return;
    }

    setLoadingQuote(true);
    try {
      // Build ratios based on pool tokens allocation
      // For HYPE-USDT pool, we need to handle WHYPE token
      let ratios: number[] = [];

      if (poolId === 'hype-usdt') {
        // HYPE/USDT pool uses WHYPE and USDT
        ratios = [50, 50]; // 50% WHYPE, 50% USDT
      } else {
        ratios = pool.tokens
          .filter(token => token.symbol !== 'USDC' && token.symbol !== 'USDT')
          .map(token => token.allocation);
      }

      console.log('Getting quote with ratios:', ratios);

      const quote = await getQuote(
        poolId,
        investmentAmount.toFixed(2),
        ratios.length > 0 ? ratios : undefined
      );

      console.log('Quote received:', quote);

      if (quote) {
        // Validate the quote structure
        if (!quote.outputTokens || !Array.isArray(quote.outputTokens)) {
          console.error('Invalid quote: missing outputTokens', quote);
          toast.error('Invalid response from API: missing output tokens');
          return;
        }

        if (!quote.outputAmounts || !Array.isArray(quote.outputAmounts)) {
          console.error('Invalid quote: missing outputAmounts', quote);
          toast.error('Invalid response from API: missing output amounts');
          return;
        }

        // Set minimum output amounts if not present
        if (!quote.minOutputAmounts) {
          quote.minOutputAmounts = quote.outputAmounts.map((amount: string) => {
            try {
              // Validate amount is a valid string number
              if (!amount || amount === 'undefined' || amount === 'null' || amount === 'NaN') {
                console.warn('Invalid amount for minOutput calculation:', amount);
                return '0';
              }
              const amountBigInt = BigInt(amount);
              const slippageAmount = amountBigInt * BigInt(5) / BigInt(1000); // 0.5% slippage
              return (amountBigInt - slippageAmount).toString();
            } catch (e) {
              console.error('Error calculating min output amount:', amount, e);
              return '0';
            }
          });
        }

        // Set price impact if not present
        if (!quote.totalPriceImpact) {
          quote.totalPriceImpact = quote.quotes?.reduce((max: number, q: any) =>
            Math.max(max, parseFloat(q.estimatedPriceImpact || '0')), 0
          ) || 0;
        }

        console.log('Quote validated:', {
          outputTokens: quote.outputTokens,
          outputAmounts: quote.outputAmounts,
          minOutputAmounts: quote.minOutputAmounts,
          totalPriceImpact: quote.totalPriceImpact
        });

        setQuoteData(quote);
        setShowPreview(true);
      } else {
        console.error('No quote received from API');
        toast.error('Failed to get quote from API');
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get quote');
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleInvest = async () => {
    console.log('Investment amount:', investmentAmount);
    console.log('Balance USDC:', balance?.usdc);
    console.log('Pool min investment:', pool.minInvestment);
    console.log('Pool ID:', poolId);

    if (investmentAmount < pool.minInvestment) {
      toast.error(`Minimum investment is $${pool.minInvestment}`);
      return;
    }

    // Check balance - ensure we're comparing numbers correctly
    const userBalance = balance?.usdc || 0;
    if (investmentAmount > userBalance) {
      toast.error(`Insufficient USDC balance. You have $${userBalance.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    setTransactionStep('approving');

    try {
      // Convert to string with proper decimal places
      const amountString = investmentAmount.toFixed(2); // USDC amount as string

      console.log('Sending swap with amount:', amountString);

      // Build ratios based on pool tokens allocation
      const ratios = pool.tokens
        .filter(token => token.symbol !== 'USDC' && token.symbol !== 'USDT')
        .map(token => token.allocation);

      // First step: Approve tokens if needed
      setTransactionStep('approving');
      const approved = await approveInputToken(poolId!, amountString);

      if (!approved) {
        setTransactionStep('idle');
        setIsProcessing(false);
        return;
      }

      // Second step: Execute swap
      setTransactionStep('swapping');
      const result = await executeSwap(
        poolId!,
        amountString,
        ratios,
        0.5 // 0.5% slippage
      );

      if (result?.success && result?.txHashes?.length > 0) {
        const transactionHash = result.txHashes[0];
        setTxHash(transactionHash);
        setTransactionStep('success');

        // Save investment to local storage
        addInvestment(poolId!, investmentAmount, transactionHash);

        toast.success(`Successfully invested $${investmentAmount} in ${pool.name} pool`);

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setTransactionStep('idle');
          setTxHash(null);
        }, 3000);
      } else {
        setTransactionStep('idle');
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Failed to invest:', error);
      toast.error(error.message || 'Failed to invest');
      setTransactionStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const contentVariants = {
    hidden: { x: '100%' },
    visible: { x: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 30 }}
            className="fixed inset-0 md:relative md:inset-auto bg-black md:bg-zinc-900 md:rounded-2xl w-full md:max-w-md max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-black md:bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-4 z-10">
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <DollarSign className="w-5 h-5 text-[#8CFF00]" />
                <span className="text-[#8CFF00] font-medium">
                  ${balance?.usdc?.toFixed(2) || '0.00'} Available
                </span>
              </div>
            </div>

            {/* Multi-step Modal Overlay */}
            {transactionStep !== 'idle' && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center">
                <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full mx-4">
                  <div className="text-center">
                    {transactionStep === 'approving' && (
                      <>
                        <Loader2 className="w-12 h-12 text-[#8CFF00] animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Approving USDC</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Please approve the spending limit in your wallet
                        </p>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Step 1 of 2</p>
                          <p className="text-sm text-white mt-1">Approve ${investmentAmount.toFixed(2)} USDC</p>
                        </div>
                      </>
                    )}

                    {transactionStep === 'swapping' && (
                      <>
                        <Loader2 className="w-12 h-12 text-[#8CFF00] animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Processing Investment</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Swapping your USDC to pool tokens
                        </p>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Step 2 of 2</p>
                          <p className="text-sm text-white mt-1">Investing ${investmentAmount.toFixed(2)} in {pool.name}</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          {pool.tokens.filter(t => t.symbol !== 'USDC' && t.symbol !== 'USDT').map(token => (
                            <div key={token.symbol} className="flex justify-between text-sm">
                              <span className="text-gray-400">{token.symbol}:</span>
                              <span className="text-white">{token.allocation}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {transactionStep === 'success' && (
                      <>
                        <div className="w-12 h-12 bg-[#8CFF00] rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Investment Successful!</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          You've successfully invested in {pool.name}
                        </p>
                        <div className="bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Amount Invested</p>
                          <p className="text-lg font-semibold text-[#8CFF00] mt-1">${investmentAmount.toFixed(2)}</p>
                        </div>
                        {txHash && (
                          <div className="mt-4">
                            <a
                              href={`https://explorer.hyperliquid.xyz/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8CFF00] text-sm hover:underline"
                            >
                              View transaction →
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 space-y-6">
              {/* Pool Header */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Start Earning</h2>
                <p className="text-gray-400">
                  {pool.fullDescription}
                </p>
              </div>

              {/* Pool Info Pills */}
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 rounded-full px-3 py-1 flex items-center gap-1">
                  <span className="text-gray-400 text-sm">{pool.risk}</span>
                </div>
                <div className="bg-zinc-800 rounded-full px-3 py-1 flex items-center gap-2">
                  <span className="text-[#8CFF00] font-bold">{pool.apy.current}% APY</span>
                  <Info className="w-3 h-3 text-gray-500" />
                </div>
                <div className="bg-zinc-800 rounded-full px-3 py-1 flex items-center gap-1">
                  <span className="text-gray-400 text-sm">Assets</span>
                  <div className="flex -space-x-1">
                    {pool.tokens.slice(0, 3).map((token, idx) => {
                      const logo = TOKEN_LOGOS[token.symbol as keyof typeof TOKEN_LOGOS];
                      return logo ? (
                        <Image
                          key={idx}
                          src={logo}
                          alt={token.symbol}
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Simulation Section */}
              <div>
                <h3 className="text-white font-semibold mb-4">Simulation</h3>
                <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Yield</span>
                      <Info className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-sm mb-3">
                      Think of yield as a type of dividend you earn, separately from asset performance.
                    </p>
                    <div className="text-3xl font-bold text-[#8CFF00]">
                      ${calculateYield(investmentAmount)}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400">Investment</span>
                      <div className="bg-zinc-800 rounded px-3 py-1">
                        <input
                          type="number"
                          value={investmentAmount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0.5) {
                              setInvestmentAmount(Math.round(value * 2) / 2);
                            }
                          }}
                          min="0.5"
                          step="0.5"
                          className="bg-transparent text-white w-20 text-right focus:outline-none"
                        />
                        <span className="text-gray-400 ml-1">$</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0.5}
                        max={Math.max(0.5, Math.min(100, balance?.usdc || 0.5))}
                        step={0.5}
                        value={investmentAmount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setInvestmentAmount(value);
                        }}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #8CFF00 0%, #8CFF00 ${
                            ((investmentAmount - 0.5) / (Math.max(0.5, Math.min(100, balance?.usdc || 0.5)) - 0.5)) * 100
                          }%, #3f3f46 ${
                            ((investmentAmount - 0.5) / (Math.max(0.5, Math.min(100, balance?.usdc || 0.5)) - 0.5)) * 100
                          }%, #3f3f46 100%)`
                        }}
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-500 text-sm">$0.50</span>
                        <span className="text-gray-500 text-sm">
                          ${Math.max(0.5, Math.min(100, balance?.usdc || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analyst Rating */}
              <div>
                <h3 className="text-white font-semibold mb-4">Analyst Rating</h3>
                <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-[#8CFF00] mb-2">
                      {pool.apy.current}% APY
                    </div>
                    <p className="text-gray-500 text-sm">
                      Think of the yield as a type of dividend you earn, separate from the asset's performance.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-medium`} style={{ color: riskInfo?.color }}>
                        {riskInfo?.label} risk
                      </span>
                      <Info className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(pool.riskLevel / 5) * 100}%`,
                          backgroundColor: riskInfo?.color
                        }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs">
                      {pool.riskDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                    <div>
                      <div className="text-[#8CFF00] font-bold text-lg">{pool.tvl}</div>
                      <div className="text-gray-500 text-xs">TVL</div>
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{pool.apy.avg30d}%</div>
                      <div className="text-gray-500 text-xs">30d APY</div>
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{pool.fees.management}%</div>
                      <div className="text-gray-500 text-xs">Fees</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGetQuote}
                  disabled={!isConnected || isProcessing || isSwapping || transactionStep !== 'idle' || loadingQuote || investmentAmount < 0.5}
                  className="flex-1 px-6 py-4 rounded-xl bg-[#8CFF00] hover:bg-[#7AE600] text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting Quote...</span>
                    </>
                  ) : (isProcessing || isSwapping || transactionStep !== 'idle') ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Preview Swap</span>
                  )}
                </button>
              </div>

              {/* Additional Actions */}
              <div className="flex items-center justify-center">
                <button className="text-gray-400 text-sm flex items-center gap-2 hover:text-white transition-colors">
                  <Zap className="w-4 h-4" />
                  <span>Invest with Pay</span>
                </button>
              </div>
            </div>

            {/* Swap Preview Modal */}
            {showPreview && quoteData && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center px-4">
                <div className="bg-zinc-900 rounded-2xl max-w-md w-full">
                  {/* Header */}
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-white">Review Swap</h3>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* You Pay */}
                    <div>
                      <p className="text-gray-400 text-sm mb-2">You Pay</p>
                      <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{investmentAmount.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          {TOKEN_LOGOS.USDC && (
                            <Image src={TOKEN_LOGOS.USDC} alt="USDC" width={24} height={24} className="rounded-full" />
                          )}
                          <span className="text-white font-medium">USDC</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="bg-[#8CFF00] rounded-lg p-2">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    {/* You Receive */}
                    <div>
                      <p className="text-gray-400 text-sm mb-2">You Receive</p>
                      <div className="space-y-2">
                        {quoteData?.outputTokens?.map((token: string, index: number) => {
                          const outputAmount = quoteData.minOutputAmounts?.[index] || quoteData.outputAmounts?.[index] || '0';
                          const allocation = pool.tokens.find(t => t.symbol === token)?.allocation || 50;

                          // Safe conversion for display
                          let displayAmount = '0.000000';
                          try {
                            const decimals = token.includes('HYPE') ? 18 : 6;
                            // Ensure we have a valid value to convert
                            let validAmount = '0';
                            if (typeof outputAmount === 'string' && outputAmount && outputAmount !== 'undefined' && outputAmount !== 'null' && outputAmount !== 'NaN') {
                              validAmount = outputAmount;
                            } else if (typeof outputAmount === 'number' && !isNaN(outputAmount)) {
                              validAmount = Math.floor(outputAmount).toString();
                            }
                            const amountNum = BigInt(validAmount);
                            displayAmount = (Number(amountNum) / (10 ** decimals)).toFixed(6);
                          } catch (e) {
                            console.error('Error formatting output amount:', outputAmount, e);
                          }

                          return (
                            <div key={token} className="bg-zinc-800 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {TOKEN_LOGOS[token as keyof typeof TOKEN_LOGOS] && (
                                    <Image
                                      src={TOKEN_LOGOS[token as keyof typeof TOKEN_LOGOS]}
                                      alt={token}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  )}
                                  <span className="text-white font-medium">{token}</span>
                                  <span className="text-gray-500 text-sm">({allocation}%)</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-white font-semibold">{displayAmount}</div>
                                  <div className="text-gray-500 text-xs">min. output</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pool Info Box */}
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-yellow-500 font-medium text-sm mb-1">Current Pool Distribution</p>
                          <p className="text-gray-400 text-xs">
                            This swap uses a {pool.tokens.filter(t => t.symbol !== 'USDC' && t.symbol !== 'USDT').map(t => t.allocation).join('/')} split between {pool.tokens.filter(t => t.symbol !== 'USDC' && t.symbol !== 'USDT').map(t => t.symbol).join(' and ')}.
                            Future versions will calculate optimal ratios based on pool state.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Network Fee</span>
                        <span className="text-white">0 HYPE</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price Impact</span>
                        <span className="text-white">{quoteData?.totalPriceImpact?.toFixed(2) || '0.00'}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Max Slippage</span>
                        <span className="text-white">0.5%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Number of Transactions</span>
                        <span className="text-white">{quoteData.outputTokens?.length || 2}</span>
                      </div>
                    </div>

                    {/* Min Receive */}
                    <div className="bg-zinc-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">You'll receive at least</p>
                      <p className="text-[#8CFF00] font-medium">
                        {quoteData?.outputTokens?.map((token: string, index: number) => {
                          const amount = quoteData.minOutputAmounts?.[index] || '0';
                          const decimals = token.includes('HYPE') ? 18 : 6;
                          try {
                            // Validate amount before conversion
                            if (!amount || amount === 'undefined' || amount === 'null' || amount === 'NaN') {
                              console.warn('Invalid amount for display:', amount);
                              return `0.000000 ${token}`;
                            }
                            const amountBigInt = BigInt(amount);
                            const divisor = BigInt(10 ** decimals);
                            const formatted = Number(amountBigInt) / Number(divisor);
                            return `${formatted.toFixed(6)} ${token}`;
                          } catch (e) {
                            console.error('Error formatting amount:', amount, e);
                            return `0.000000 ${token}`;
                          }
                        }).join(' + ')}
                      </p>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-500 text-lg">⚠</span>
                        <p className="text-yellow-500 text-sm">
                          This swap requires {quoteData.outputTokens?.length || 2} separate transactions. You'll need to approve each one in your wallet.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-zinc-800 flex gap-3">
                    <button
                      onClick={() => {
                        setShowPreview(false);
                        setQuoteData(null);
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowPreview(false);
                        handleInvest();
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#8CFF00] hover:bg-[#7AE600] text-black font-semibold transition-colors"
                    >
                      Invest
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};