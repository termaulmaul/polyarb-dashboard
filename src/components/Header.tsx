import { Menu, AlertTriangle, RefreshCw } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  botRunning: boolean;
  onMobileMenuClick?: () => void;
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
}

export function Header({ botRunning, onMobileMenuClick, lastUpdated, isRefreshing }: HeaderProps) {
  const { isConnected, isOnCorrectNetwork, switchToPolygon } = useWallet();

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="glass-panel px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-1 rounded hover:bg-accent transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">
            PolyArb
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Binary Market Arbitrage Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary flex-shrink-0">
          <span
            className={`status-dot ${botRunning ? 'status-dot-active animate-pulse-subtle' : 'status-dot-paused'}`}
          />
          <span className="text-xs sm:text-sm font-medium text-secondary-foreground">
            {botRunning ? 'Running' : 'Paused'}
          </span>
        </div>

        {/* Live Refresh Indicator */}
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`}
            />
            <span>Updated {formatTime(lastUpdated)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isConnected && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 rounded-md border border-yellow-500/20 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Wallet Not Connected</span>
          </div>
        )}

        {isConnected && !isOnCorrectNetwork && (
          <Button
            variant="destructive"
            size="sm"
            onClick={switchToPolygon}
            className="h-9 text-xs"
          >
            Wrong Network
          </Button>
        )}

        <WalletConnect />
      </div>
    </header>
  );
}
