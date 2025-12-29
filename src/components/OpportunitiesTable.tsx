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

export function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  return (
    <div className="glass-panel p-4">
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

      <div className="rounded-lg border border-border overflow-hidden">
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
  );
}
