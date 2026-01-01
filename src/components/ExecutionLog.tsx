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

type StatusFilter = 'ALL' | 'BOTH_FILLED' | 'PARTIAL_FILL' | 'FAILED' | 'CANCELLED' | 'PENDING';

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
  PENDING: {
    label: 'Pending',
    icon: AlertCircle,
    className: 'bg-warning/20 text-warning border-warning/30',
  },
};

// Fallback config for unknown statuses
const fallbackStatusConfig = {
  label: 'Unknown',
  icon: AlertCircle,
  className: 'bg-muted text-muted-foreground border-border',
};

function formatTime(dateInput: string | Date): string {
  // Handle both string (ISO format) and Date objects
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
}

// Safe toFixed that handles undefined/null
function safeToFixed(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(decimals);
}

// TODO: Replace mockExecutionLogs with real execution logs from backend
// Logs should come from actual trade executions, not mock data

// TODO: Replace mockExecutionLogs with real execution logs from backend
// Logs should come from actual trade executions, not mock data

export function ExecutionLog({ logs }: ExecutionLogProps) {
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter((log) => log.status === filter);

  const isLoading = logs.length === 0;
  const hasData = logs.length > 0;

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-5 h-5 text-primary flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold truncate">Execution Log</h2>
          <Badge variant="secondary" className="ml-1 sm:ml-2 flex-shrink-0">
            {filteredLogs.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[110px] sm:w-[130px] h-8 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="BOTH_FILLED">Filled</SelectItem>
              <SelectItem value="PARTIAL_FILL">Partial</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4 scrollbar-thin">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading execution logs...</p>
                <p className="text-xs text-muted-foreground mt-2">Make sure backend is running on port 3001</p>
              </div>
            </div>
          ) : hasData ? (
            filteredLogs.map((log) => {
              const config = statusConfig[log.status] || fallbackStatusConfig;
              const StatusIcon = config.icon;

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-secondary/50 border border-border/50 animate-fade-in"
                >
                  <div className="flex items-center gap-3 text-xs">
                    {/* Market Name - Truncated */}
                    <p className="font-medium truncate flex-1 min-w-0" title={log.market}>
                      {log.market}
                    </p>

                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0.5 h-5 flex-shrink-0 ${config.className}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>

                    {/* Prices & Edge */}
                    <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                      <span>
                        <span className="text-muted-foreground">Y:</span>
                        <span className="text-foreground">${safeToFixed(log.yesPrice, 2)}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">N:</span>
                        <span className="text-foreground">${safeToFixed(log.noPrice, 2)}</span>
                      </span>
                      <span className={`font-semibold ${
                        (log.expectedEdge ?? 0) > 0 ? 'text-profit' : 'text-muted-foreground'
                      }`}>
                        {(log.expectedEdge ?? 0) > 0 ? '+' : ''}{safeToFixed(log.expectedEdge, 1)}%
                      </span>
                    </div>

                    {/* Timestamp */}
                    <span className="font-mono text-muted-foreground flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No execution logs found</p>
                <p className="text-xs text-muted-foreground mt-2">Trade executions will appear here</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
