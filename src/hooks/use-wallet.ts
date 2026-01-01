import { useAccount, useChainId, useSwitchChain, useConnect } from 'wagmi';
import { polygon } from 'viem/chains';
import { useState, useEffect } from 'react';

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connectors } = useConnect();
  
  const [error, setError] = useState<string | null>(null);

  const isOnCorrectNetwork = chainId === polygon.id;

  const switchToPolygon = () => {
    if (!isOnCorrectNetwork) {
      try {
        switchChain({ chainId: polygon.id });
      } catch (err) {
        setError('Failed to switch network. Please switch manually.');
        console.error('Switch chain error:', err);
      }
    }
  };

  // Check if MetaMask is available
  const hasMetaMask = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    isOnCorrectNetwork,
    switchToPolygon,
    error,
    hasMetaMask,
  };
}