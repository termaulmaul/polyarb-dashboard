import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { OpportunitiesTable } from '@/components/OpportunitiesTable';
import { BotControlPanel } from '@/components/BotControlPanel';
import { ExecutionLog as ExecutionLogComponent } from '@/components/ExecutionLog';
import { MetricsSidebar } from '@/components/MetricsSidebar';
import { WalletStatus } from '@/components/WalletStatus';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { fetchLiveOpportunities, fetchExecutionLogs, fetchMetrics } from '@/api/polymarket';
import { Opportunity, ExecutionLog, DashboardMetrics, BotConfig } from '@/types/arbitrage';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    enabled: true,
    minEdge: 0, // Show all opportunities, filter by edge threshold
    maxPositionSize: 500,
    maxExecutionWait: 5,
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  // Fetch real data from backend
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [liveOpportunities, liveLogs, liveMetrics] = await Promise.all([
          fetchLiveOpportunities(),
          fetchExecutionLogs(50),
          fetchMetrics()
        ]);

        if (isMounted) {
          setOpportunities(liveOpportunities);
          setExecutionLogs(liveLogs);
          setMetrics(liveMetrics);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        // Fallback to empty arrays if backend is not available
        if (isMounted) {
          setOpportunities([]);
          setExecutionLogs([]);
          setMetrics(null);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Update every 5 seconds for opportunities, 10 seconds for logs/metrics
    const opportunitiesInterval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        const liveOpportunities = await fetchLiveOpportunities();
        if (isMounted) {
          setOpportunities(liveOpportunities);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch opportunities:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, 5000);

    const logsMetricsInterval = setInterval(async () => {
      try {
        const [liveLogs, liveMetrics] = await Promise.all([
          fetchExecutionLogs(50),
          fetchMetrics()
        ]);
        if (isMounted) {
          setExecutionLogs(liveLogs);
          setMetrics(liveMetrics);
        }
      } catch (error) {
        console.error('Failed to fetch logs/metrics:', error);
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      clearInterval(opportunitiesInterval);
      clearInterval(logsMetricsInterval);
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading PolyArb Dashboard...</h2>
          <p className="text-muted-foreground">Fetching data from backend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-2 sm:p-4 pb-0 flex-shrink-0">
        <Header
          botRunning={botConfig.enabled}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full">
              <MetricsSidebar
                metrics={metrics || { todayPnL: 0, tradesExecuted: 0, winRate: 0, avgEdge: 0, pnlHistory: [] }}
                collapsed={false}
                onToggle={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Sidebar - Hidden on mobile, shown on md+ */}
        <div className="hidden md:block flex-shrink-0 h-full">
            <MetricsSidebar
              metrics={metrics || { todayPnL: 0, tradesExecuted: 0, winRate: 0, avgEdge: 0, pnlHistory: [] }}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
        </div>

        {/* Main Dashboard */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile View: Scrollable Stack */}
          <div className="md:hidden flex flex-col gap-4 overflow-y-auto h-full pb-4 pr-1">
            <div className="h-[450px] flex-shrink-0">
              <OpportunitiesTable
                opportunities={opportunities}
                lastUpdated={lastUpdated}
                isRefreshing={isRefreshing}
                minEdgeFilter={botConfig.minEdge}
              />
            </div>
            <div className="h-auto flex-shrink-0">
              <BotControlPanel config={botConfig} onConfigChange={setBotConfig} />
            </div>
            <div className="h-[400px] flex-shrink-0">
                    <ExecutionLogComponent logs={executionLogs} />
            </div>
          </div>

          {/* Desktop View: Resizable Panels */}
          <div className="hidden md:block h-full">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={55} minSize={30} className="p-0.5">
                <OpportunitiesTable
                  opportunities={opportunities}
                  lastUpdated={lastUpdated}
                  isRefreshing={isRefreshing}
                  minEdgeFilter={botConfig.minEdge}
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={45} minSize={30}>
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={40} minSize={30} className="p-0.5">
                    <BotControlPanel config={botConfig} onConfigChange={setBotConfig} />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  <ResizablePanel defaultSize={60} minSize={30} className="p-0.5">
                    <ExecutionLogComponent logs={executionLogs} />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
