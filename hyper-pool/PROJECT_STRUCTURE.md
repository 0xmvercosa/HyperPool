# Project Structure - Hyper Pool

## 🌳 Complete Directory Tree

```
hyper-pool/
│
├── 📁 public/
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   └── manifest.json          # PWA configuration
│
├── 📁 src/
│   ├── 📁 app/                # Next.js App Router pages
│   │   ├── favicon.ico
│   │   ├── globals.css        # Global styles + Tailwind
│   │   ├── layout.tsx         # Root layout with Providers
│   │   ├── page.tsx           # Home/Dashboard page
│   │   │
│   │   ├── 📁 earn/
│   │   │   └── page.tsx       # Pool/Swap interface
│   │   │
│   │   ├── 📁 portfolio/
│   │   │   └── page.tsx       # User portfolio view
│   │   │
│   │   └── 📁 settings/
│   │       └── page.tsx       # App settings
│   │
│   ├── 📁 components/         # React components
│   │   ├── Providers.tsx      # Main app providers (Privy, Wagmi, etc)
│   │   ├── ProvidersWithHyperEVM.tsx  # Alternative provider config
│   │   │
│   │   ├── 📁 layout/
│   │   │   └── BottomNav.tsx  # Mobile bottom navigation
│   │   │
│   │   ├── 📁 pools/
│   │   │   ├── PoolCard.tsx   # Pool display card
│   │   │   ├── PoolList.tsx   # List of pools
│   │   │   ├── StakeModal.tsx # Staking interface
│   │   │   └── SwapModal.tsx  # Swap interface modal
│   │   │
│   │   └── 📁 wallet/
│   │       ├── EarningPool.tsx    # Earnings display
│   │       ├── QuickActions.tsx   # Quick action buttons
│   │       ├── WalletBalance.tsx  # Balance display
│   │       └── WalletConnect.tsx  # Connection button/status
│   │
│   ├── 📁 lib/               # Core business logic
│   │   ├── 📁 config/
│   │   │   ├── chains.ts     # HyperEVM chain configuration
│   │   │   ├── privy.ts      # Privy auth configuration
│   │   │   └── privyChains.ts # Privy-specific chain config
│   │   │
│   │   ├── 📁 hooks/         # Custom React hooks
│   │   │   ├── useHyperEVM.ts    # Network management hook
│   │   │   ├── usePoolActions.ts # Pool interaction hook
│   │   │   ├── useSwap.ts        # Swap functionality hook
│   │   │   └── useWallet.ts      # Wallet connection hook
│   │   │
│   │   ├── 📁 services/
│   │   │   └── hyperbloom.ts # Hyperbloom API integration
│   │   │
│   │   ├── 📁 store/
│   │   │   └── useStore.ts   # Zustand global state
│   │   │
│   │   └── 📁 utils/
│   │       ├── format.ts     # Formatting utilities
│   │       └── toast.ts      # Toast notification helpers
│   │
│   └── 📁 types/
│       └── index.ts          # TypeScript type definitions
│
├── 📄 Configuration Files
│   ├── .env.local            # Environment variables (NOT in git)
│   ├── .env.example          # Example environment variables
│   ├── .eslintrc.json        # ESLint configuration
│   ├── .gitignore            # Git ignore rules
│   ├── next.config.mjs       # Next.js configuration
│   ├── package.json          # Dependencies and scripts
│   ├── postcss.config.mjs    # PostCSS configuration
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   └── tsconfig.json         # TypeScript configuration
│
└── 📄 Documentation
    ├── README.md             # Project overview
    ├── CLAUDE.md            # AI maintenance guide
    └── PROJECT_STRUCTURE.md # This file
```

## 📦 Key Dependencies

### Core Framework
- `next`: 14.2.32 - React framework
- `react`: ^18 - UI library
- `typescript`: ^5 - Type safety

