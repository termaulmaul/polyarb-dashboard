import { useState } from 'react';
import { ExecutionLog as ExecutionLogType } from '@/types/arbitrage';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Filter, CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExecutionLogProps {
  logs: ExecutionLogType[];
}

type StatusFilter = 'ALL' | 'BOTH_FILLED' | 'PARTIAL_FILL' | 'FAILED' | 'CANCELLED';

const statusConfig = {
  BOTH_FILLED: {
    label: 'Filled',
    icon: CheckCircle2,
    className: 'bg-profit/20 text-profit border-profit/30',
  },
  PARTIAL_FILL: {
    label: 'Partial',
    icon: AlertCircle,
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-loss/20 text-loss border-loss/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: MinusCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
}

export function ExecutionLog({ logs }: ExecutionLogProps) {
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter((log) => log.status === filter);

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Execution Log</h2>
          <Badge variant="secondary" className="ml-2">
            {filteredLogs.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="BOTH_FILLED">Filled</SelectItem>
              <SelectItem value="PARTIAL_FILL">Partial</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 scrollbar-thin">
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const config = statusConfig[log.status];
            const StatusIcon = config.icon;
            
            return (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-secondary/50 border border-border/50 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime(log.timestamp)}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${config.className}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate mb-1">
                      {log.market}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono">
                        <span className="text-muted-foreground">YES:</span>{' '}
                        <span className="text-foreground">${log.yesPrice.toFixed(2)}</span>
                      </span>
                      <span className="font-mono">
                        <span className="text-muted-foreground">NO:</span>{' '}
                        <span className="text-foreground">${log.noPrice.toFixed(2)}</span>
                      </span>
                      <span className={`font-mono font-semibold ${
                        log.expectedEdge > 0 ? 'text-profit' : 'text-muted-foreground'
                      }`}>
                        {log.expectedEdge > 0 ? '+' : ''}{log.expectedEdge.toFixed(1)}%
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
