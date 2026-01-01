import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { WalletConnect } from './WalletConnect';

export function WalletStatus() {
  const { isConnected, isOnCorrectNetwork } = useWallet();

  if (!isConnected) {
    return (
      <Alert className="mb-4">
        <Wallet className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Please connect your wallet to use the arbitrage features.</span>
          </AlertDescription>
      </Alert>
    );
  }

  if (!isOnCorrectNetwork) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Please switch to Polygon network to use Polymarket.</span>
            <Button onClick={() => useWallet().switchToPolygon()} variant="outline" size="sm">
              Switch Network
            </Button>
          </AlertDescription>
      </Alert>
    );
  }

  return null;
}