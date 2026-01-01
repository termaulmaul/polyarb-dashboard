import { Opportunity } from '@/types/arbitrage';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  minEdgeFilter?: number;
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const isSimulated = opp.isMock || opp.isSimulated;

  return (
    <div className={`p-4 rounded-lg border border-border bg-card transition-all ${
      opp.executable && opp.edge > 0 ? 'glow-profit bg-primary/5' : ''
    } ${isSimulated ? 'border-yellow-500/30' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="font-medium text-sm leading-tight">{opp.marketName}</h3>
          {isSimulated && (
            <span className="text-[10px] text-yellow-500 font-mono">SIMULATED</span>
          )}
        </div>
        <Badge
          variant={opp.executable ? 'default' : 'secondary'}
          className={opp.executable ? 'bg-primary text-primary-foreground text-xs' : 'text-xs'}
        >
          {opp.executable ? 'EXECUTABLE' : 'SKIP'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">YES Ask</p>
          <p className="font-mono text-sm font-semibold tabular-nums">${opp.yesAsk.toFixed(4)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">NO Ask</p>
          <p className="font-mono text-sm font-semibold tabular-nums">${opp.noAsk.toFixed(4)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">SUM</p>
          <p className={`font-mono text-sm font-semibold tabular-nums ${
            opp.sum < 1 ? 'text-profit' : opp.sum > 1 ? 'text-loss' : 'text-muted-foreground'
          }`}>
            ${opp.sum.toFixed(4)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Edge</p>
          <p className={`font-mono text-sm font-bold tabular-nums ${
            opp.edge > 0 ? 'text-profit' : opp.edge < 0 ? 'text-loss' : 'text-muted-foreground'
          }`}>
            {opp.edge > 0 ? '+' : ''}{opp.edge.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// Track which opportunities were recently updated for flash animation
const useUpdatedTracking = (opportunities: Opportunity[]) => {
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const prevOpportunitiesRef = useRef<Opportunity[]>([]);

  useEffect(() => {
    const prevOppMap = new Map(prevOpportunitiesRef.current.map(opp => [opp.id, opp]));
    const newUpdated = new Set<string>();

    opportunities.forEach(opp => {
      const prev = prevOppMap.get(opp.id);
      // Mark as updated if it's new or values changed
      if (!prev || prev.yesAsk !== opp.yesAsk || prev.noAsk !== opp.noAsk || prev.edge !== opp.edge) {
        newUpdated.add(opp.id);
      }
    });

    if (newUpdated.size > 0) {
      setRecentlyUpdated(newUpdated);
      // Clear the "recently updated" highlight after 1.5 seconds (matches flash animation duration)
      const timer = setTimeout(() => setRecentlyUpdated(new Set()), 1500);
      return () => clearTimeout(timer);
    }

    prevOpportunitiesRef.current = opportunities;
  }, [opportunities]);

  return recentlyUpdated;
};

export function OpportunitiesTable({ opportunities, lastUpdated, isRefreshing, minEdgeFilter = 0 }: OpportunitiesTableProps) {
  // Use local state to prevent flashing empty state during refresh
  const [displayOpportunities, setDisplayOpportunities] = useState<Opportunity[]>([]);
  
  // Track recently updated rows for visual feedback
  const recentlyUpdated = useUpdatedTracking(displayOpportunities);
  
  // Update display data only when we have new data
  useEffect(() => {
    if (opportunities.length > 0) {
      setDisplayOpportunities(opportunities);
    } else if (opportunities.length === 0 && displayOpportunities.length === 0) {
      // Only clear if we truly have no data and no display data
      setDisplayOpportunities([]);
    }
  }, [opportunities]);

  // Filter opportunities by minimum edge if specified
  const filteredOpportunities = useMemo(() => {
    if (minEdgeFilter <= 0) return displayOpportunities;
    return displayOpportunities.filter(opp => opp.edge >= minEdgeFilter);
  }, [displayOpportunities, minEdgeFilter]);

  const isLoading = opportunities.length === 0 && displayOpportunities.length === 0;
  
  // Use displayOpportunities for loading check to prevent flash
  const showLoading = isLoading;
  const hasData = filteredOpportunities.length > 0;
  const hasUnfilteredData = displayOpportunities.length > 0;
  
  // Check if any opportunity has simulated data
  const hasSimulatedData = displayOpportunities.some(op => op.isMock || op.isSimulated);

  // Check if data was filtered out
  const isFiltered = minEdgeFilter > 0 && hasUnfilteredData && !hasData;
  
  // Count executable opportunities
  const executableCount = displayOpportunities.filter(opp => opp.executable).length;

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
    <div className="glass-panel p-3 sm:p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Arbitrage Opportunities</h2>
          {hasUnfilteredData && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              {filteredOpportunities.length}/{opportunities.length} markets
            </span>
          )}
          {executableCount > 0 && (
            <Badge variant="default" className="text-xs bg-emerald-500">
              {executableCount} executable
            </Badge>
          )}
          {hasSimulatedData && (
            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              SIMULATED
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Live refresh indicator */}
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(lastUpdated)}</span>
            </div>
          )}
          {/* Refresh animation */}
          {isRefreshing && (
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded hover:bg-accent transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                <strong>Edge = 1.00 − (YES + NO)</strong><br/>
                Positive edge means guaranteed profit if both sides fill.<br/>
                <span className="text-muted-foreground">
                  Showing real data from Polymarket API.
                </span>
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filter info banner */}
      {isFiltered && (
        <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-500">
          Showing {filteredOpportunities.length} opportunities with edge ≥ {minEdgeFilter}%
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col rounded-lg border border-border bg-card flex-1 min-h-0 overflow-hidden shadow-sm">
        {showLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading arbitrage opportunities...</p>
              <p className="text-xs text-muted-foreground mt-2">Make sure backend is running on port 3001</p>
            </div>
          </div>
        ) : hasData ? (
          <>
            {/* Fixed Header */}
            <div className="flex-none border-b bg-muted/30">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-muted-foreground font-semibold w-[40%] pl-4 h-10">Market</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right w-[12%] h-10">YES Ask</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right w-[12%] h-10">NO Ask</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right w-[12%] h-10">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 justify-end w-full cursor-help">
                          SUM
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">YES + NO = Sum. Below 1.00 = arbitrage opportunity.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right w-[12%] h-10">Edge %</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-center w-[12%] h-10 pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <Table>
                <TableBody>
                  {filteredOpportunities.map((opp) => (
                    <TableRow
                      key={opp.id}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                        opp.executable && opp.edge > 0 ? 'bg-primary/5 hover:bg-primary/10' : ''
                      } ${recentlyUpdated.has(opp.id) ? 'animate-flash' : ''}`}
                    >
                      <TableCell className="font-medium w-[40%] pl-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={opp.marketName}>{opp.marketName}</span>
                          {(opp.isMock || opp.isSimulated) && (
                            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-mono border border-yellow-500/20">SIM</span>
                          )}
                        </div>
                      </TableCell>
                       <TableCell className="text-right font-mono w-[12%] py-3 tabular-nums font-medium text-foreground/90 transition-colors">
                         ${opp.yesAsk.toFixed(4)}
                       </TableCell>
                       <TableCell className="text-right font-mono w-[12%] py-3 tabular-nums font-medium text-foreground/90 transition-colors">
                         ${opp.noAsk.toFixed(4)}
                       </TableCell>
                       <TableCell className={`text-right font-mono w-[12%] py-3 tabular-nums font-medium transition-colors duration-200 ${
                         opp.sum < 1 ? 'text-emerald-500' : opp.sum > 1 ? 'text-red-500' : 'text-muted-foreground'
                       }`}>
                         ${opp.sum.toFixed(4)}
                       </TableCell>
                       <TableCell className={`text-right font-mono w-[12%] py-3 tabular-nums font-medium transition-colors duration-200 ${
                         opp.edge > 0 ? 'text-emerald-500' : opp.edge < 0 ? 'text-red-500' : 'text-muted-foreground'
                       }`}>
                         {opp.edge > 0 ? '+' : ''}{opp.edge.toFixed(2)}%
                       </TableCell>
                      <TableCell className="text-center w-[12%] py-3 pr-4">
                        <Badge
                          variant={opp.executable ? 'default' : 'outline'}
                          className={`h-6 px-2 ${
                            opp.executable
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                              : 'text-muted-foreground border-border bg-transparent'
                          }`}
                        >
                          {opp.executable ? 'EXECUTE' : 'SKIP'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              {isFiltered ? (
                <>
                  <p className="text-muted-foreground">No opportunities with edge ≥ {minEdgeFilter}%</p>
                  <p className="text-xs text-muted-foreground mt-2">Lower the minimum edge threshold to see more opportunities</p>
                </>
              ) : hasUnfilteredData ? (
                <>
                  <p className="text-muted-foreground">All markets are efficient (edge = 0%)</p>
                  <p className="text-xs text-muted-foreground mt-2">Polymarket's AMM keeps YES + NO ≈ 1.00</p>
                  <p className="text-xs text-muted-foreground mt-1">Real arbitrage requires CLOB order book access</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No arbitrage opportunities found</p>
                  <p className="text-xs text-muted-foreground mt-2">Check backend connection and market data</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {showLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading arbitrage opportunities...</p>
              <p className="text-xs text-muted-foreground mt-2">Make sure backend is running on port 3001</p>
            </div>
          </div>
        ) : hasData ? (
          filteredOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              {isFiltered ? (
                <>
                  <p className="text-muted-foreground">No opportunities with edge ≥ {minEdgeFilter}%</p>
                  <p className="text-xs text-muted-foreground mt-2">Lower the minimum edge threshold</p>
                </>
              ) : hasUnfilteredData ? (
                <>
                  <p className="text-muted-foreground">All markets are efficient</p>
                  <p className="text-xs text-muted-foreground mt-2">Polymarket AMM keeps prices balanced</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">No opportunities found</p>
                  <p className="text-xs text-muted-foreground mt-2">Check backend connection</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
