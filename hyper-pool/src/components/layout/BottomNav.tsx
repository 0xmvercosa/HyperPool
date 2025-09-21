'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/format'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/earn', icon: TrendingUp, label: 'Earn' },
  { href: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                'hover:bg-card-hover active:scale-95',
                isActive ? 'text-primary' : 'text-muted'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}