### Blockchain & Web3
- `wagmi`: ^2.5.7 - Ethereum interactions
- `viem`: ^2.7.0 - Ethereum utilities
- `@privy-io/react-auth`: ^1.66.2 - Authentication

### State Management
- `zustand`: ^4.5.0 - Global state
- `@tanstack/react-query`: ^5.18.1 - Server state

### UI & Styling
- `tailwindcss`: ^3.3.0 - Utility CSS
- `lucide-react`: ^0.312.0 - Icons
- `react-hot-toast`: ^2.4.1 - Notifications
- `clsx`: ^2.1.0 - Class utilities

## 🔧 Configuration Files Explained

### `/next.config.mjs`
- Next.js app configuration
- Environment variable validation
- Build optimizations

### `/tailwind.config.ts`
- Custom color scheme (dark theme)
- Neon green accent (#8CFF00)
- Responsive breakpoints

### `/tsconfig.json`
- TypeScript compiler options
- Path aliases (@/ for src/)
- Strict type checking

### `/.env.local`
Critical environment variables:
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy app identifier
- `PRIVY_APP_SECRET` - Server-side only
- `NEXT_PUBLIC_HYPERBLOOM_API_KEY` - API authentication
- `NEXT_PUBLIC_CHAIN_ID` - HyperEVM chain (999)
- `NEXT_PUBLIC_RPC_URL` - Blockchain RPC endpoint

## 🎨 Component Architecture

### Provider Hierarchy
```tsx
<PrivyProvider>
  <WagmiProvider>
    <QueryClientProvider>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
</PrivyProvider>
```

### Page Structure
```tsx
<Layout>
  <Main>
    <PageContent />
  </Main>
  <BottomNav />
  <Toaster />
</Layout>
```

## 🔄 Data Flow

1. **User Action** → Component
2. **Component** → Custom Hook
3. **Hook** → Service/Store
4. **Service** → External API
5. **Response** → Store Update
6. **Store** → Component Re-render

## 📱 Mobile-First Design

- Bottom navigation for mobile
- Touch-optimized buttons (min 44px)
- Responsive grid layouts
- Swipe gestures support ready
- PWA capabilities enabled

## 🔐 Security Patterns

1. **Environment Variables**
   - All secrets in `.env.local`
   - Never commit sensitive data
   - Use `NEXT_PUBLIC_` prefix for client-side vars

2. **API Keys**
   - Store in environment variables
   - Never hardcode in source
   - Validate on server when possible

3. **Wallet Security**
   - No private key handling
   - All signing via Privy/wallet provider
   - Transaction confirmation required

## 🚀 Build & Deploy

```bash
# Development
npm run dev         # Start dev server on :3000

# Production
npm run build       # Create production build
npm run start       # Start production server

# Quality Checks
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript compiler
```

## 📊 State Management Strategy

### Zustand Store (`useStore`)
- User wallet information
- Pool data cache
- UI preferences
- Transaction history

### React Query
- API data fetching
- Cache management
- Background refetching
- Optimistic updates

### Local Component State
- Form inputs
- Modal visibility
- Loading states
- Temporary UI state

## 🎯 Performance Optimizations

1. **Code Splitting**
   - Dynamic imports for modals
   - Route-based splitting (automatic)

2. **Caching**
   - React Query: 60s stale time
   - Static assets: CDN ready

3. **Optimization Techniques**
   - Memoization where needed
   - Virtual scrolling for long lists
   - Debounced inputs
   - Lazy loading images

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Chain connection fails | Check RPC URL and Chain ID (999) |
| API calls fail | Verify API key in .env.local |
| Build errors | Run `npm install --legacy-peer-deps` |
| Type errors | Check tsconfig paths and imports |
| Style not applying | Verify Tailwind class names |

## 📈 Future Enhancements

- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Advanced charting
- [ ] Notification system
- [ ] Social features
- [ ] Governance integration

---

**Generated**: December 2024
**Version**: 1.0.0
**Purpose**: Technical documentation for developers and AI assistants