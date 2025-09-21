'use client'

import { useStore } from '@/lib/store/useStore'
import { Bell, Shield, Moon, Globe, HelpCircle, LogOut } from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants'

export default function SettingsPage() {
  const { isConnected, disconnectWallet } = useStore()

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          action: () => {},
        },
        {
          icon: Moon,
          label: 'Theme',
          description: 'Dark mode',
          action: () => {},
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'English',
          action: () => {},
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Security Settings',
          description: 'Manage your security preferences',
          action: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          description: 'Get help and support',
          action: () => {},
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted">
            Manage your account and preferences
          </p>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {settingsSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold mb-3 px-2">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full card-base card-hover flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <item.icon className="w-5 h-5 text-muted" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                  </div>
                  <span className="text-muted">→</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {isConnected && (
          <section>
            <button
              onClick={disconnectWallet}
              className="w-full card-base card-hover flex items-center justify-center gap-3 p-4 text-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Disconnect Wallet</span>
            </button>
          </section>
        )}

        <section className="text-center py-8">
          <p className="text-xs text-muted">
            {APP_CONFIG.appName} v{APP_CONFIG.version}
          </p>
          <p className="text-xs text-muted mt-1">
            Built for Hyperliquid
          </p>
        </section>
      </main>
    </div>
  )
}