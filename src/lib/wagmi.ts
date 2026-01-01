import { createConfig, http } from 'wagmi';
import { mainnet, polygon } from 'viem/chains';
import { metaMask, coinbaseWallet, injected } from 'wagmi/connectors';

// Public RPC URLs for fallback
const POLYGON_RPC = 'https://polygon-rpc.com';
const MAINNET_RPC = 'https://ethereum.publicnode.com';

export const config = createConfig({
  chains: [polygon, mainnet],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({
      appName: 'PolyArb Dashboard',
      appLogoUrl: 'https://polyarb-dashboard.vercel.app/favicon.ico',
    }),
  ],
  transports: {
    [polygon.id]: http(POLYGON_RPC),
    [mainnet.id]: http(MAINNET_RPC),
  },
  ssr: false, // Disable SSR for wallet connections
});

export type { Config } from 'wagmi';