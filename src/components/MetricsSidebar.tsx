import { DashboardMetrics } from '@/types/arbitrage';
import { TrendingUp, Activity, Target, Percent, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBalance } from 'wagmi';
import { useWallet } from '@/hooks/use-wallet';
import { polygon } from 'viem/chains';
import { useState } from 'react';

interface MetricsSidebarProps {
  metrics: DashboardMetrics;
  collapsed: boolean;
  onToggle: () => void;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 50" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,50 ${points} 100,50`}
        fill="url(#sparklineGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  positive,
  collapsed 
}: { 
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean;
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div className="p-3 rounded-lg bg-secondary/50 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${positive ? 'text-profit' : 'text-muted-foreground'}`} />
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${positive ? 'text-profit' : 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-semibold font-mono ${positive ? 'text-profit' : 'text-foreground'}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
      )}
    </div>
  );
}

function SwapWidget({ collapsed }: { collapsed: boolean }) {
  const { address } = useWallet();
  const { data: balance } = useBalance({
    address,
    chainId: polygon.id,
  });
  const [amount, setAmount] = useState('');

  if (collapsed) {
    return (
      <div className="p-3 rounded-lg bg-secondary/50 flex items-center justify-center mt-auto">
        <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-border mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Quick Swap</span>
        <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>From (POL)</span>
            <span>Bal: {balance?.formatted ? parseFloat(balance.formatted).toFixed(4) : '0.00'}</span>
          </div>
          <Input 
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        
        <Button className="w-full h-8 text-xs" disabled={!amount}>
          Swap to USDC
        </Button>
      </div>
    </div>
  );
}

// TODO: Replace mockMetrics with real calculated metrics from execution logs
// The metrics should be calculated from actual trade history, not static values

export function MetricsSidebar({ metrics, collapsed, onToggle }: MetricsSidebarProps) {
  const defaultMetrics = {
    todayPnL: 0,
    tradesExecuted: 0,
    winRate: 0,
    avgEdge: 0,
    pnlHistory: [0, 0, 0, 0, 0, 0, 0],
  };

  const displayMetrics = metrics || defaultMetrics;
  return (
    <aside className={`glass-panel flex flex-col h-full transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className={`p-3 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center border-b border-border`}>
        {!collapsed && (
          <span className="text-sm font-medium text-muted-foreground">Overview</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className={`flex-1 p-3 flex flex-col gap-3 overflow-y-auto ${collapsed ? 'items-center' : ''}`}>
        <div className="space-y-3 flex-shrink-0">
          <MetricCard
            icon={TrendingUp}
            label="Today's PnL"
            value={`$${displayMetrics.todayPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            positive={displayMetrics.todayPnL > 0}
            collapsed={collapsed}
          />
          
          <MetricCard
            icon={Activity}
            label="Trades Executed"
            value={displayMetrics.tradesExecuted.toString()}
            subValue="today"
            collapsed={collapsed}
          />

          <MetricCard
            icon={Target}
            label="Win Rate"
            value={`${displayMetrics.winRate.toFixed(0)}%`}
            positive={displayMetrics.winRate >= 80}
            collapsed={collapsed}
          />

          <MetricCard
            icon={Percent}
            label="Avg Edge"
            value={`${displayMetrics.avgEdge.toFixed(1)}%`}
            positive={displayMetrics.avgEdge > 1}
            collapsed={collapsed}
          />
        </div>

        {!collapsed && (
          <div className="pt-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground mb-2 block">7-Day PnL</span>
            <Sparkline data={displayMetrics.pnlHistory} />
          </div>
        )}

        <div className="mt-auto pt-2">
          <SwapWidget collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
