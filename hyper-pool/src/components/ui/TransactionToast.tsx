'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/format'

interface TransactionToastProps {
  type: 'pending' | 'success' | 'error'
  message: string
  txHash?: string
  onClose?: () => void
  duration?: number
}

export function TransactionToast({
  type,
  message,
  txHash,
  onClose,
  duration = 5000,
}: TransactionToastProps) {
  useEffect(() => {
    if (type !== 'pending' && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [type, onClose, duration])

  const icons = {
    pending: <Loader2 className="w-5 h-5 animate-spin" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  }

  const styles = {
    pending: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    error: 'bg-red-500/10 border-red-500/20 text-red-500',
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[9999] max-w-sm',
        'animate-slide-in'
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border',
          'bg-card backdrop-blur-xl shadow-xl',
          styles[type]
        )}
      >
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {txHash && (
            <a
              href={`https://explorer.hyperevm.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs hover:underline"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {onClose && type !== 'pending' && (
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}