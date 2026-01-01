import { useState, useEffect } from 'react';
import { useConnect, useDisconnect, useBalance, useChains } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, ChevronDown, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { polygon } from 'viem/chains';
import { useWallet } from '@/hooks/use-wallet';

export function WalletConnect() {
  const { address, isConnected, chainId, isOnCorrectNetwork, switchToPolygon, hasMetaMask } = useWallet();
  const chains = useChains();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance, error: balanceError } = useBalance({
    address,
    chainId: polygon.id,
  });

  const currentChain = chains.find(c => c.id === chainId);
  const [copied, setCopied] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = async (connectorId: string) => {
    setConnectError(null);
    const connector = connectors.find(c => c.id === connectorId);
    if (connector) {
      try {
        await connect({ connector });
      } catch (err: any) {
        setConnectError(err.message || 'Failed to connect wallet');
        toast({
          title: "Connection Failed",
          description: err.message || 'Failed to connect wallet',
          variant: "destructive",
        });
        console.error('Connect error:', err);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setConnectError(null);
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balanceVal: string) => {
    const num = parseFloat(balanceVal);
    return isNaN(num) ? '0.0000' : num.toFixed(4);
  };

  if (isConnected && address) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-mono text-sm">
              {formatAddress(address)}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connected
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-mono text-sm">{formatAddress(address)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Balance */}
            {balance && (
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-mono text-sm">
                    {formatBalance(balance.formatted)} {balance.symbol}
                  </p>
                </div>
                <Badge variant="secondary">
                  {currentChain?.name || 'Unknown'}
                </Badge>
              </div>
            )}

            {/* Network */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="text-sm">
                  {chainId === polygon.id ? 'Polygon' : 'Wrong Network'}
                </p>
              </div>
              {!isOnCorrectNetwork && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToPolygon}
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Switch to Polygon
                </Button>
              )}
              {isOnCorrectNetwork && (
                <Badge variant="default" className="bg-green-500">Correct Network</Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => window.open(`https://polygonscan.com/address/${address}`, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet to connect to PolyArb Dashboard
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {connectError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {connectError}
          </div>
        )}

        {/* No wallet detected warning */}
        {!hasMetaMask && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              No wallet detected. Please install MetaMask or another wallet.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => handleConnect(connector.id)}
              disabled={isPending || !hasMetaMask}
              className="w-full justify-start h-12"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                {/* Wallet icons would go here */}
                <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span>
                  {connector.name}
                  {isPending && ' (connecting...)'}
                </span>
              </div>
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}