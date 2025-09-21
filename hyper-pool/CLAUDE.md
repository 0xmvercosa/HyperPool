# Hyper Pool - Guia de Manutenção para IA

## 📋 Visão Geral
Hyper Pool é uma aplicação DeFi desenvolvida para a blockchain HyperEVM (Hyperliquid L1), permitindo que usuários façam swaps de tokens com distribuição personalizada (split swap).

## 🎯 Objetivo Principal
Fornecer uma interface simples e intuitiva para usuários realizarem swaps de USDC para múltiplos tokens (HYPE/USDT) com proporções configuráveis através da API da Hyperbloom.

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Framework**: Next.js 14 com App Router
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS com tema dark
- **Autenticação**: Privy (wallet connection + social login)
- **Blockchain**: Wagmi v2 + Viem
- **Estado**: Zustand
- **Notificações**: React Hot Toast

### Configurações Críticas
```typescript
// Chain ID da HyperEVM
CHAIN_ID: 999

// RPC da HyperEVM
RPC_URL: https://rpc.hyperliquid.xyz/evm

// API da Hyperbloom
API_URL: https://api.hyperbloom.io
```

## 🔐 Segurança e Credenciais

### Variáveis de Ambiente (.env.local)
```bash
# Privy - NUNCA expor no código
NEXT_PUBLIC_PRIVY_APP_ID=cmfstnkor00dtl80cnjn3qt82
PRIVY_APP_SECRET=<secret>  # Apenas server-side

# Hyperbloom API
NEXT_PUBLIC_HYPERBLOOM_API_KEY=<api_key>
NEXT_PUBLIC_HYPERBLOOM_API_URL=https://api.hyperbloom.io

# Chain
NEXT_PUBLIC_CHAIN_ID=999
NEXT_PUBLIC_RPC_URL=https://rpc.hyperliquid.xyz/evm
```

### ⚠️ Regras de Segurança
1. **NUNCA** colocar chaves API hardcoded no código
2. **SEMPRE** usar variáveis de ambiente
3. **NUNCA** expor PRIVY_APP_SECRET no client-side
4. **VERIFICAR** .gitignore para garantir que .env.local não seja commitado

## 📁 Estrutura de Pastas

```
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx           # Dashboard principal
│   ├── earn/              # Página de pools/swap
│   ├── portfolio/         # Portfolio do usuário
│   └── settings/          # Configurações
│
├── components/            # Componentes React
│   ├── layout/           # Layout (BottomNav)
│   ├── pools/            # Componentes de pool/swap
│   ├── wallet/           # Componentes de carteira
│   └── Providers.tsx     # Providers principais
│
├── lib/                  # Lógica de negócio
│   ├── config/          # Configurações
│   │   ├── chains.ts    # Config da HyperEVM
│   │   └── privy.ts     # Config do Privy
│   ├── hooks/           # React hooks customizados
│   │   ├── useWallet.ts    # Hook de carteira
│   │   ├── useSwap.ts      # Hook de swap
│   │   └── useHyperEVM.ts  # Hook de rede
│   ├── services/        # Serviços externos
│   │   └── hyperbloom.ts   # API Hyperbloom
│   └── store/           # Estado global (Zustand)
```

## 🔄 Fluxo Principal de Swap

1. **Conexão da Carteira**
   - Usuário conecta via email, Google ou wallet externa
   - Sistema verifica se está na HyperEVM
   - Se não, solicita troca de rede

2. **Configuração do Swap**
   - Usuário define quantidade de USDC
   - Escolhe proporção HYPE/USDT (50/50 padrão)
   - Sistema busca cotação na Hyperbloom

3. **Execução**
   - Confirmação do usuário
   - Chamada à API Hyperbloom
   - Feedback de sucesso/erro

## 🐛 Problemas Conhecidos e Soluções

### 1. Erro: "defaultChain must be included in supportedChains"
**Problema**: Privy não reconhece chains customizadas corretamente
**Solução Atual**: Usar Base como defaultChain e trocar para HyperEVM após conexão
**Hook**: `useHyperEVM()` gerencia a troca automática

### 2. Erro: "useNetwork is not exported from wagmi"
**Problema**: Wagmi v2 renomeou hooks
**Solução**: Usar `useChainId` ao invés de `useNetwork`

## 🚀 Comandos Importantes

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Linting
npm run lint

# Type checking
npm run typecheck
```

## 📋 Checklist de Manutenção

Ao fazer alterações, verifique:

- [ ] Chaves API não estão expostas no código
- [ ] Variáveis de ambiente estão configuradas
- [ ] Tipos TypeScript estão corretos
- [ ] Componentes seguem o padrão existente
- [ ] Hooks são usados corretamente
- [ ] Tratamento de erros está implementado
- [ ] Mensagens de feedback ao usuário são claras

## 🔗 Integrações Externas

### Privy
- **Docs**: https://docs.privy.io
- **Métodos de Login**: Email, Google, Wallets
- **Wallets Suportadas**: MetaMask, Rainbow, Coinbase, WalletConnect, Rabby, etc.

### Hyperbloom API
- **Base URL**: https://api.hyperbloom.io
- **Autenticação**: Header `X-API-Key`
- **Endpoints**:
  - `POST /v1/swap/quote` - Obter cotação
  - `POST /v1/swap/execute` - Executar swap
  - `GET /v1/pool/{id}` - Informações da pool

### HyperEVM
- **Chain ID**: 999
- **RPC**: https://rpc.hyperliquid.xyz/evm
- **Explorer**: https://explorer.hyperliquid.xyz
- **Native Token**: HYPE

## 💡 Dicas para IA

1. **Ao adicionar novos recursos**:
   - Siga os padrões existentes de hooks e componentes
   - Use Zustand para estado global
   - Mantenha componentes pequenos e focados

2. **Ao debuggar**:
   - Verifique console.log no `hyperbloomService`
   - Confirme que está na rede correta (Chain ID 999)
   - Verifique se as variáveis de ambiente estão carregadas

3. **Ao refatorar**:
   - Mantenha a estrutura de pastas organizada
   - Preserve os tipos TypeScript
   - Não remova tratamento de erros

## 📝 Notas de Desenvolvimento

- **Mock Mode**: Em desenvolvimento, a API Hyperbloom retorna dados mock se falhar
- **Auto Switch**: App tenta trocar para HyperEVM automaticamente após login
- **Mobile First**: UI otimizada para mobile com BottomNav
- **Dark Theme**: Tema escuro padrão com cores neon (verde #8CFF00)

## ⚡ Performance

- Query stale time: 60 segundos
- Refetch on focus: Desabilitado
- Debounce em inputs: 500ms recomendado
- Lazy loading de componentes pesados

## 🔍 Monitoramento

Para monitorar a aplicação:
1. Verificar Network tab para chamadas à API
2. Observar console para erros de rede
3. Confirmar Chain ID no console: `console.log(chainId)`
4. Verificar estado do Zustand: `useStore.getState()`

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0
**Maintainer**: IA Assistant