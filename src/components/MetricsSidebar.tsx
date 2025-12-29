import { DashboardMetrics } from '@/types/arbitrage';
import { TrendingUp, Activity, Target, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function MetricsSidebar({ metrics, collapsed, onToggle }: MetricsSidebarProps) {
  return (
    <aside className={`glass-panel flex flex-col transition-all duration-300 ${
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

      <div className={`flex-1 p-3 space-y-3 ${collapsed ? 'items-center' : ''}`}>
        <MetricCard
          icon={TrendingUp}
          label="Today's PnL"
          value={`$${metrics.todayPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          positive={metrics.todayPnL > 0}
          collapsed={collapsed}
        />
        
        <MetricCard
          icon={Activity}
          label="Trades Executed"
          value={metrics.tradesExecuted.toString()}
          subValue="today"
          collapsed={collapsed}
        />
        
        <MetricCard
          icon={Target}
          label="Win Rate"
          value={`${metrics.winRate.toFixed(0)}%`}
          positive={metrics.winRate >= 80}
          collapsed={collapsed}
        />
        
        <MetricCard
          icon={Percent}
          label="Avg Edge"
          value={`${metrics.avgEdge.toFixed(1)}%`}
          positive={metrics.avgEdge > 1}
          collapsed={collapsed}
        />

        {!collapsed && (
          <div className="pt-2">
            <span className="text-xs text-muted-foreground mb-2 block">7-Day PnL</span>
            <Sparkline data={metrics.pnlHistory} />
          </div>
        )}
      </div>
    </aside>
  );
}
