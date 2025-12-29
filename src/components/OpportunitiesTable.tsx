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
import { Info, TrendingUp } from 'lucide-react';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <div className={`p-4 rounded-lg border border-border bg-card transition-all ${
      opp.executable && opp.edge > 0 ? 'glow-profit bg-primary/5' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm leading-tight pr-2 flex-1">{opp.marketName}</h3>
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
          <p className="font-mono text-sm font-semibold">${opp.yesAsk.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">NO Ask</p>
          <p className="font-mono text-sm font-semibold">${opp.noAsk.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">SUM</p>
          <p className={`font-mono text-sm font-semibold ${
            opp.sum < 1 ? 'text-profit' : opp.sum > 1 ? 'text-loss' : 'text-muted-foreground'
          }`}>
            ${opp.sum.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Edge</p>
          <p className={`font-mono text-sm font-bold ${
            opp.edge > 0 ? 'text-profit' : opp.edge < 0 ? 'text-loss' : 'text-muted-foreground'
          }`}>
            {opp.edge > 0 ? '+' : ''}{opp.edge.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  return (
    <div className="glass-panel p-3 sm:p-4 max-h-[60vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Arbitrage Opportunities</h2>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 rounded hover:bg-accent transition-colors">
              <Info className="w-4 h-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-xs">
              <strong>Edge = 1.00 − (YES + NO)</strong><br/>
              Positive edge means guaranteed profit if both sides fill.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden flex-1 min-h-0">
        <div className="max-h-full overflow-y-auto scrollbar-thin">
          <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-medium">Market</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">YES Ask</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">NO Ask</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 justify-end w-full">
                    SUM
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">YES + NO = Sum. Below 1.00 = arbitrage opportunity.</p>
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Edge %</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow
                key={opp.id}
                className={`border-border transition-all ${
                  opp.executable && opp.edge > 0 ? 'glow-profit bg-primary/5' : ''
                }`}
              >
                <TableCell className="font-medium max-w-[250px] truncate">
                  {opp.marketName}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${opp.yesAsk.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${opp.noAsk.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-mono ${
                  opp.sum < 1 ? 'text-profit' : opp.sum > 1 ? 'text-loss' : 'text-muted-foreground'
                }`}>
                  ${opp.sum.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-mono font-semibold ${
                  opp.edge > 0 ? 'text-profit' : opp.edge < 0 ? 'text-loss' : 'text-muted-foreground'
                }`}>
                  {opp.edge > 0 ? '+' : ''}{opp.edge.toFixed(1)}%
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={opp.executable ? 'default' : 'secondary'}
                    className={opp.executable ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {opp.executable ? 'EXECUTABLE' : 'SKIP'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  );
}
