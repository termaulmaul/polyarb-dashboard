import { Wallet, Menu } from 'lucide-react';

interface HeaderProps {
  botRunning: boolean;
  walletBalance: number;
  onMobileMenuClick?: () => void;
}

export function Header({ botRunning, walletBalance, onMobileMenuClick }: HeaderProps) {
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
      </div>

      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-secondary flex-shrink-0">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono text-xs sm:text-sm font-medium text-foreground">
          ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">USDC</span>
      </div>
    </header>
  );
}
