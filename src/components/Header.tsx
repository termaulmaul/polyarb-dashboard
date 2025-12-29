import { Wallet } from 'lucide-react';

interface HeaderProps {
  botRunning: boolean;
  walletBalance: number;
}

export function Header({ botRunning, walletBalance }: HeaderProps) {
  return (
    <header className="glass-panel px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            PolyArb
          </h1>
          <p className="text-xs text-muted-foreground">
            Binary Market Arbitrage Dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
          <span 
            className={`status-dot ${botRunning ? 'status-dot-active animate-pulse-subtle' : 'status-dot-paused'}`} 
          />
          <span className="text-sm font-medium text-secondary-foreground">
            {botRunning ? 'Bot Running' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono text-sm font-medium text-foreground">
          ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-muted-foreground">USDC</span>
      </div>
    </header>
  );
}
