import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { OpportunitiesTable } from '@/components/OpportunitiesTable';
import { BotControlPanel } from '@/components/BotControlPanel';
import { ExecutionLog } from '@/components/ExecutionLog';
import { MetricsSidebar } from '@/components/MetricsSidebar';
import { mockOpportunities, mockExecutionLogs, mockMetrics } from '@/data/mockData';
import { BotConfig, Opportunity } from '@/types/arbitrage';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    enabled: true,
    minEdge: 1.5,
    maxPositionSize: 500,
    maxExecutionWait: 5,
  });
  const [opportunities, setOpportunities] = useState(mockOpportunities);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOpportunities((prev) =>
        prev.map((opp) => {
          const yesVariance = (Math.random() - 0.5) * 0.02;
          const noVariance = (Math.random() - 0.5) * 0.02;
          const newYes = Math.max(0.01, Math.min(0.99, opp.yesAsk + yesVariance));
          const newNo = Math.max(0.01, Math.min(0.99, opp.noAsk + noVariance));
          const newSum = newYes + newNo;
          const newEdge = (1 - newSum) * 100;
          
          return {
            ...opp,
            yesAsk: parseFloat(newYes.toFixed(2)),
            noAsk: parseFloat(newNo.toFixed(2)),
            sum: parseFloat(newSum.toFixed(2)),
            edge: parseFloat(newEdge.toFixed(1)),
            executable: newEdge >= botConfig.minEdge,
            updatedAt: new Date(),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [botConfig.minEdge]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 pb-0">
          <Header botRunning={botConfig.enabled} walletBalance={12847.52} />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          {/* Sidebar */}
          <MetricsSidebar
            metrics={mockMetrics}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Dashboard */}
          <main className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Opportunities Table */}
            <div className="flex-shrink-0">
              <OpportunitiesTable opportunities={opportunities} />
            </div>

            {/* Bottom Section: Control Panel + Execution Log */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
              <BotControlPanel config={botConfig} onConfigChange={setBotConfig} />
              <ExecutionLog logs={mockExecutionLogs} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
